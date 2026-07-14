from app.seed import PASSAGES


def test_next_returns_a_seeded_passage(client):
    response = client.get("/api/passages/next")

    assert response.status_code == 200
    assert response.json()["text"] in PASSAGES


def test_next_is_random_across_calls(client):
    seen = {client.get("/api/passages/next").json()["id"] for _ in range(40)}

    assert len(seen) > 1, "next_passage always returned the same passage"


def test_list_returns_all_seeded_passages(client):
    response = client.get("/api/passages")

    assert response.status_code == 200
    assert [p["text"] for p in response.json()] == PASSAGES


def test_create_adds_a_passage(auth_client):
    response = auth_client.post("/api/passages", json={"text": "A brand new passage."})

    assert response.status_code == 201
    assert response.json()["text"] == "A brand new passage."
    assert len(auth_client.get("/api/passages").json()) == len(PASSAGES) + 1


def test_create_rejects_empty_text(auth_client):
    assert auth_client.post("/api/passages", json={"text": ""}).status_code == 422


def test_update_changes_the_text(auth_client):
    response = auth_client.put("/api/passages/1", json={"text": "Edited."})

    assert response.status_code == 200
    assert response.json()["text"] == "Edited."
    assert auth_client.get("/api/passages").json()[0]["text"] == "Edited."


def test_update_missing_passage_404s(auth_client):
    assert auth_client.put("/api/passages/999", json={"text": "x"}).status_code == 404


def test_delete_removes_a_passage(auth_client):
    assert auth_client.delete("/api/passages/1").status_code == 204
    assert len(auth_client.get("/api/passages").json()) == len(PASSAGES) - 1


def test_delete_missing_passage_404s(auth_client):
    assert auth_client.delete("/api/passages/999").status_code == 404


def test_writes_require_authentication(client):
    """Reading is open; creating, editing and deleting are not."""
    assert client.post("/api/passages", json={"text": "x"}).status_code == 401
    assert client.put("/api/passages/1", json={"text": "x"}).status_code == 401
    assert client.delete("/api/passages/1").status_code == 401


def test_reads_stay_open(client):
    assert client.get("/api/passages").status_code == 200
    assert client.get("/api/passages/next").status_code == 200
