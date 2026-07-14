import pytest
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, SQLModel, create_engine, select

from app.models import Passage, Result, User
from app.seed import PASSAGES, seed_passages


@pytest.fixture
def session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session


def test_seeding_inserts_the_starter_passages(session):
    inserted = seed_passages(session)

    assert inserted == len(PASSAGES)
    stored = session.exec(select(Passage)).all()
    assert [p.text for p in stored] == PASSAGES


def test_seeding_twice_does_not_duplicate(session):
    seed_passages(session)
    inserted_again = seed_passages(session)

    assert inserted_again == 0
    assert len(session.exec(select(Passage)).all()) == len(PASSAGES)


def test_usernames_are_unique(session):
    session.add(User(username="shayne", hashed_password="x"))
    session.commit()

    session.add(User(username="shayne", hashed_password="y"))
    with pytest.raises(IntegrityError):
        session.commit()


def test_result_links_a_user_and_a_passage(session):
    user = User(username="shayne", hashed_password="x")
    passage = Passage(text="hello")
    session.add(user)
    session.add(passage)
    session.commit()

    session.add(
        Result(user_id=user.id, passage_id=passage.id, wpm=62.5, accuracy=97.0)
    )
    session.commit()

    result = session.exec(select(Result)).one()
    assert result.user_id == user.id
    assert result.passage_id == passage.id
    assert result.wpm == 62.5
