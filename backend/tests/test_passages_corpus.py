"""Quality checks on the passage corpus.

Ported from the vanilla app's test/passages.test.js. These guard the passages
people actually type: no word drilled over and over, and letter coverage broad
enough that a session exercises the whole keyboard.
"""

import json
import re
from collections import Counter
from pathlib import Path

import pytest
from sqlmodel import select

from app.models import Passage

MAX_WORD_REPEATS = 3
MAX_LETTER_SHARE = 0.2

# Words too common in English to count against repetition. Without this,
# "the" (5x in the real corpus) would fail a check that is meant to catch
# lazy passages, not natural prose.
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "of", "to", "in", "on", "at",
    "it", "is", "as", "that", "this", "for", "with", "you", "your", "if",
}


def content_word_counts(passages: list[str]) -> Counter[str]:
    words = re.findall(r"[a-z']+", " ".join(passages).lower())
    return Counter(w for w in words if w not in STOPWORDS)


def letter_counts(passages: list[str]) -> Counter[str]:
    return Counter(re.findall(r"[a-z]", "".join(passages).lower()))


def overused_words(passages: list[str]) -> list[str]:
    counts = content_word_counts(passages)
    return [f"{w} ({n})" for w, n in counts.items() if n > MAX_WORD_REPEATS]


def missing_letters(passages: list[str]) -> list[str]:
    counts = letter_counts(passages)
    return [c for c in "abcdefghijklmnopqrstuvwxyz" if c not in counts]


def dominant_letters(passages: list[str]) -> list[str]:
    counts = letter_counts(passages)
    total = sum(counts.values())
    return [
        f"{c} ({n / total:.1%})"
        for c, n in counts.items()
        if n / total > MAX_LETTER_SHARE
    ]


@pytest.fixture
def corpus(session) -> list[str]:
    """The passages actually stored in the database."""
    return [p.text for p in session.exec(select(Passage)).all()]


@pytest.fixture
def bad_corpus() -> list[str]:
    path = Path(__file__).parent / "fixtures" / "bad-passages.json"
    return json.loads(path.read_text())


def test_no_content_word_is_repeated_too_often(corpus):
    assert overused_words(corpus) == []


def test_a_repetitive_corpus_is_flagged(bad_corpus):
    assert overused_words(bad_corpus)


def test_every_letter_of_the_alphabet_is_covered(corpus):
    assert missing_letters(corpus) == []


def test_a_corpus_missing_letters_is_flagged(bad_corpus):
    assert "z" in missing_letters(bad_corpus)


def test_no_single_letter_dominates(corpus):
    assert dominant_letters(corpus) == []


def test_a_skewed_corpus_is_flagged(bad_corpus):
    assert dominant_letters(bad_corpus)


def test_the_bad_fixture_trips_every_check(bad_corpus):
    """One corpus, all three failures - proves the checks are independent."""
    assert sorted(overused_words(bad_corpus)) == [
        "anna (8)",
        "banana (7)",
        "cannot (5)",
    ]
    assert len(missing_letters(bad_corpus)) == 15
    assert sorted(dominant_letters(bad_corpus)) == ["a (40.1%)", "n (31.6%)"]


def test_stopwords_are_not_counted_against_repetition(corpus):
    """"the" appears 5x in the real corpus. A naive check would fail on it."""
    raw = Counter(re.findall(r"[a-z']+", " ".join(corpus).lower()))

    assert raw["the"] > MAX_WORD_REPEATS, "expected 'the' to be common"
    assert overused_words(corpus) == [], "stopwords must not trip the check"


def test_a_passage_added_via_the_api_is_also_checked(auth_client, session):
    """The checks guard whatever is in the DB, not just the seed data."""
    auth_client.post("/api/passages", json={"text": "zzz zzz zzz zzz zzz zzz"})

    corpus = [p.text for p in session.exec(select(Passage)).all()]
    assert overused_words(corpus) == ["zzz (6)"]
