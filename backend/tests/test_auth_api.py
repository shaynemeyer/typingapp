import jwt
import pytest
from sqlmodel import select

from app.auth import ALGORITHM, SECRET_KEY, hash_password, verify_password
from app.models import User

CREDS = {"username": "shayne", "password": "correct-horse"}


def test_register_returns_a_token(client):
    response = client.post("/api/register", json=CREDS)

    assert response.status_code == 201
    assert response.json()["token_type"] == "bearer"
    assert response.json()["access_token"]


def test_register_rejects_a_duplicate_username(client):
    client.post("/api/register", json=CREDS)
    second = client.post("/api/register", json=CREDS)

    assert second.status_code == 409


def test_register_rejects_a_short_password(client):
    response = client.post(
        "/api/register", json={"username": "shayne", "password": "short"}
    )
    assert response.status_code == 422


def test_password_is_stored_hashed_not_plaintext(client, session):
    client.post("/api/register", json=CREDS)

    user = session.exec(select(User).where(User.username == "shayne")).one()
    assert user.hashed_password != CREDS["password"]
    assert user.hashed_password.startswith("$argon2id$")
    assert verify_password(CREDS["password"], user.hashed_password)


def test_register_response_never_leaks_the_hash(client):
    body = client.post("/api/register", json=CREDS).text
    assert "argon2" not in body
    assert "hashed_password" not in body


def test_login_with_correct_password_returns_a_token(client):
    client.post("/api/register", json=CREDS)

    response = client.post("/api/token", data=CREDS)

    assert response.status_code == 200
    assert response.json()["access_token"]


def test_login_with_wrong_password_is_rejected(client):
    client.post("/api/register", json=CREDS)

    response = client.post(
        "/api/token", data={"username": "shayne", "password": "wrong"}
    )
    assert response.status_code == 401


def test_login_as_unknown_user_is_rejected(client):
    response = client.post(
        "/api/token", data={"username": "nobody", "password": "correct-horse"}
    )
    assert response.status_code == 401


def test_me_returns_the_current_user(auth_client):
    response = auth_client.get("/api/users/me")

    assert response.status_code == 200
    assert response.json()["username"] == "shayne"
    assert "hashed_password" not in response.json()


def test_me_without_a_token_is_rejected(client):
    assert client.get("/api/users/me").status_code == 401


def test_me_with_a_garbage_token_is_rejected(client):
    client.headers["Authorization"] = "Bearer not-a-real-jwt"
    assert client.get("/api/users/me").status_code == 401


def test_token_signed_with_a_different_secret_is_rejected(client):
    forged = jwt.encode({"sub": "shayne"}, "attacker-secret", algorithm=ALGORITHM)
    client.headers["Authorization"] = f"Bearer {forged}"

    assert client.get("/api/users/me").status_code == 401


def test_expired_token_is_rejected(client):
    client.post("/api/register", json=CREDS)
    expired = jwt.encode(
        {"sub": "shayne", "exp": 1_000_000_000}, SECRET_KEY, algorithm=ALGORITHM
    )
    client.headers["Authorization"] = f"Bearer {expired}"

    assert client.get("/api/users/me").status_code == 401


def test_valid_token_for_a_deleted_user_is_rejected(client, session):
    token = client.post("/api/register", json=CREDS).json()["access_token"]
    user = session.exec(select(User).where(User.username == "shayne")).one()
    session.delete(user)
    session.commit()

    client.headers["Authorization"] = f"Bearer {token}"
    assert client.get("/api/users/me").status_code == 401


@pytest.mark.parametrize("password", ["hunter2xx", "another-one", "p@ssw0rd!"])
def test_hashes_are_salted_and_verify(password):
    first = hash_password(password)
    second = hash_password(password)

    assert first != second, "identical passwords must not produce identical hashes"
    assert verify_password(password, first)
    assert verify_password(password, second)
    assert not verify_password("wrong-password", first)
