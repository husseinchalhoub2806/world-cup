import pytest


def test_register_success(client):
    resp = client.post("/api/v1/auth/register", json={
        "nickname": "newuser",
        "real_name": "New User",
        "password": "pass1234",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["nickname"] == "newuser"
    assert data["status"] == "pending"
    assert data["role"] == "regular_user"


def test_register_duplicate_nickname(client):
    payload = {"nickname": "dup", "real_name": "Dup User", "password": "pass1234"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_short_password(client):
    resp = client.post("/api/v1/auth/register", json={
        "nickname": "user1",
        "real_name": "User One",
        "password": "ab",
    })
    assert resp.status_code == 422


def test_login_success(client, regular_user):
    resp = client.post("/api/v1/auth/login", json={
        "nickname": "testuser",
        "password": "testpass",
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["nickname"] == "testuser"


def test_login_wrong_password(client, regular_user):
    resp = client.post("/api/v1/auth/login", json={
        "nickname": "testuser",
        "password": "wrongpassword",
    })
    assert resp.status_code == 401


def test_login_unknown_user(client):
    resp = client.post("/api/v1/auth/login", json={
        "nickname": "nobody",
        "password": "irrelevant",
    })
    assert resp.status_code == 401


def test_get_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["nickname"] == "testuser"


def test_get_me_no_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_pending_user_cannot_access_matches(client, pending_user):
    from app.core.security import create_access_token
    token = create_access_token(pending_user.id)
    resp = client.get("/api/v1/matches", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
