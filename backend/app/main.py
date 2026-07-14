from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlmodel import Session

from app.db import create_tables, engine
from app.routers import auth, passages, results
from app.seed import seed_passages


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create tables and seed starter passages on startup."""
    create_tables()
    with Session(engine) as session:
        seed_passages(session)
    yield


app = FastAPI(title="Typing Trainer API", lifespan=lifespan)
app.include_router(auth.router)
app.include_router(passages.router)
app.include_router(results.router)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness check."""
    return {"status": "ok"}
