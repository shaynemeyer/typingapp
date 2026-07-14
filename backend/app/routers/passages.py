from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.sql.expression import func
from sqlmodel import Session, select

from app.auth import get_current_user
from app.db import get_session
from app.models import Passage, User
from app.schemas import PassageCreate, PassageRead

router = APIRouter(prefix="/api/passages", tags=["passages"])


@router.get("/next", response_model=PassageRead)
def next_passage(session: Session = Depends(get_session)):
    """A random passage to type. Replaces the JSON block in the old index.html."""
    passage = session.exec(select(Passage).order_by(func.random())).first()
    if not passage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No passages available")
    return passage


@router.get("", response_model=list[PassageRead])
def list_passages(session: Session = Depends(get_session)):
    return session.exec(select(Passage).order_by(Passage.id)).all()


@router.post("", response_model=PassageRead, status_code=status.HTTP_201_CREATED)
def create_passage(
    body: PassageCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    passage = Passage(text=body.text)
    session.add(passage)
    session.commit()
    session.refresh(passage)
    return passage


@router.put("/{passage_id}", response_model=PassageRead)
def update_passage(
    passage_id: int,
    body: PassageCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    passage = session.get(Passage, passage_id)
    if not passage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Passage not found")

    passage.text = body.text
    session.add(passage)
    session.commit()
    session.refresh(passage)
    return passage


@router.delete("/{passage_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_passage(
    passage_id: int,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    passage = session.get(Passage, passage_id)
    if not passage:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Passage not found")

    session.delete(passage)
    session.commit()
