# Upgrade Plan 01 — FastAPI + SQLite backend, React/Vite/TS frontend

Supersedes [`01-plan.md`](01-plan.md), which describes the original vanilla
three-file app and is kept as a historical record.

## Context

The vanilla app is three static files (133 lines of `app.js`, 118 of CSS, 41 of
HTML), with passages embedded as JSON in `index.html` and scores in
`localStorage`. It works, and it is deliberately minimal.

**Why change it.** `localStorage` is per-browser. Scores die when you switch
device or clear storage, and there is no concept of a _user_. We want
registration and a cross-session results history — and that is the one thing a
static page genuinely cannot do. The backend is justified by **multi-user
persistence**, not by the typing app itself. The typing and scoring logic needs
no server and ports to the client largely unchanged.

## Verified stack

Versions checked against current documentation rather than assumed. Local
toolchain: Python 3.14.2, Node 24.15.0, uv 0.11.7.

| Tool           | Version | Note                                                                                                                                                                                                               |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| FastAPI        | 0.139.0 | `lifespan` context manager; `@app.on_event` is deprecated ([docs](https://fastapi.tiangolo.com/advanced/events/))                                                                                                  |
| Pydantic       | 2.13.4  | `model_config = ConfigDict(from_attributes=True)`; `orm_mode` is gone                                                                                                                                              |
| SQLModel       | 0.0.39  | Actively maintained, Pydantic v2 compatible ([docs](https://sqlmodel.tiangolo.com/))                                                                                                                               |
| uv             | 0.11.7  | `uv init`, `uv add`, `uv run` ([docs](https://docs.astral.sh/uv/))                                                                                                                                                 |
| Vite           | 8.1     | `npm create vite@latest frontend -- --template react-ts` ([docs](https://vite.dev/guide/))                                                                                                                         |
| pwdlib[argon2] | 0.3.0   | Password hashing. **Not passlib** — passlib is unmaintained and breaks on recent Python. The current FastAPI tutorial uses pwdlib with Argon2 ([docs](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/)) |

## How this plan is executed

Per `CLAUDE.md`, this is a large plan, so:

- Each component is **run** and proven to work, not merely written.
- Each component gets **simple tests** as it lands — one positive, one negative.
- Work **stops after each backend component** to confirm the current state meets
  requirements before continuing.

## Layout

```text
backend/
  pyproject.toml            uv-managed
  app/
    main.py                 FastAPI app + lifespan (creates tables, seeds passages)
    db.py                   engine, session dependency
    models.py               SQLModel tables: User, Passage, Result
    schemas.py              request/response models
    auth.py                 pwdlib hashing + JWT issue/verify
    routers/
      auth.py               register, token
      passages.py           passages CRUD
      results.py            save score, user history
    seed.py                 seeds the three original passages
  tests/
    test_health.py
    test_passages.py        corpus quality, ported from test/passages.test.js
    test_api.py             endpoint tests
    fixtures/bad-passages.json
frontend/
  src/
    App.tsx, main.tsx
    api/client.ts           typed fetch wrapper
    hooks/useTyping.ts      port of app.js keydown and scoring logic
    components/             Passage, Stats, Results, Register
```

Removed once the port is verified: `index.html`, `app.js`, `style.css`, `test/`.

## Data model

- **User** — `id`, `username` (unique), `hashed_password`, `created_at`
- **Passage** — `id`, `text`, `created_at`
- **Result** — `id`, `user_id` (FK), `passage_id` (FK), `wpm`, `accuracy`, `created_at`

The three original passages (95, 95, and 93 characters) are seeded verbatim.

## API

| Method | Path                    | Auth | Purpose                 |
| ------ | ----------------------- | ---- | ----------------------- |
| POST   | `/api/register`         | —    | create user, return JWT |
| POST   | `/api/token`            | —    | log in, return JWT      |
| GET    | `/api/passages/next`    | —    | random passage          |
| GET    | `/api/passages`         | —    | list                    |
| POST   | `/api/passages`         | JWT  | create                  |
| PUT    | `/api/passages/{id}`    | JWT  | update                  |
| DELETE | `/api/passages/{id}`    | JWT  | delete                  |
| POST   | `/api/results`          | JWT  | save a score            |
| GET    | `/api/users/me/results` | JWT  | that user's history     |

Auth is `OAuth2PasswordBearer` plus JWT, hashing via pwdlib's
`PasswordHash.recommended()` (Argon2). Scores are computed client-side and
trusted; the server does not recompute them. That is fine while scores are
private, and worth revisiting only if they ever become competitive or public.

## Logic that must survive the port

The rules in `app.js` are correct and load-bearing. They move into
`useTyping.ts` unchanged:

- `typed` and `wrong` only ever increase. Backspace restores a character's
  appearance but not lost accuracy. This is deliberate — see
  [`user-flow.md`](user-flow.md).
- The clock starts on the **first character keypress**, not on page load.
- `wpm = (typed / 5) / minutes`, `accuracy = (typed - wrong) / typed`.
- Stats seed at 60 wpm and 100%.
- Scrolling is an independent `requestAnimationFrame` loop driven by current wpm.

React changes _where_ character state lives. Today the `<span>` elements are the
state, carrying `current` / `correct` / `wrong` classes. In React that becomes a
`status[]` array the render maps over. This is the one genuine rewrite;
everything else is mechanical.

## The existing tests

`test/passages.test.js` scrapes `index.html` with a regex. Once passages live in
SQLite and `index.html` becomes Vite's shell, that regex matches nothing and the
tests break. They are ported to `backend/tests/test_passages.py`, reading
passages from the database and keeping all three checks and their thresholds:

- no content word appears more than 3 times, **stopword-aware** — `the` appears
  five times in the real corpus, so a naive check fails on correct English. The
  stopword list exists for this reason and must not be dropped.
- all 26 letters appear
- no single letter exceeds 20% of the text

`test/fixtures/bad-passages.json` moves to `backend/tests/fixtures/` and keeps
its role as one corpus that trips all three checks (`anna` 8x, `banana` 7x, 15
letters missing, `a` at 40.1%).

## Docs to update

- [`user-flow.md`](user-flow.md) — add register and login; saving a result now
  hits the API rather than `localStorage`. The three states (Ready, Typing,
  Finished) survive.
- [`typing-trainer.drawio`](typing-trainer.drawio) — both pages need rework. The
  low-level page's premise (browser to `app.js` to DOM, `localStorage`
  persistence) is obsolete; it becomes React to API to FastAPI to SQLite. Add a
  third page for the API and data model.
- `README.md` — replace "No build step, no server" with real run instructions for
  both services.
- `CLAUDE.md` — describe the new architecture.

## Build order

Each step ends somewhere runnable. Do not proceed on a broken step.

1. ~~Branch `vanilla-js`, push it.~~
2. ~~`uv init backend`; add dependencies; health endpoint responds.~~
3. ~~Models, SQLite, lifespan seeding of the three passages.~~
4. ~~Passages endpoints.~~
5. ~~Auth: register and token, pwdlib and JWT.~~
6. ~~Results endpoints.~~
7. ~~Port corpus tests to pytest; add API tests.~~
8. ~~Scaffold Vite React TS; port typing logic to `useTyping.ts`.~~
9. ~~Wire the frontend to the API.~~
10. ~~Docs and diagrams.~~
11. Delete the old static files.

## What the build actually turned up

Three things worth recording, because they were not predictable from the plan:

- **`wpm()` must check `startTime === null`, not `!startTime`.** A start time of
  `0` is falsy in JavaScript, so the truthiness guard silently returned the
  60 wpm seed instead of the real speed. The bug existed in the vanilla
  `app.js` too; it only became visible once the function was pure and testable.
- **The JWT dev secret was 29 bytes**, under the 32-byte floor for HMAC-SHA256
  (RFC 7518). Lengthened, and `ENV=production` without a real `SECRET_KEY` now
  raises at import rather than signing tokens with a value committed to this
  repo.
- **Scrolling is inert on the current passages.** They are ~95 characters and
  fit inside the 9rem viewport, so overflow is zero and the browser clamps
  `scrollTop` to 0. The animation loop is correct; there is nothing to scroll.
  The vanilla app behaved identically. Longer passages would scroll.

## Verified end to end

Driven in a real browser: register, fetch a passage, type it, save the score,
then log in from a **separate browser context** (no shared storage or cookies)
and see the same score. A second user sees an empty history. That cross-browser
persistence is the entire justification for this rebuild, and it holds.

## Verification

```sh
cd backend && uv run pytest                  # corpus and API tests green
uv run uvicorn app.main:app --reload         # /docs lists all nine endpoints

cd frontend && npm run dev
```

End to end, in the browser: register a user, get a passage, type it, save the
score, reload — the score is still there. **Then log in from a different browser
with the same account and confirm the score is still there.** That last check is
the entire justification for this rebuild. If it fails, the change bought
nothing.

Also confirm the typing feel is unchanged: colors track correct and wrong,
backspace does not refund accuracy, the clock starts on the first character, and
the passage scrolls.

## Deferred

- Server-side score validation; the client is trusted.
- A passage CRUD UI. The endpoints exist; manage passages via `/docs`.
- Token refresh, password reset, deployment configuration.
