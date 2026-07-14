# Typing Trainer

A typing practice app. Type a passage; the text scrolls at roughly your typing
speed, starting at 60 wpm. Register an account and your scores are saved to the
server, so your history follows you across browsers and devices.

## Run it

Two services, both needed. The frontend proxies `/api` to the backend.

```sh
cd backend  && uv run uvicorn app.main:app --reload   # http://127.0.0.1:8000
cd frontend && npm run dev                            # http://localhost:5173
```

Open http://localhost:5173. Interactive API docs are at http://127.0.0.1:8000/docs.

## Test it

```sh
cd backend  && uv run pytest      # API, auth, and passage-corpus tests
cd frontend && npx vitest run     # scoring rules
```

## Stack

| | |
| --- | --- |
| Backend | FastAPI, SQLModel, SQLite, managed with `uv` |
| Frontend | React, Vite, TypeScript |
| Auth | JWT bearer tokens, Argon2 password hashing via `pwdlib` |

The database is `backend/typing.db`. Delete it to reset; the three starter
passages reseed on the next startup.

## API

| Method | Path | Auth | |
| --- | --- | --- | --- |
| GET | `/api/health` | | liveness check |
| POST | `/api/register` | | create an account, returns a token |
| POST | `/api/token` | | log in, returns a token |
| GET | `/api/passages/next` | | a random passage |
| GET | `/api/passages` | | list passages |
| POST | `/api/passages` | JWT | add a passage |
| PUT | `/api/passages/{id}` | JWT | edit a passage |
| DELETE | `/api/passages/{id}` | JWT | remove a passage |
| POST | `/api/results` | JWT | save a score |
| GET | `/api/users/me` | JWT | the signed-in user |
| GET | `/api/users/me/results` | JWT | your score history |

Typing works signed out. Only saving a score needs an account.

## Docs

- [`docs/upgrade-plan-01.md`](docs/upgrade-plan-01.md) — the current architecture and why it exists
- [`docs/user-flow.md`](docs/user-flow.md) — states and interaction rules
- [`docs/01-plan.md`](docs/01-plan.md) — the original vanilla three-file version
