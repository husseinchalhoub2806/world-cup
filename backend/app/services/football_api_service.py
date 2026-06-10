from datetime import datetime, timezone

import httpx
from loguru import logger

from app.core.config import settings


class FootballApiError(Exception):
    pass


def fetch_world_cup_fixtures() -> list[dict]:
    """
    Fetches World Cup fixtures from api-football.com.
    Returns a list of dicts: {external_id, team1, team2, match_datetime (naive UTC)}.
    """
    if not settings.FOOTBALL_API_KEY:
        raise FootballApiError("FOOTBALL_API_KEY is not configured — set it in .env")

    url = f"{settings.FOOTBALL_API_BASE_URL}/fixtures"
    params = {"league": settings.FOOTBALL_LEAGUE_ID, "season": settings.FOOTBALL_SEASON}
    headers = {"x-apisports-key": settings.FOOTBALL_API_KEY}

    logger.info(
        "Fetching fixtures from api-football.com (league={}, season={})",
        settings.FOOTBALL_LEAGUE_ID,
        settings.FOOTBALL_SEASON,
    )

    try:
        response = httpx.get(url, headers=headers, params=params, timeout=30.0)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise FootballApiError(
            f"api-football returned HTTP {exc.response.status_code}"
        ) from exc
    except httpx.RequestError as exc:
        raise FootballApiError(f"Network error fetching fixtures: {exc}") from exc

    data = response.json()

    errors = data.get("errors", {})
    if errors:
        raise FootballApiError(f"api-football error: {errors}")

    raw_fixtures = data.get("response", [])
    logger.info("api-football returned {} raw fixtures", len(raw_fixtures))

    results = []
    for item in raw_fixtures:
        fixture = item.get("fixture", {})
        teams = item.get("teams", {})

        external_id = str(fixture.get("id", ""))
        date_str = fixture.get("date", "")
        team1 = teams.get("home", {}).get("name", "")
        team2 = teams.get("away", {}).get("name", "")

        if not external_id or not date_str or not team1 or not team2:
            logger.warning("Skipping fixture with incomplete data: {}", fixture.get("id"))
            continue

        try:
            match_dt = datetime.fromisoformat(date_str)
            if match_dt.tzinfo is not None:
                match_dt = match_dt.astimezone(timezone.utc).replace(tzinfo=None)
        except ValueError as exc:
            logger.warning("Skipping fixture {}: invalid date '{}': {}", external_id, date_str, exc)
            continue

        results.append(
            {
                "external_id": external_id,
                "team1": team1,
                "team2": team2,
                "match_datetime": match_dt,
            }
        )

    logger.info("Parsed {} valid fixtures", len(results))
    return results
