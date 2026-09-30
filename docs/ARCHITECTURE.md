# Mneme — Architecture

> **Mneme** (NEE-mee, the Greek muse of memory) is a personal AI second brain:
> capture anything, then retrieve, understand, organise and act on it with AI.

This document is the source of truth for system design. Each phase report in
[`docs/phases/`](phases/) describes what is actually implemented.

---

## 1. System architecture

```
┌──────────────────────────── Mobile (Expo / React Native) ────────────────────────────┐
│  Expo Router screens ─► feature hooks (TanStack Query) ─► API client (fetch + JWT)    │
│        │                        │                              │                     │
│   Zustand stores          Query cache ──► (Phase 9) SQLite     SecureStore           │
│   (auth, prefs)           + offline mutation queue             (refresh token)       │
└─────────────────────────────────────────┬────────────────────────────────────────────┘
                                          │ HTTPS · JSON · Bearer access token
┌─────────────────────────────────────────▼────────────────────────────────────────────┐
│                           FastAPI  (/api/v1)                                          │
│  api/  routes: thin, validate with Pydantic, depend on CurrentUser                    │
│   │                                                                                    │
│  services/  business rules, transactions, ownership checks, orchestration              │
│   │           ├── AI provider abstraction  (OpenAI | Anthropic | Groq | Ollama)       │
│   │           ├── Embedding provider       (pluggable, dimension-configured)          │
│   │           ├── Transcription / OCR providers                                        │
│   │           └── Storage service          (S3-compatible, presigned URLs)            │
│  repositories/  all SQL; every query scoped by user_id                                 │
│  models/  SQLAlchemy 2.0 ORM          schemas/  Pydantic request/response models       │
│  core/  config, security (Argon2id, JWT), errors, rate limiting, middleware            │
└──────┬───────────────────────────┬─────────────────────────────┬───────────────────────┘
       │                           │                             │
┌──────▼──────────┐       ┌────────▼─────────┐          ┌────────▼──────────────┐
│ PostgreSQL 16   │       │ S3 / MinIO       │          │ Background worker     │
│ + tsvector FTS  │       │ attachments,     │          │ (Phase 5+: embeddings,│
│ + pgvector      │       │ audio, scans     │          │  OCR, transcription)  │
└─────────────────┘       └──────────────────┘          └───────────────────────┘
```

### Request lifecycle

1. The mobile client calls `/api/v1/...` with `Authorization: Bearer <access>`.
2. `get_current_user` decodes the JWT (signature, issuer, expiry, `type=access`)
   and loads the user. Anything else is a `401`.
3. The route hands validated input to a **service**. Services own transactions
   and business rules and always pass `user.id` into **repositories**.
4. Repositories filter every query by `user_id`. A record belonging to another
   user is indistinguishable from a missing one (`404`), so IDs can't be probed.
5. Errors are raised as typed `AppError`s and rendered in one envelope:
   `{"error": {"code", "message", "details"}}`.

### Authentication design

| Concern | Decision |
|---|---|
| Password hashing | Argon2id (`argon2-cffi`), transparent rehash on login when parameters change |
| Access token | JWT HS256, 15 min, `type=access`, kept **in memory** on the device |
| Refresh token | JWT, 30 days, `type=refresh`, `jti` + `fam` (family) claims, stored in **SecureStore** (Keychain/Keystore) |
| Rotation | Every refresh issues a new pair and revokes the old token (`replaced_by_id`) |
| Reuse detection | Presenting an already-rotated token revokes the whole family (stolen-token defence) |
| Logout | Revokes the device's session family; `logout-all` revokes every session |
| Password change | Revokes all sessions, returns a fresh pair for the current device |
| Enumeration | Login failures are identical for unknown email / wrong password, with timing equalised via a dummy hash |
| Brute force | Sliding-window rate limit per IP on register/login/refresh |

The client refreshes **single-flight**: concurrent 401s share one refresh
request, because parallel refreshes of a rotating token would trip reuse
detection and sign the user out.

---

## 2. Database design (ER overview)

All primary keys are UUIDs. Every user-owned table carries `user_id` with an
index and `ON DELETE CASCADE` from `users`, so deleting an account removes all
of its data and every query can be scoped cheaply. Timestamps are `timestamptz`.

```
users 1───* refresh_tokens
  │
  ├──1───* notebooks  (self-referencing parent_id → nested notebooks)
  │           │
  │           └──1───* notes ──*───* tags   (via note_tags)
  │                     │
  │                     ├──1───* tasks            (note_id nullable: standalone tasks)
  │                     ├──1───* attachments ──1───0..1 audio_recordings ──1───0..1 transcriptions
  │                     ├──1───* reminders        (also polymorphic to tasks)
  │                     └──1───* embeddings       (chunks of note body / attachment text)
  │
  └──1───* ai_conversations ──1───* ai_messages ──*───* notes (cited sources, JSON of ids)
```

### Tables

| Table | Key columns | Notes |
|---|---|---|
| **users** *(Phase 1)* | `id, name, email (unique), password_hash, avatar_url, is_active, created_at, updated_at` | Email stored lower-cased |
| **refresh_tokens** *(Phase 1)* | `id (=jti), user_id, family_id, expires_at, revoked_at, replaced_by_id, user_agent, created_at` | Indexed on `user_id`, `family_id`, `expires_at` |
| **notebooks** *(2)* | `id, user_id, parent_id, name, color, icon, archived_at, position, created_at, updated_at` | `UNIQUE(user_id, parent_id, name)`; note count is computed, not stored |
| **notes** *(2)* | `id, user_id, notebook_id (SET NULL), title, content (plain text), content_json (JSONB editor doc), archived, pinned, favorite, reminder_at, deleted_at, version, search_vector (tsvector, generated), created_at, updated_at` | `content` is derived from `content_json` for search/snippets; `version` supports optimistic concurrency for sync; GIN index on `search_vector`; partial indexes for pinned/active |
| **tags** *(2)* | `id, user_id, name, color` | `UNIQUE(user_id, lower(name))` |
| **note_tags** *(2)* | `note_id, tag_id` (composite PK) | Both FKs cascade |
| **tasks** *(3)* | `id, user_id, note_id (nullable), title, description, completed, completed_at, priority (0–3), due_date, recurrence_rule (RRULE), position, created_at, updated_at` | Checklist items inside a note reference their note; indexes on `(user_id, completed, due_date)` |
| **reminders** *(3)* | `id, user_id, note_id?, task_id?, remind_at, sent_at, channel` | `CHECK` exactly one of note/task; the canonical schedule for push notifications |
| **attachments** *(3)* | `id, user_id, note_id, kind (image/pdf/document/audio), filename, mime_type, size_bytes, storage_key, checksum_sha256, extracted_text, processing_status, created_at` | Files live in S3; only metadata here |
| **audio_recordings** *(8)* | `id, user_id, attachment_id (unique), duration_ms, summary, action_items (JSONB)` | 1:1 with an audio attachment |
| **transcriptions** *(8)* | `id, user_id, audio_recording_id (unique), provider, language, text, segments (JSONB), status` | Provider recorded for reproducibility |
| **embeddings** *(5)* | `id, user_id, note_id?, attachment_id?, chunk_index, content, content_hash, model, embedding vector(N), created_at` | HNSW index (`vector_cosine_ops`); `content_hash` skips re-embedding unchanged chunks |
| **ai_conversations** *(6)* | `id, user_id, title, created_at, updated_at` | |
| **ai_messages** *(6)* | `id, conversation_id, role, content, source_note_ids (UUID[]), model, token_usage (JSONB), created_at` | Sources power the citations UI |

Design rules: no duplicated data (counts, snippets and tag lists are computed
or derived), soft-delete only where the product needs restore (notes, via
`archived`/`deleted_at`), and every foreign key indexed.

---

## 3. Folder structure

```
.
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI routers (thin) + dependencies (auth, db)
│   │   │   └── routes/     # auth, users, health, … one module per resource
│   │   ├── core/           # config, security, exceptions, rate limit, middleware
│   │   ├── db/             # declarative base, mixins, async engine/session
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── services/       # business logic, transactions, provider orchestration
│   │   ├── repositories/   # data access, always user-scoped
│   │   ├── utils/          # pure helpers (validation, text processing)
│   │   └── main.py         # app factory
│   ├── alembic/            # migrations (async env, deterministic revision ids)
│   ├── tests/              # pytest + httpx against real PostgreSQL
│   ├── Dockerfile, docker-entrypoint.sh
│   ├── requirements.txt, requirements-dev.txt, pyproject.toml
├── mobile/
│   ├── app/                # Expo Router routes only
│   │   ├── (auth)/         # welcome, sign-in, sign-up
│   │   └── (app)/          # protected: (tabs)/, settings/, notebooks
│   ├── components/         # ui/ primitives, navigation/, brand/
│   ├── features/           # per-feature api + hooks + components (auth, profile, notes…)
│   ├── hooks/              # cross-cutting hooks (useTheme)
│   ├── services/           # api client, token store, secure storage, query client
│   ├── store/              # Zustand stores (auth, preferences)
│   ├── theme/              # design tokens
│   ├── types/              # app-local types
│   ├── utils/              # pure helpers
│   ├── assets/
│   └── __tests__/          # jest-expo unit tests
├── shared/types/           # API contract types shared with the client
├── docs/                   # architecture + per-phase reports
├── legacy/                 # the original Tkinter to-do app, preserved
├── docker-compose.yml      # postgres+pgvector, minio, backend
└── .env.example
```

---

## 4. Technology choices

| Choice | Why |
|---|---|
| **Expo SDK 57 + Expo Router** | File-based routing with typed routes, protected route groups (`Stack.Protected`), OTA updates and EAS builds without owning native projects |
| **Custom token-based styling** (not NativeWind) | A typed `useTheme()` token system has zero build-time config, works identically on native and web, and makes light/dark/system trivial. NativeWind was an allowed alternative, but its Babel/Metro/Tailwind setup is heavy for the benefit |
| **TanStack Query** | Server state, caching, retries and, in Phase 9, persisted cache and paused offline mutations |
| **Zustand** | Tiny client state (auth session, preferences) with persistence middleware |
| **expo-secure-store** | Refresh token in the Keychain/Keystore. Never AsyncStorage |
| **FastAPI + Pydantic v2** | Async I/O for AI/storage calls, automatic OpenAPI, strict validation |
| **SQLAlchemy 2.0 async + asyncpg** | Typed ORM, mature migrations with Alembic, fast driver |
| **PostgreSQL 16 + pgvector** | One database for relational data, full-text search (`tsvector`) and vector search. No extra search service to operate |
| **Argon2id** | Memory-hard, OWASP-recommended password hash |
| **PyJWT** | Minimal, well-maintained JWT implementation |
| **MinIO / S3** | S3 API locally and in production; files never go into Postgres |
| **Provider abstraction for AI** | `LLMProvider`, `EmbeddingProvider`, `TranscriptionProvider` and `OCRProvider` protocols chosen by environment variables; API keys stay server-side |

---

## 5. Development roadmap

| Phase | Scope | Exit criteria |
|---|---|---|
| **1** ✅ | Architecture, monorepo, DB, auth (register/login/refresh/logout, profile, password, delete), mobile shell, theme, tabs, FAB | Backend tests green, migrations up/down, mobile typecheck/lint/tests, web E2E auth flow |
| **2** | Notebooks (nested), notes CRUD (archive/restore/pin/favourite/duplicate/move), tags, rich-text editor with autosave and save state | User-isolation tests for every endpoint; editor round-trips `content_json` |
| **3** | Tasks (Today/Upcoming/Completed/All, priorities, recurrence), checklists in notes, reminders + local notifications, attachments via presigned S3 uploads with type/size validation | Uploads never pass through the API process; tasks toggle from notes |
| **4** | Keyword search: `tsvector` over title/body/tags/notebook/attachment metadata, snippets (`ts_headline`), ranking, filters | Sub-100 ms p95 on 10k notes |
| **5** | Embeddings pipeline (chunking, hashing, background worker), pgvector HNSW, `/search/semantic`, hybrid ranking | "OS scheduling" query finds the right note without keyword overlap |
| **6** | AI assistant: conversations, RAG (query embed → vector search → context → LLM), cited sources, streaming | Every answer lists the notes used |
| **7** | In-note AI tools (summarise, rewrite, tone, grammar, title, tags, checklist, translate), AI cleanup, Replace/Insert/Copy/Cancel UX | Never overwrites content without an explicit choice |
| **8** | Audio record/pause/resume/playback → transcription → summary → action items; image/PDF OCR into searchable text | Modular providers with a local fallback |
| **9** | Offline: persisted note cache (SQLite), offline create/edit, mutation queue, versioned sync with conflict copies | Airplane-mode edit syncs on reconnect; conflicts never lose text |
| **10** | Hardening: security review, load tests, observability, CI, production compose, EAS build profiles | Deploy runbook in README |
