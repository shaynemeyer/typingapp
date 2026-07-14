import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash
from sqlmodel import Session, select

from app.db import get_session
from app.models import User

DEV_SECRET = "dev-only-secret-do-not-use-in-production-32b+"
ALGORITHM = "HS256"
TOKEN_TTL = timedelta(hours=12)

SECRET_KEY = os.environ.get("SECRET_KEY", DEV_SECRET)

if SECRET_KEY == DEV_SECRET and os.environ.get("ENV") == "production":
    raise RuntimeError("SECRET_KEY must be set in production")

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return password_hash.verify(password, hashed)


def create_access_token(username: str) -> str:
    payload = {"sub": username, "exp": datetime.now(timezone.utc) + TOKEN_TTL}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def authenticate(session: Session, username: str, password: str) -> User | None:
    user = session.exec(select(User).where(User.username == username)).first()
    if user and verify_password(password, user.hashed_password):
        return user
    return None


def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> User:
    """Resolve the bearer token to a user, or 401."""
    invalid = HTTPException(
        status.HTTP_401_UNAUTHORIZED,
        "Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        raise invalid

    username = payload.get("sub")
    if not username:
        raise invalid

    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise invalid

    return user
