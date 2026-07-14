from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from app.auth import authenticate, create_access_token, get_current_user, hash_password
from app.db import get_session
from app.models import User
from app.schemas import Token, UserCreate, UserRead

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: UserCreate, session: Session = Depends(get_session)):
    taken = session.exec(select(User).where(User.username == body.username)).first()
    if taken:
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
    )
    session.add(user)
    session.commit()

    return Token(access_token=create_access_token(user.username))


@router.post("/token", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
):
    user = authenticate(session, form.username, form.password)
    if not user:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return Token(access_token=create_access_token(user.username))


@router.get("/users/me", response_model=UserRead)
def read_me(user: User = Depends(get_current_user)):
    return user
