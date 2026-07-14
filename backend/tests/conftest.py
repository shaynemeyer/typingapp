import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import get_session
from app.main import app
from app.seed import seed_passages


@pytest.fixture
def session():
    """An isolated in-memory database, seeded like a real startup."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        seed_passages(session)
        yield session


@pytest.fixture
def client(session):
    """A TestClient backed by the isolated session, not the real typing.db."""
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client):
    """A client carrying a bearer token for a freshly registered user."""
    response = client.post(
        "/api/register",
        json={"username": "shayne", "password": "correct-horse"},
    )
    token = response.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client
