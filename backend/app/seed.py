from sqlmodel import Session, select

from app.models import Passage

PASSAGES = [
    "The quick brown fox jumps over the lazy dog while the sun sets slowly behind the distant hills.",
    "Practice makes perfect, but only if you practice the right way. Focus on accuracy before speed.",
    "Typing well is a skill built one keystroke at a time, through steady repetition and patience.",
    "A journey of a thousand miles begins beneath your feet, so take that very first quiet step now.",
    "Bright yellow leaves drift down as autumn winds carry them gently over the frozen village square.",
    "Every expert was once a beginner who refused to quit, choosing to grow through each small mistake.",
    "Curious minds ask questions that unlock new ideas, sparking bold projects nobody imagined before.",
    "The old lighthouse blinked across dark waves, guiding weary sailors home through fog and cold rain.",
    "Fresh coffee, a blank page, and morning silence make the perfect moment to write something honest.",
    "Wild rivers carve deep canyons over ages, proving that soft water can reshape the hardest granite.",
]


def seed_passages(session: Session) -> int:
    """Insert the starter passages if none exist. Returns the number inserted."""
    if session.exec(select(Passage)).first():
        return 0

    session.add_all(Passage(text=text) for text in PASSAGES)
    session.commit()
    return len(PASSAGES)
