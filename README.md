# Mneme: your personal AI second brain

Mneme is where you put everything you want to remember. Notes, tasks, voice memos, photos and PDFs go in, and later you can
retrieve, understand, organise and act on them with AI.

- **Mobile:** Expo SDK 57 · React Native · TypeScript · Expo Router · TanStack Query · Zustand
- **Backend:** FastAPI · SQLAlchemy 2 (async) · PostgreSQL 16 + pgvector · Alembic · JWT
- **Storage:** S3-compatible object storage (MinIO locally)

> **Status:** Phase 1 of 10 is complete: architecture, database, authentication and the app shell.
> See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design and roadmap and
> [`docs/phases/`](docs/phases/) for per-phase reports. Features from later phases show an
> explicit "Arrives in Phase N" state in the app. They are not faked.

---

## Requirements

| Tool | Version |
|---|---|
| Python | 3.11+ |
| Node.js | 20.19+ (22 LTS recommended) |
| PostgreSQL | 16 with the `pgvector` extension (the Docker image includes it) |
| Docker + Compose | Optional, the easiest way to run Postgres and MinIO |
| Expo tooling | Expo Go for quick checks, or a development build (Xcode or Android Studio, or EAS) |

## Repository layout

```
backend/   FastAPI service (api/ core/ models/ schemas/ services/ repositories/ utils/ db/ tests/)
mobile/    Expo app (app/ components/ features/ hooks/ services/ store/ theme/ types/ utils/ assets/)
shared/    API contract types shared by client and server
docs/      Architecture, ER design, roadmap and phase reports
legacy/    The original Tkinter to-do app, preserved
```

## Environment variables

Copy the template and fill in secrets:

```bash
cp .env.example .env                 # used by docker compose
cp .env.example backend/.env         # used when running the API directly
cp mobile/.env.example mobile/.env   # public Expo config
python -c "import secrets; print(secrets.token_urlsafe(48))"   # → JWT_SECRET_KEY
```

| Variable | Purpose | Default |
|---|---|---|
| `ENVIRONMENT` | `development`, `test` or `production` (production turns off `/docs` and enforces safe settings) | `development` |
| `DATABASE_URL` | Async SQLAlchemy URL (`postgres://` URLs are converted automatically) | local `secondbrain` DB |
| `JWT_SECRET_KEY` | **Required.** At least 32 characters. Signs access and refresh tokens | none |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token lifetimes | `15` / `30` |
| `CORS_ORIGINS` | Comma-separated web origins. Native apps don't need CORS | empty |
| `TRUST_PROXY_HEADERS` | Use `X-Forwarded-For` for rate limiting. Enable only behind a trusted proxy | `false` |
| `RATE_LIMIT_ENABLED`, `RATE_LIMIT_AUTH_PER_MINUTE` | Brute-force protection on auth endpoints | `true`, `10` |
| `S3_*` | Object storage (Phase 3) | MinIO defaults |
| `AI_PROVIDER`, `*_API_KEY` | AI providers (Phase 5+). **Server-side only** | none |
| `EXPO_PUBLIC_API_URL` | API base URL baked into the app. Public, so never put secrets here | derived from the Metro host in dev |

## Database setup

**With Docker (recommended):**

```bash
docker compose up -d db minio        # PostgreSQL 16 + pgvector on :5432, MinIO on :9000/:9001
```

**With a local Postgres install:**

```sql
CREATE ROLE secondbrain LOGIN PASSWORD 'secondbrain' CREATEDB;
CREATE DATABASE secondbrain OWNER secondbrain;
CREATE DATABASE secondbrain_test OWNER secondbrain;   -- for the test suite
```

**Migrations** (from `backend/`):

```bash
alembic upgrade head                                  # apply all migrations
alembic downgrade -1                                  # roll back one
alembic revision --autogenerate -m "describe change"  # create a new migration after editing models
alembic check                                         # verify models and migrations agree
```

## Running the backend

**Everything in Docker:**

```bash
docker compose up --build            # API on http://localhost:8000 (runs migrations on start)
```

**Locally, with hot reload:**

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

Interactive API docs are at http://localhost:8000/docs (disabled in production).
Health checks: `GET /api/v1/health` (liveness) and `GET /api/v1/health/ready` (checks the database).

## Running the mobile app

```bash
cd mobile
npm install
npx expo start            # press i (iOS simulator), a (Android emulator) or w (web)
```

- **API URL:** in development the app uses the machine Metro runs on (`http://<metro-host>:8000/api/v1`),
  so a phone on the same Wi-Fi works without extra setup. To override it, set `EXPO_PUBLIC_API_URL`.
  The Android emulator uses `http://10.0.2.2:8000/api/v1`.
- **Development build** (needed for native modules beyond Expo Go):
  `npx expo run:ios` / `npx expo run:android`, or `npx eas-cli@latest build --profile development`.
- The web target is for development convenience only. It stores the refresh token in `localStorage`
  because SecureStore has no web implementation.

## Testing

```bash
# Backend: needs Postgres with a secondbrain_test database (override with TEST_DATABASE_URL)
cd backend
pytest -q                 # runs migrations down/up, then every API test against real Postgres
ruff check . && ruff format --check .

# Mobile
cd mobile
npm run typecheck
npm run lint
npm test
```

## Building for production

**Backend**

```bash
docker build -t mneme-api ./backend
docker run -p 8000:8000 --env-file .env -e ENVIRONMENT=production mneme-api
```

- The image is multi-stage, runs as a non-root user and has a health check.
- `docker-entrypoint.sh` runs `alembic upgrade head` on start. Set `RUN_MIGRATIONS=false`
  if a separate release job owns migrations.
- In production, startup fails if `JWT_SECRET_KEY` is weak, `DEBUG` is on or CORS uses `*`.
- Put the API behind TLS (a load balancer or reverse proxy). Set `TRUST_PROXY_HEADERS=true` only there.

**Mobile**

```bash
cd mobile
npx eas-cli@latest build:configure
EXPO_PUBLIC_API_URL=https://api.example.com/api/v1 npx eas-cli@latest build --platform all --profile production
```

## Security model (summary)

- Passwords are hashed with Argon2id. Access tokens last 15 minutes and are held in memory. Refresh tokens rotate,
  are kept in the Keychain/Keystore, and replaying one revokes that token's whole session family.
- Every data query is scoped to the authenticated user. Another user's resource returns `404`.
- All input is validated with Pydantic, auth endpoints are rate-limited, security headers are set,
  and `/docs` is off in production.
- AI provider keys live only on the server. The app never sees them.

## License

MIT. See [LICENSE](LICENSE).
