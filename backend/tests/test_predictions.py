from datetime import datetime, timedelta, timezone

import pytest

from app.models.match import Match, MatchStatus


def make_match(db, hours_from_now: float = 6, status=MatchStatus.scheduled):
    """Helper: create a match with kickoff N hours from now."""
    dt = (datetime.now(timezone.utc) + timedelta(hours=hours_from_now)).replace(tzinfo=None)
    match = Match(
        team1="Brazil",
        team2="Argentina",
        match_datetime=dt,
        status=status,
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


VALID_PREDICTION = {
    "predicted_winner": "team1",
    "predicted_score_team1": 2,
    "predicted_score_team2": 1,
}


def test_submit_prediction_success(client, auth_headers, db):
    match = make_match(db)
    resp = client.post(f"/api/v1/predictions/{match.id}", json=VALID_PREDICTION, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["predicted_winner"] == "team1"
    assert data["predicted_score_team1"] == 2
    assert data["points_earned"] is None


def test_submit_prediction_updates_existing(client, auth_headers, db):
    match = make_match(db)
    client.post(f"/api/v1/predictions/{match.id}", json=VALID_PREDICTION, headers=auth_headers)

    updated = {
        "predicted_winner": "team2",
        "predicted_score_team1": 0,
        "predicted_score_team2": 1,
    }
    resp = client.post(f"/api/v1/predictions/{match.id}", json=updated, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["predicted_winner"] == "team2"


def test_prediction_locked_after_kickoff(client, auth_headers, db):
    match = make_match(db, hours_from_now=-1)  # Kickoff was 1 hour ago
    resp = client.post(f"/api/v1/predictions/{match.id}", json=VALID_PREDICTION, headers=auth_headers)
    assert resp.status_code == 400
    assert "closed" in resp.json()["detail"].lower()


def test_prediction_inconsistent_score_winner(client, auth_headers, db):
    match = make_match(db)
    bad_prediction = {
        "predicted_winner": "team1",
        "predicted_score_team1": 0,  # team1 can't win when strictly losing on score
        "predicted_score_team2": 2,
    }
    resp = client.post(f"/api/v1/predictions/{match.id}", json=bad_prediction, headers=auth_headers)
    assert resp.status_code == 422


def test_get_my_predictions(client, auth_headers, db):
    match = make_match(db)
    client.post(f"/api/v1/predictions/{match.id}", json=VALID_PREDICTION, headers=auth_headers)
    resp = client.get("/api/v1/predictions", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_match_not_visible_before_window(client, auth_headers, db):
    match = make_match(db, hours_from_now=241)  # 241h away — outside 240h window
    resp = client.get("/api/v1/matches", headers=auth_headers)
    match_ids = [m["id"] for m in resp.json()]
    assert match.id not in match_ids


def test_match_visible_within_window(client, auth_headers, db):
    match = make_match(db, hours_from_now=6)  # 6h away — inside 240h window
    resp = client.get("/api/v1/matches", headers=auth_headers)
    match_ids = [m["id"] for m in resp.json()]
    assert match.id in match_ids
