def register(client, username):
    """Register a user and return a client carrying their bearer token."""
    response = client.post(
        "/api/register", json={"username": username, "password": "correct-horse"}
    )
    client.headers["Authorization"] = f"Bearer {response.json()['access_token']}"
    return client


def test_save_a_result(auth_client):
    response = auth_client.post(
        "/api/results", json={"passage_id": 1, "wpm": 62.5, "accuracy": 97.0}
    )

    assert response.status_code == 201
    body = response.json()
    assert body["wpm"] == 62.5
    assert body["accuracy"] == 97.0
    assert body["passage_id"] == 1


def test_saving_requires_authentication(client):
    response = client.post(
        "/api/results", json={"passage_id": 1, "wpm": 60, "accuracy": 100}
    )
    assert response.status_code == 401


def test_history_requires_authentication(client):
    assert client.get("/api/users/me/results").status_code == 401


def test_history_starts_empty(auth_client):
    response = auth_client.get("/api/users/me/results")

    assert response.status_code == 200
    assert response.json() == []


def test_saved_results_appear_in_history(auth_client):
    auth_client.post(
        "/api/results", json={"passage_id": 1, "wpm": 60, "accuracy": 95}
    )
    auth_client.post(
        "/api/results", json={"passage_id": 2, "wpm": 70, "accuracy": 99}
    )

    history = auth_client.get("/api/users/me/results").json()

    assert len(history) == 2
    assert {r["wpm"] for r in history} == {60, 70}


def test_history_is_newest_first(auth_client):
    for wpm in (50, 60, 70):
        auth_client.post(
            "/api/results", json={"passage_id": 1, "wpm": wpm, "accuracy": 90}
        )

    history = auth_client.get("/api/users/me/results").json()

    assert [r["wpm"] for r in history] == [70, 60, 50]


def test_a_user_only_sees_their_own_results(client):
    register(client, "alice")
    client.post("/api/results", json={"passage_id": 1, "wpm": 80, "accuracy": 99})

    register(client, "bob")
    client.post("/api/results", json={"passage_id": 1, "wpm": 40, "accuracy": 70})

    bob_history = client.get("/api/users/me/results").json()
    assert [r["wpm"] for r in bob_history] == [40]

    # Alice already exists, so log in rather than register.
    login = client.post(
        "/api/token", data={"username": "alice", "password": "correct-horse"}
    )
    client.headers["Authorization"] = f"Bearer {login.json()['access_token']}"

    alice_history = client.get("/api/users/me/results").json()
    assert [r["wpm"] for r in alice_history] == [80]


def test_result_for_a_missing_passage_404s(auth_client):
    response = auth_client.post(
        "/api/results", json={"passage_id": 999, "wpm": 60, "accuracy": 100}
    )
    assert response.status_code == 404


def test_impossible_accuracy_is_rejected(auth_client):
    over = auth_client.post(
        "/api/results", json={"passage_id": 1, "wpm": 60, "accuracy": 101}
    )
    under = auth_client.post(
        "/api/results", json={"passage_id": 1, "wpm": 60, "accuracy": -1}
    )

    assert over.status_code == 422
    assert under.status_code == 422


def test_negative_wpm_is_rejected(auth_client):
    response = auth_client.post(
        "/api/results", json={"passage_id": 1, "wpm": -5, "accuracy": 90}
    )
    assert response.status_code == 422


def test_client_cannot_write_a_result_for_another_user(client, session):
    from sqlmodel import select

    from app.models import Result, User

    register(client, "alice")
    register(client, "bob")
    bob = session.exec(select(User).where(User.username == "bob")).one()

    # Bob's token, but a body that tries to claim the result belongs to alice.
    client.post(
        "/api/results",
        json={"passage_id": 1, "wpm": 99, "accuracy": 100, "user_id": 1},
    )

    result = session.exec(select(Result)).one()
    assert result.user_id == bob.id, "user_id must come from the token, not the body"
