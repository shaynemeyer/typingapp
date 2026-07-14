from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, desc, select

from app.auth import get_current_user
from app.db import get_session
from app.models import Passage, Result, User
from app.schemas import ResultCreate, ResultRead

router = APIRouter(prefix="/api", tags=["results"])


@router.post("/results", response_model=ResultRead, status_code=status.HTTP_201_CREATED)
def save_result(
    body: ResultCreate,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """Save a score. The owner comes from the token, never from the body."""
    if not session.get(Passage, body.passage_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Passage not found")

    result = Result(
        user_id=user.id,
        passage_id=body.passage_id,
        wpm=body.wpm,
        accuracy=body.accuracy,
    )
    session.add(result)
    session.commit()
    session.refresh(result)
    return result


@router.get("/users/me/results", response_model=list[ResultRead])
def my_results(
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    """The current user's history, newest first."""
    return session.exec(
        select(Result)
        .where(Result.user_id == user.id)
        .order_by(desc(Result.created_at), desc(Result.id))
    ).all()
