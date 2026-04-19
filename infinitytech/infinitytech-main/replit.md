# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: Replit-managed PostgreSQL via Drizzle ORM (`@workspace/db`)
- **Media storage**: Cloudinary (signed uploads via `/api/projects/upload-signature`)
- **Validation**: Zod, `drizzle-zod`
- **Build**: esbuild (ESM bundle for API server)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (port 8080)
│   └── infinity-tech/      # Portfolio frontend + embedded admin panel (port 21976)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas
│   └── db/                 # Drizzle ORM schema + DB connection (Replit Postgres)
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

## Database

All data (projects, contact messages, analytics) is stored in the Replit-managed PostgreSQL database via Drizzle ORM.

- Run `pnpm --filter @workspace/db run push` to apply schema changes.
- Schema lives in `lib/db/src/schema/`.
- Env vars set automatically: `DATABASE_URL`, `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`.

### Schema: projects table

Columns: `id, title_en, title_ar, description_en, description_ar, overview_en, overview_ar, thumbnail_url, video_url, assets_zip_url, tags, status, github_url, live_link, category, language, custom_sections (jsonb), timeline (jsonb), files (jsonb), media (jsonb), updates (jsonb), created_at, updated_at`

> Note: Legacy columns `problem_en`, `problem_ar`, `solution_en`, `solution_ar`, `code_snippet` remain in the DB schema but are no longer used in the admin UI.

## Required Secrets

| Secret | Used By |
|---|---|
| `DATABASE_URL` | api-server, db package (auto-set by Replit) |
| `ADMIN_PIN` | api-server (default: `admin2024`) |
| `CLOUDINARY_CLOUD_NAME` | api-server |
| `CLOUDINARY_API_KEY` | api-server |
| `CLOUDINARY_API_SECRET` | api-server |
| `VITE_CLOUDINARY_CLOUD_NAME` | frontend (infinity-tech) |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | api-server (auto-provisioned) |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | api-server (auto-provisioned) |

## Artifacts

### `artifacts/infinity-tech` — Portfolio Website + Admin Panel (`/`)

- **Public pages**: Home, Projects, Project Detail, About, Contact
- **Admin panel**: Embedded at `/admin`, PIN-protected (`it-admin-pin` in localStorage, default `admin2024`)
- **Admin features**:
  - Projects list with 16:9 thumbnails (object-fit: cover)
  - Full project editor: bilingual title/description/overview, tags, status, GitHub URL, thumbnail upload
  - Dynamic custom sections (user-defined, bilingual title + content, add/remove)
  - Glassmorphic custom dropdowns (dark bg, cyan borders) for Status / Code Language / File Type
  - Hero Video upload (Cloudinary direct browser upload with XHR progress bar, `f_auto,q_auto` optimization)
  - Video preview (local blob URL preview before upload; saved URL preview after)
  - Files, Media, Updates, History tabs
  - Full CRUD via API (POST/PATCH/DELETE `/api/projects`)
- **API proxy**: Vite dev server proxies `/api` → `http://localhost:8080`
- **Contact form**: Posts to `/api/contact`
- **Analytics**: Fire-and-forget events to `/api/analytics/event`

### `artifacts/api-server` — Express API (port 8080)

Routes:
- `GET /api/projects` — public project listing
- `GET /api/projects/:id` — public single project + analytics stats
- `POST /api/projects` — create project (requires `x-admin-pin` header)
- `PUT /api/projects/:id` — full replace (requires `x-admin-pin`)
- `PATCH /api/projects/:id` — partial update (requires `x-admin-pin`)
- `DELETE /api/projects/:id` — delete (requires `x-admin-pin`)
- `POST /api/projects/upload-signature` — Cloudinary signed upload URL (images)
- `POST /api/projects/video-upload-signature` — Cloudinary signed upload URL (videos, resource_type=video)
- `POST /api/projects/:id/translate` — auto-translate bilingual fields via OpenAI
- `POST /api/contact` — contact form submission
- `POST /api/analytics/event` — analytics event ingestion
- `GET /api/analytics/summary` — aggregated stats
- `GET/POST/PATCH/DELETE /api/comments/:projectId`
- `GET/PATCH /api/notifications`
- `GET/POST/DELETE /api/push/*` — Web Push subscriptions
- `GET /api/healthz`

Security:
- **Helmet** — secure HTTP headers
- **CORS** — restricted to `*.replit.app`, `*.replit.dev`, `localhost`
- **Rate limiting** — 200 req/15 min global; 30 writes/min on projects
- **Input sanitization** — allowlist of writable fields on project writes
- **Body size limit** — 1 MB

## Admin Auth Flow

- Admin PIN stored in `localStorage` under key `it-admin-pin` (default: `admin2024`)
- All admin API calls send `x-admin-pin: <pin>` header
- API server validates against `process.env.ADMIN_PIN || "admin2024"`

## Admin Data Layer

- **Store**: `artifacts/infinity-tech/src/admin/data/store.ts`
  - `dbToAdmin()` maps snake_case DB rows → camelCase `AdminProject`
  - `adminToDb()` maps camelCase `AdminProject` → snake_case API payload
  - `useStore()` hook exposes: `projects, loading, saving, error, createProject, updateProject, deleteProject, addUpdate, removeUpdate, addFile, removeFile, addMedia, removeMedia, resetToDefaults`
- **Types**: `artifacts/infinity-tech/src/admin/data/types.ts`
  - `AdminProject`, `CustomSection`, `ProjectFile`, `ProjectMedia`, `ProjectUpdate`, `Commit`
- **Initial data**: `artifacts/infinity-tech/src/admin/data/initialProjects.ts` (used only if DB is empty)

## Translation System

**File**: `artifacts/api-server/src/lib/translate.ts`

Two-layer pipeline on every project write when only one language is provided:

| Layer | Tool | Notes |
|---|---|---|
| Layer 1 | OpenAI `gpt-4o-mini` | Engineering-domain system prompt; acronyms (PCB, RTOS, I2C) kept in Latin |
| Fallback | MyMemory MT | Used only when OpenAI call fails |
| Fallback layer 2 | Engineering dictionary | 60+ term overrides applied on top of MyMemory output only |
| Cache | In-process LRU (2 000 entries) | Keyed by `{lang}→{lang}:{text}`; cleared between server restarts |

If both `*_en` and `*_ar` are supplied, translation is skipped for that field.

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` (`composite: true`). Build order:
1. `pnpm run typecheck` — `tsc --build --emitDeclarationOnly`
2. `pnpm --filter @workspace/api-server run build` — esbuild bundle

## Workflows

| Workflow | Command | Port |
|---|---|---|
| API Server | `PORT=8080 pnpm --filter @workspace/api-server run dev` | 8080 |
| Start application | `PORT=21976 BASE_PATH=/ pnpm --filter @workspace/infinity-tech run dev` | 21976 |
