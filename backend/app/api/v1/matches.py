from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_approved_user, get_db
from app.crud.crud_match import get_match_by_id, get_visible_matches
from app.crud.crud_prediction import get_prediction
from app.models.user import User
from app.schemas.match import MatchResponse

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchResponse])
def list_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    """Returns matches visible to the current user (within 240h window or live/finished)."""
    return get_visible_matches(db)


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_approved_user),
):
    match = get_match_by_id(db, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    # Verify visibility for regular users
    from datetime import datetime, timedelta, timezone
    from app.models.match import MatchStatus

    if current_user.role.value != "admin":
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        visibility_cutoff = now + timedelta(hours=240)
        is_visible = (
            match.match_datetime <= visibility_cutoff
            or match.status in (MatchStatus.live, MatchStatus.finished)
        )
        if not is_visible or match.status == MatchStatus.cancelled:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    return match
