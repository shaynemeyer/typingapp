# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Large Plans

Whenever you are implementing a large plan, stop and ask the coder if the current state meets the requirements, and implement simple tests along the way. You should run each part of the planned component so it works

## Testing

For creating tests, create the smallest possible test you can. Don't install additional tooling for tests unless absolutely needed, and think of one positive and one negative test per case.

## Running the app

Two services. Both must be up — the frontend proxies `/api` to the backend.

```sh
cd backend  && uv run uvicorn app.main:app --reload   # http://127.0.0.1:8000
cd frontend && npm run dev                            # http://localhost:5173
```

The API docs are at `http://127.0.0.1:8000/docs`. SQLite lives at `backend/typing.db`; delete it to reset, and the three starter passages reseed on next startup.

```sh
cd backend  && uv run pytest      # 54 tests
cd frontend && npx vitest run     # 8 tests
```

## Architecture

**Backend** — FastAPI + SQLModel + SQLite, managed with `uv`. Three tables: `User`, `Passage`, `Result`. Nine endpoints across `app/routers/` (auth, passages, results).

**Frontend** — React 19 + Vite 8 + TypeScript. The typing engine is `src/hooks/useTyping.ts`; scoring is in `src/lib/scoring.ts`; API calls go through `src/api/client.ts`.

**Why a backend exists at all.** `localStorage` is per-browser, so scores died on a device switch and there was no concept of a user. Multi-user persistence is the *only* reason for the server — the typing and scoring logic itself needs nothing but the client.

### Things that will bite you

**Scoring counters only ever increase.** `typed` and `wrong` never decrement, so Backspace restores a character's appearance but not the accuracy already lost. This is deliberate and load-bearing — it keeps accuracy honest. Do not "fix" it.

**`wpm()` must test `startTime === null`, not `!startTime`.** A start time of `0` is falsy in JavaScript, so a truthiness check silently reports the 60 wpm seed value instead of the real speed. This bug was in the vanilla app and only surfaced when the function became pure and testable.

**The clock starts on the first character keypress**, not on page load, so stats measure typing time rather than thinking time. Stats seed at 60 wpm / 100%.

**The scroll loop reads wpm through a ref.** `useAutoScroll` runs an independent `requestAnimationFrame` loop; a plain closure would capture the wpm from the render that created it and freeze scrolling at 60. It also hardcodes CSS assumptions (`2.2 * 16` line height, a ~40 chars-per-line estimate), so changing `.passage` typography in `index.css` desyncs the scroll rate.

**Scrolling does nothing on the current passages.** They are ~95 characters and fit inside the 9rem viewport, so overflow is zero and the browser clamps `scrollTop` to 0. The loop is running correctly; there is simply nothing to scroll. Longer passages would scroll. The vanilla app behaved the same way.

**A result's owner comes from the JWT, never the request body.** `ResultCreate` has no `user_id` field, so a client cannot write a score into someone else's history. Keep it that way.

**Passage route order matters.** `/api/passages/next` is declared before `/api/passages/{passage_id}`; reversed, FastAPI tries to parse `"next"` as an int and 422s.

**Tests use `StaticPool`.** In-memory SQLite hands out a fresh connection per checkout by default, so without it the schema the fixture creates is invisible to the request handler and every API test fails on a missing table.

**Password hashing is `pwdlib` with Argon2, not `passlib`.** Passlib is unmaintained and breaks on recent Python. `SECRET_KEY` falls back to a dev default; setting `ENV=production` without a real one raises at import.

## Docs

- `docs/upgrade-plan-01.md` — the plan for this architecture, and why the backend is justified.
- `docs/01-plan.md` — the original vanilla three-file app. Historical.
- `docs/user-flow.md` — states and interaction rules, with a mermaid flowchart. Update it if you change key handling.
- `docs/typing-trainer.drawio` — high-level flow, low-level interaction, and the API/data model.
