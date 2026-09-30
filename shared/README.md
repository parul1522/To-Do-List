# shared

Contracts shared across the monorepo.

- `types/api.ts` — TypeScript mirror of the backend's Pydantic schemas, imported
  by the mobile app as `@shared/types/api`. When a backend schema changes,
  update this file in the same commit.
