from sqlmodel import Session, select

from app.models import Passage

PASSAGES = [
    "The quick brown fox jumps over the lazy dog while the sun sets slowly behind the distant hills.",
    "Practice makes perfect, but only if you practice the right way. Focus on accuracy before speed.",
    "Typing well is a skill built one keystroke at a time, through steady repetition and patience.",
]


def seed_passages(session: Session) -> int:
    """Insert the starter passages if none exist. Returns the number inserted."""
    if session.exec(select(Passage)).first():
        return 0

    session.add_all(Passage(text=text) for text in PASSAGES)
    session.commit()
    return len(PASSAGES)
