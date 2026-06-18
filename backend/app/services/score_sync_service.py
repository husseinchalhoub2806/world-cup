import asyncio

from loguru import logger
from sqlalchemy.orm import Session

from app.crud.crud_match import set_match_live_score, set_match_result
from app.db.session import SessionLocal
from app.models.match import Match, MatchStatus
from app.services.scoring_service import score_match
from app.services.sportsdb_service import SportsDbError, fetch_world_cup_fixtures


def sync_scores_once(db: Session) -> None:
    try:
        fixtures = fetch_world_cup_fixtures()
    except SportsDbError as exc:
        logger.warning("Score sync: TheSportsDB unavailable: {}", exc)
        return

    fixture_map = {f["external_id"]: f for f in fixtures}

    matches: list[Match] = (
        db.query(Match)
        .filter(
            Match.external_id.isnot(None),
            Match.status.in_([MatchStatus.scheduled, MatchStatus.live]),
        )
        .all()
    )

    for match in matches:
        fixture = fixture_map.get(match.external_id)
        if not fixture:
            continue

        score1 = fixture["score_team1"]
        score2 = fixture["score_team2"]
        is_final = fixture["is_final"]

        if score1 is None or score2 is None:
            continue  # match not started yet

        if is_final:
            logger.info(
                "Score sync: match {} ({} vs {}) finished {}-{}",
                match.id, match.team1, match.team2, score1, score2,
            )
            set_match_result(db, match, score1, score2)
            score_match(db, match)
        else:
            score_changed = match.score_team1 != score1 or match.score_team2 != score2
            if score_changed or match.status != MatchStatus.live:
                logger.info(
                    "Score sync: match {} ({} vs {}) live {}-{}",
                    match.id, match.team1, match.team2, score1, score2,
                )
                set_match_live_score(db, match, score1, score2)


def _sync_with_session() -> None:
    db = SessionLocal()
    try:
        sync_scores_once(db)
    finally:
        db.close()


async def run_score_sync_loop() -> None:
    logger.info("Score sync: background loop started (interval=60s)")
    while True:
        try:
            await asyncio.to_thread(_sync_with_session)
        except Exception as exc:
            logger.exception("Score sync: unexpected error: {}", exc)
        await asyncio.sleep(60)
