# Typing Trainer — backend

FastAPI + SQLModel + SQLite API for the Typing Trainer, managed with `uv`. It
owns users, passages, and saved scores. See the [root README](../readme.md) for
the full stack and the frontend.

## Run

```sh
uv run uvicorn app.main:app --reload    # http://127.0.0.1:8000
```

Interactive API docs: http://127.0.0.1:8000/docs

On startup a lifespan handler creates the tables and seeds three starter
passages if the table is empty (idempotent — restarting does not duplicate).

```sh
uv run pytest       # 54 tests
uv run pytest tests/test_auth_api.py::test_expired_token_is_rejected   # one test
```

## Configuration

Environment variables (see `.env.example`):

| Variable | Default | |
| --- | --- | --- |
| `SECRET_KEY` | a dev-only value | Signs JWTs. **Required in production** — the app raises at import if `ENV=production` and this is unset. |
| `ENV` | `development` | Set to `production` to enforce the check above. |
| `DATABASE_URL` | `sqlite:///./typing.db` | SQLite connection string. |

Delete `typing.db` to reset; the passages reseed on the next startup.

## Structure

| Path | Role |
| --- | --- |
| `app/main.py` | app, router wiring, lifespan (create tables + seed) |
| `app/models.py` | SQLModel tables: `User`, `Passage`, `Result` |
| `app/schemas.py` | request/response models |
| `app/db.py` | engine and session dependency |
| `app/auth.py` | pwdlib hashing, JWT issue/verify, `get_current_user` |
| `app/routers/` | `auth`, `passages`, `results` |
| `app/seed.py` | the three starter passages |

## Things worth knowing

- **Password hashing is `pwdlib` with Argon2, not `passlib`.** Passlib is
  unmaintained and breaks on recent Python.
- **A `Result`'s owner comes from the JWT, never the request body.**
  `ResultCreate` has no `user_id` field, so a client cannot write a score into
  another user's history. Keep it that way.
- **Passage route order matters.** `/api/passages/next` is declared before
  `/api/passages/{passage_id}`; reversed, FastAPI tries to parse `"next"` as an
  int and 422s.
- **Tests use `StaticPool`** (`tests/conftest.py`). In-memory SQLite hands out a
  fresh connection per checkout by default, so without it the schema the fixture
  creates is invisible to the request handler and every API test fails.
- **Login returns one generic 401** for both an unknown user and a wrong
  password, so usernames cannot be enumerated from responses.

## Endpoints

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/health` | |
| POST | `/api/register` | |
| POST | `/api/token` | |
| GET | `/api/passages/next` | |
| GET | `/api/passages` | |
| POST | `/api/passages` | JWT |
| PUT | `/api/passages/{id}` | JWT |
| DELETE | `/api/passages/{id}` | JWT |
| POST | `/api/results` | JWT |
| GET | `/api/users/me` | JWT |
| GET | `/api/users/me/results` | JWT |
