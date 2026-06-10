from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.orm import Session

from app.models.match import Match, MatchStatus
from app.schemas.match import MatchCreate, MatchUpdate


def get_match_by_id(db: Session, match_id: int) -> Optional[Match]:
    return db.query(Match).filter(Match.id == match_id).first()


def get_match_by_external_id(db: Session, external_id: str) -> Optional[Match]:
    return db.query(Match).filter(Match.external_id == external_id).first()


def get_all_matches(db: Session) -> list[Match]:
    """Admin: all matches regardless of visibility window."""
    return db.query(Match).order_by(Match.match_datetime.asc()).all()


def get_visible_matches(db: Session) -> list[Match]:
    """
    Regular users see a match when:
    - It starts within the next 240 hours (visibility window), OR
    - It is live or finished (so users can see ongoing/completed matches)

    Draft and cancelled matches are hidden from regular users.
    """
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # Naive UTC for DB comparison
    visibility_cutoff = now + timedelta(hours=240)

    return (
        db.query(Match)
        .filter(
            Match.status != MatchStatus.cancelled,
            Match.status != MatchStatus.draft,
            (Match.match_datetime <= visibility_cutoff)
            | Match.status.in_([MatchStatus.live, MatchStatus.finished]),
        )
        .order_by(Match.match_datetime.asc())
        .all()
    )


def create_match(db: Session, data: MatchCreate) -> Match:
    match = Match(
        team1=data.team1,
        team2=data.team2,
        match_datetime=data.match_datetime,
        status=MatchStatus.scheduled,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def create_draft_match(
    db: Session,
    external_id: str,
    team1: str,
    team2: str,
    match_datetime: datetime,
) -> Match:
    match = Match(
        team1=team1,
        team2=team2,
        match_datetime=match_datetime,
        status=MatchStatus.draft,
        external_id=external_id,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


def approve_draft_match(db: Session, match: Match) -> Match:
    match.status = MatchStatus.scheduled
    db.commit()
    db.refresh(match)
    return match


def approve_all_draft_matches(db: Session) -> int:
    count = (
        db.query(Match)
        .filter(Match.status == MatchStatus.draft)
        .update({"status": MatchStatus.scheduled})
    )
    db.commit()
    return count


def update_match(db: Session, match: Match, data: MatchUpdate) -> Match:
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(match, field, value)
    db.commit()
    db.refresh(match)
    return match


def set_match_result(
    db: Session, match: Match, score_team1: int, score_team2: int
) -> Match:
    match.score_team1 = score_team1
    match.score_team2 = score_team2
    match.status = MatchStatus.finished
    db.commit()
    db.refresh(match)
    return match


def delete_match(db: Session, match: Match) -> None:
    db.delete(match)
    db.commit()
