from datetime import datetime, timezone
from typing import Optional

import httpx
from loguru import logger

from app.core.config import settings


class SportsDbError(Exception):
    pass


def _fetch_raw_events() -> list[dict]:
    url = f"{settings.SPORTSDB_BASE_URL}/{settings.SPORTSDB_API_KEY}/eventsseason.php"
    params = {"id": settings.SPORTSDB_LEAGUE_ID, "s": settings.SPORTSDB_SEASON}

    logger.info(
        "Fetching fixtures from TheSportsDB (league={}, season={})",
        settings.SPORTSDB_LEAGUE_ID,
        settings.SPORTSDB_SEASON,
    )

    try:
        response = httpx.get(url, params=params, timeout=30.0)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise SportsDbError(f"TheSportsDB returned HTTP {exc.response.status_code}") from exc
    except httpx.RequestError as exc:
        raise SportsDbError(f"Network error fetching fixtures: {exc}") from exc

    data = response.json()
    raw_events = data.get("events") or []
    logger.info("TheSportsDB returned {} raw events", len(raw_events))
    return raw_events


def fetch_world_cup_fixtures() -> list[dict]:
    """
    Returns all fixtures as dicts:
    {external_id, team1, team2, match_datetime (naive UTC), score_team1, score_team2}.
    score_team1/score_team2 are None when the match hasn't been played yet.
    """
    raw_events = _fetch_raw_events()

    if not raw_events:
        logger.warning(
            "TheSportsDB returned no events for league={} season={}",
            settings.SPORTSDB_LEAGUE_ID,
            settings.SPORTSDB_SEASON,
        )
        return []

    results = []
    for event in raw_events:
        external_id = str(event.get("idEvent", ""))
        team1 = event.get("strHomeTeam", "")
        team2 = event.get("strAwayTeam", "")

        if not external_id or not team1 or not team2:
            logger.warning("Skipping event with missing fields: {}", event.get("idEvent"))
            continue

        match_dt = _parse_datetime(event, external_id)
        if match_dt is None:
            continue

        results.append(
            {
                "external_id": external_id,
                "team1": team1,
                "team2": team2,
                "match_datetime": match_dt,
                "score_team1": _parse_score(event.get("intHomeScore")),
                "score_team2": _parse_score(event.get("intAwayScore")),
                "is_final": _is_final_status(event.get("strStatus", "")),
                "actual_winner": _extract_actual_winner(event),
                "is_knockout": _is_knockout_round(event.get("strRound", "")),
            }
        )

    logger.info(
        "Parsed {} valid fixtures ({} with scores, {} final)",
        len(results),
        sum(1 for r in results if r["score_team1"] is not None),
        sum(1 for r in results if r["is_final"]),
    )
    return results


# TheSportsDB status values that indicate the match result is final
_FINAL_STATUSES = {"Match Finished", "FT", "AET", "PEN", "AP"}

# Substrings that identify a knockout-phase round (case-insensitive)
_KNOCKOUT_ROUND_KEYWORDS = {
    "round of 16", "round of 32", "2nd round", "3rd round",
    "quarter-final", "quarter final", "quarterfinal",
    "semi-final", "semi final", "semifinal",
    "3rd place", "third place",
    "final",
}


def _is_knockout_round(round_str: str) -> bool:
    r = round_str.lower().strip()
    return any(kw in r for kw in _KNOCKOUT_ROUND_KEYWORDS)


def _is_final_status(status: str) -> bool:
    return status.strip() in _FINAL_STATUSES


def _extract_actual_winner(event: dict) -> Optional[str]:
    """
    Returns "team1", "team2", or None.
    For penalty matches TheSportsDB provides intHomeScorePenalty / intAwayScorePenalty.
    For all other matches the winner is derived from the score, so None is correct.
    """
    status = event.get("strStatus", "").strip()
    if status not in ("PEN", "AP"):
        return None

    home_pen = _parse_score(event.get("intHomeScorePenalty"))
    away_pen = _parse_score(event.get("intAwayScorePenalty"))
    if home_pen is not None and away_pen is not None:
        if home_pen > away_pen:
            return "team1"
        if away_pen > home_pen:
            return "team2"

    logger.warning(
        "Penalty match (event={}) has no penalty scores — actual_winner not set; admin must enter manually.",
        event.get("idEvent"),
    )
    return None


def _parse_score(value) -> Optional[int]:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def _parse_datetime(event: dict, external_id: str) -> Optional[datetime]:
    timestamp = event.get("strTimestamp")
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp)
            if dt.tzinfo is not None:
                dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
            return dt
        except ValueError:
            pass

    date_str = event.get("dateEvent", "")
    time_str = event.get("strTime", "")
    if date_str and time_str:
        try:
            return datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass

    logger.warning("Skipping event {}: could not parse datetime", external_id)
    return None
