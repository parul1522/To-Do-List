# Phase 1: Architecture, setup, database and authentication

## What was built

### Backend (FastAPI)
- **Layered structure:** `api → services → repositories → models`, with `schemas` (Pydantic),
  `core` (config, security, errors, rate limiting, middleware), `db` and `utils`.
- **Configuration:** `pydantic-settings` reads everything from the environment. Production refuses to start with a weak
  JWT secret, `DEBUG=true` or wildcard CORS.
- **Database:** async SQLAlchemy 2.0 + asyncpg, deterministic constraint naming, and the first Alembic migration (`0001_auth`):
  `users`, `refresh_tokens`.
- **Authentication:**
  - Argon2id password hashing, with a transparent rehash when hashing parameters change
  - 15-minute access JWTs and 30-day refresh JWTs, distinguished by a `type` claim
  - Refresh-token **rotation** and **reuse detection**: replaying a rotated token revokes the whole session family
  - Logout from one device, logout from all devices, and password change (which revokes other sessions)
  - Account deletion that cascades to all of the user's data
  - Account-enumeration resistance: identical errors and equalised timing
  - Per-IP sliding-window rate limit on register, login and refresh
- **Endpoints** (`/api/v1`):

  | Method | Path | Auth | Purpose |
  |---|---|---|---|
  | GET | `/health`, `/health/ready` | no | Liveness, and readiness including a DB check |
  | POST | `/auth/register` | no | Create account → `{user, tokens}` |
  | POST | `/auth/login` | no | → `{user, tokens}` |
  | POST | `/auth/refresh` | no (refresh token in body) | Rotate → new `TokenPair` |
  | POST | `/auth/logout` | no (refresh token in body) | Revoke this device's session (idempotent) |
  | POST | `/auth/logout-all` | yes | Revoke every session |
  | GET / PATCH | `/users/me` | yes | Read or update profile (name, avatar URL) |
  | POST | `/users/me/password` | yes | Change password → new `TokenPair` |
  | DELETE | `/users/me` | yes | Delete account (password confirmation) |

- **Errors:** every error uses one envelope, `{"error": {"code", "message", "details"}}`, including validation errors
  (which report per-field details) and 404/405.
- **Operations:** multi-stage non-root `Dockerfile` with a healthcheck, an entrypoint that runs migrations, and
  `python -m app.cli purge-tokens` for scheduled cleanup of stale refresh tokens.

### Mobile (Expo SDK 57)
- **Expo Router** with protected route groups (`Stack.Protected`): `(auth)` covers welcome, sign-in and sign-up;
  `(app)` covers the tab bar, settings and notebooks.
- **Session handling:**
  - The access token is kept in memory. The refresh token is kept in **SecureStore**.
  - Persistent login restores the session instantly from a cached profile (this also works offline), then confirms it
    with the server.
  - The API client refreshes **single-flight** on 401 and signs out automatically only when the server rejects the
    refresh token. Network errors keep you signed in.
- **Design system:** original "Mneme" identity (ink indigo, warm paper neutrals and an amber AI accent), typed theme
  tokens, and light/dark/system themes saved per device.
- **UI primitives:**
  - Text, Button (with haptics), TextField (password reveal), Card, Section, ListRow, Avatar
  - EmptyState, Banner, Skeleton, SegmentedControl, IconButton
- **Screens:**
  - Welcome, Sign in and Sign up, with client-side validation mirroring the server plus server field errors
  - Home: greeting and quick actions
  - Settings: profile, password & security (change password, sign out everywhere, delete account), and appearance
- **Bottom tabs:** Home · Notes · Tasks · Search · Assistant. Notebooks opens from Notes, and Settings opens from the
  avatar on Home. Seven tabs would be too cramped on a phone, so these two live one tap away.
- **Floating + button** opens a capture sheet with Note, Task, Checklist, Audio note, Upload file and Scan document.
- **Unbuilt features are labelled, not faked.** Tabs, create actions and settings rows for later phases say which phase
  they arrive in. `PhasePreview` and the FAB handler are explicit development stubs.

## Files

```
.env.example  .gitignore  README.md  docker-compose.yml
docs/ARCHITECTURE.md  docs/phases/PHASE-1.md
shared/types/api.ts  shared/README.md
legacy/                          (moved: original ToDoList.py, sound.wav, demo png)

backend/
  Dockerfile  docker-entrypoint.sh  .dockerignore  alembic.ini  pyproject.toml
  requirements.txt  requirements-dev.txt
  alembic/env.py  alembic/script.py.mako
  alembic/versions/20260930_0001_create_users_and_refresh_tokens.py
  app/main.py  app/cli.py
  app/api/{deps.py, router.py, routes/{auth.py, users.py, health.py}}
  app/core/{config.py, security.py, exceptions.py, rate_limit.py, middleware.py}
  app/db/{base.py, session.py}
  app/models/{user.py, refresh_token.py}
  app/schemas/{auth.py, user.py, common.py}
  app/services/{auth_service.py, user_service.py}
  app/repositories/{user_repository.py, refresh_token_repository.py}
  app/utils/validation.py
  tests/{conftest.py, test_auth.py, test_users.py, test_security.py, test_health.py, test_cli.py}

mobile/
  app.json  package.json  tsconfig.json  metro.config.js  eslint.config.js  .env.example
  app/_layout.tsx
  app/(auth)/{_layout, welcome, sign-in, sign-up}.tsx
  app/(app)/{_layout, notebooks}.tsx
  app/(app)/(tabs)/{_layout, index, notes, tasks, search, assistant}.tsx
  app/(app)/settings/{index, profile, security, appearance}.tsx
  components/ui/*  components/navigation/{CreateFab, CreateSheet, PhasePreview}.tsx  components/brand/Logo.tsx
  features/auth/{api.ts, hooks.ts, AuthHeader.tsx}  features/profile/{api.ts, hooks.ts}
  services/{config.ts, queryClient.ts}  services/api/{client.ts, errors.ts, tokens.ts}
  services/storage/secureStorage.ts
  store/{authStore.ts, preferencesStore.ts}  hooks/useTheme.ts  theme/tokens.ts
  types/index.ts  utils/{errors.ts, greeting.ts, validation.ts}
  assets/images/*  (original icon set)
  __tests__/{apiClient.test.ts, utils.test.ts}
```

## Commands

```bash
# 1. Configure
cp .env.example .env && cp .env.example backend/.env
# set JWT_SECRET_KEY in both (python -c "import secrets; print(secrets.token_urlsafe(48))")

# 2. Database
docker compose up -d db

# 3. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000        # http://localhost:8000/docs

# …or everything in Docker:  docker compose up --build

# 4. Mobile
cd mobile
npm install
npx expo start
```

## Migrations

```bash
cd backend
alembic upgrade head          # creates users + refresh_tokens
alembic downgrade base        # drops them
alembic check                 # "No new upgrade operations detected." → models and migrations agree
```

## Testing

```bash
# backend (needs a secondbrain_test database, or set TEST_DATABASE_URL)
cd backend && pytest -q && ruff check . && ruff format --check .
# mobile
cd mobile && npm run typecheck && npm run lint && npm test
```

**Results on this branch:**

| Check | Result |
|---|---|
| Backend tests (pytest, real PostgreSQL 16, migrations applied) | **41 passed** |
| `ruff check` / `ruff format --check` | clean |
| `alembic upgrade` → `downgrade base` → `upgrade`, then `alembic check` | clean |
| Mobile `tsc --noEmit`, `expo lint` | clean |
| Mobile `jest` | **14 passed** (API client refresh and single-flight, offline handling, validators) |
| `expo export` for iOS and Android | bundles built |
| Docker image | builds; migrates a fresh DB and serves `/health/ready`; `/docs` returns 404 in production |
| Browser end-to-end on the Expo web build (Playwright) | see below |

The end-to-end run checked these steps, with no console errors:
1. Welcome → sign-up validation → register → Home
2. The + sheet opens
3. Tab navigation works
4. Settings → switch to dark theme → edit profile
5. After a reload, the session persists
6. Sign out returns to Welcome

### Manual checklist on a device
1. Sign up, kill the app, and reopen it. You should land on Home straight away.
2. Turn on airplane mode and reopen the app. You should still be on Home, with no forced sign-out.
3. Change your password on device A. Device A stays signed in. Device B is sent to Welcome on its next API call.
4. Try signing in with a wrong password 11 times within a minute. The last attempt shows "Too many attempts…".
5. Switch Appearance to Dark, restart the app, and confirm the theme persists.

## Likely bugs and known limitations

| Area | Issue | Mitigation / plan |
|---|---|---|
| Rate limiting | In-memory, so each process has its own counters; limits multiply with several workers or replicas | Swap `SlidingWindowStore` for Redis in Phase 10. The interface is already isolated |
| Rate limiting behind a proxy | Without `TRUST_PROXY_HEADERS=true` every client shares the proxy's IP | Documented. Enable only behind a trusted proxy |
| Concurrent refresh | Two refreshes of the same token at once (for example, two web tabs) look like reuse and sign the user out | The mobile client single-flights refreshes. A short grace window can be added if web becomes a primary target |
| Web build | Refresh token stored in `localStorage` (SecureStore has no web implementation) | Web is for development only. This is documented in code and the README |
| Avatar | URL only. No upload yet | Uploads arrive with attachments in Phase 3 |
| Email change / verification / password reset | Not implemented | Needs a transactional email provider. Planned for Phase 10 hardening |
| `alembic downgrade base` in the test fixture | Resets the **test** database each run | Uses `TEST_DATABASE_URL` only, never the dev DB |
| Token table growth | Revoked and expired rows accumulate | Schedule `python -m app.cli purge-tokens` daily |
