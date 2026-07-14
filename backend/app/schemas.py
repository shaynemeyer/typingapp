from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    password: str = Field(min_length=8)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PassageCreate(BaseModel):
    text: str = Field(min_length=1)


class PassageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    created_at: datetime


class ResultCreate(BaseModel):
    passage_id: int
    wpm: float = Field(ge=0)
    accuracy: float = Field(ge=0, le=100)


class ResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    passage_id: int
    wpm: float
    accuracy: float
    created_at: datetime
