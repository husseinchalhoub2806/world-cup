from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.crud.crud_match import (
    approve_all_draft_matches,
    approve_draft_match,
    create_draft_match,
    create_match,
    delete_match,
    get_all_matches,
    get_match_by_external_id,
    get_match_by_id,
    set_match_result,
    update_match,
)
from app.crud.crud_prediction import get_all_predictions, get_match_predictions
from app.crud.crud_user import (
    delete_user,
    get_all_users,
    get_user_by_id,
    update_user_role,
    update_user_status,
)
from app.models.user import User, UserRole, UserStatus
from app.schemas.leaderboard import LeaderboardResponse
from app.schemas.match import MatchCreate, MatchImportResponse, MatchResponse, MatchResultInput, MatchScoreImportResponse, MatchUpdate
from app.schemas.prediction import PredictionResponse, PredictionWithMatchResponse
from app.schemas.user import AdminUserUpdate, UserResponse
from app.services.leaderboard_service import get_leaderboard
from app.services.scoring_service import score_match

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Users ──────────────────────────────────────────────────────────────────────

@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return get_all_users(db)


@router.patch("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot modify their own account via this endpoint",
        )

    if data.status is not None:
        user = update_user_status(db, user, data.status)
        logger.info("Admin {} set user '{}' status → {}", admin.nickname, user.nickname, data.status)

    if data.role is not None:
        user = update_user_role(db, user, data.role)
        logger.info("Admin {} set user '{}' role → {}", admin.nickname, user.nickname, data.role)

    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin cannot delete their own account",
        )

    logger.warning("Admin {} deleted user '{}' (id={})", admin.nickname, user.nickname, user.id)
    delete_user(db, user)


# ── Matches ────────────────────────────────────────────────────────────────────

@router.get("/matches", response_model=list[MatchResponse])
def list_all_matches(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return get_all_matches(db)


@router.post("/matches", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_new_match(
    data: MatchCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = create_match(db, data)
    logger.info(
        "Admin {} created match {}: {} vs {} @ {}",
        admin.nickname, match.id, match.team1, match.team2, match.match_datetime,
    )
    return match


@router.patch("/matches/{match_id}", response_model=MatchResponse)
def edit_match(
    match_id: int,
    data: MatchUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    match = update_match(db, match, data)
    logger.info("Admin {} updated match {}", admin.nickname, match_id)
    return match


@router.delete("/matches/{match_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_match(
    match_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    logger.warning("Admin {} deleted match {} ({} vs {})", admin.nickname, match_id, match.team1, match.team2)
    delete_match(db, match)


@router.post("/matches/import", response_model=MatchImportResponse)
def import_matches_from_api(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Fetch World Cup fixtures from api-football.com and create them as draft matches."""
    from app.services.sportsdb_service import SportsDbError, fetch_world_cup_fixtures

    try:
        fixtures = fetch_world_cup_fixtures()
    except SportsDbError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    imported = 0
    skipped = 0
    for fixture in fixtures:
        if get_match_by_external_id(db, fixture["external_id"]):
            skipped += 1
            continue
        create_draft_match(
            db,
            external_id=fixture["external_id"],
            team1=fixture["team1"],
            team2=fixture["team2"],
            match_datetime=fixture["match_datetime"],
        )
        imported += 1

    logger.info(
        "Admin {} imported {} draft matches from api-football ({} already existed)",
        admin.nickname, imported, skipped,
    )
    return {"imported": imported, "skipped": skipped}


@router.post("/matches/import-results", response_model=MatchScoreImportResponse)
def import_results_from_api(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Fetch finished fixtures from TheSportsDB and auto-score any unscored matches."""
    from app.models.match import MatchStatus as MS
    from app.services.sportsdb_service import SportsDbError, fetch_world_cup_fixtures

    try:
        fixtures = fetch_world_cup_fixtures()
    except SportsDbError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    updated = skipped = not_found = 0

    for fixture in fixtures:
        if fixture["score_team1"] is None or fixture["score_team2"] is None:
            continue  # match not played yet

        match = get_match_by_external_id(db, fixture["external_id"])
        if not match:
            not_found += 1
            continue

        if match.status == MS.finished:
            skipped += 1
            continue

        match = set_match_result(db, match, fixture["score_team1"], fixture["score_team2"])
        scored_count = score_match(db, match)
        updated += 1
        logger.info(
            "Admin {} imported result for match {} ({} vs {}): {}-{}. Scored {} predictions.",
            admin.nickname, match.id, match.team1, match.team2,
            fixture["score_team1"], fixture["score_team2"], scored_count,
        )

    logger.info(
        "Admin {} bulk-imported results: {} updated, {} skipped, {} not found",
        admin.nickname, updated, skipped, not_found,
    )
    return {"updated": updated, "skipped": skipped, "not_found": not_found}


@router.post("/matches/{match_id}/approve", response_model=MatchResponse)
def approve_match(
    match_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Approve a draft match — sets status to scheduled, making it visible to users."""
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    from app.models.match import MatchStatus as MS
    if match.status != MS.draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft matches can be approved",
        )

    match = approve_draft_match(db, match)
    logger.info(
        "Admin {} approved draft match {}: {} vs {} @ {}",
        admin.nickname, match_id, match.team1, match.team2, match.match_datetime,
    )
    return match


@router.post("/matches/approve-all", response_model=dict)
def approve_all_matches(
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Approve all draft matches at once."""
    count = approve_all_draft_matches(db)
    logger.info("Admin {} bulk-approved {} draft matches", admin.nickname, count)
    return {"approved": count}


@router.post("/matches/{match_id}/result", response_model=MatchResponse)
def enter_match_result(
    match_id: int,
    result: MatchResultInput,
    db: Session = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Enter the final score for a match and auto-calculate points for all predictions."""
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    from app.models.match import MatchStatus
    if match.status in (MatchStatus.cancelled, MatchStatus.draft):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot set result for a cancelled or draft match",
        )

    match = set_match_result(db, match, result.score_team1, result.score_team2)

    # Auto-score all predictions for this match
    scored_count = score_match(db, match)
    logger.info(
        "Admin {} entered result for match {}: {}-{}. Scored {} predictions.",
        admin.nickname, match_id, result.score_team1, result.score_team2, scored_count,
    )
    return match


# ── Predictions ────────────────────────────────────────────────────────────────

@router.get("/predictions", response_model=list[PredictionWithMatchResponse])
def list_all_predictions(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    predictions = get_all_predictions(db)
    result = []
    for p in predictions:
        result.append(
            PredictionWithMatchResponse(
                id=p.id,
                user_id=p.user_id,
                match_id=p.match_id,
                predicted_winner=p.predicted_winner,
                predicted_score_team1=p.predicted_score_team1,
                predicted_score_team2=p.predicted_score_team2,
                points_earned=p.points_earned,
                created_at=p.created_at,
                match_team1=p.match.team1,
                match_team2=p.match.team2,
                match_datetime=p.match.match_datetime,
                match_status=p.match.status.value,
                user_nickname=p.user.nickname,
                user_real_name=p.user.real_name,
            )
        )
    return result


@router.get("/predictions/match/{match_id}", response_model=list[PredictionResponse])
def list_match_predictions(
    match_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return get_match_predictions(db, match_id)


# ── Analytics ─────────────────────────────────────────────────────────────────

@router.get("/leaderboard", response_model=LeaderboardResponse)
def admin_leaderboard(db: Session = Depends(get_db), _: User = Depends(get_current_admin)):
    return get_leaderboard(db)
