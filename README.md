# SafaOdisha

SafaOdisha is a production-oriented civic cleanliness reporting platform for Odisha, India. Citizens can capture a live photo from the device camera, share GPS, map the point to Odisha GIS constituencies, view the current MLA and MP assigned to that location, and publish the report on a public accountability dashboard.

The app is built with a real architecture for:

- GPS-first report capture
- GIS-based point-in-polygon constituency lookup
- database-managed representative records and ruling-party flags
- public reporting, comments, support votes, and status timelines
- admin moderation and representative management
- mock mode for local no-DB runs
- PostGIS mode for authoritative spatial operations

## Product name

This codebase uses the name `SafaOdisha` consistently across UI, API, config, and documentation.

## Core principles

- Exact location comes from browser/device GPS and geospatial lookup, never image-only AI.
- Live camera capture is the primary reporting flow.
- MLA/MP lookup comes from GIS constituency mapping plus representative database records.
- Party and ruling-status badges are loaded from data records, not hardcoded in the frontend.
- AI is only used for scene understanding, OCR/clue extraction, mismatch detection, and moderation assistance.

## Stack

- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS
- Backend: Next.js route handlers with service and repository layers
- Database: PostgreSQL + PostGIS
- ORM: Prisma with raw SQL migrations for geometry fields and spatial indexes
- Maps: React Leaflet
- Validation: Zod
- Storage: local filesystem adapter plus S3-compatible adapter interface
- Image processing: Sharp + EXIF parsing
- Testing: Vitest

## Runtime modes

### Mock mode

Use `APP_MODE=mock` when you want a full local run without PostgreSQL/PostGIS. In this mode:

- the app runs fully end-to-end
- seeded Odisha-like sample polygons are used
- report data is persisted into `data/mock/runtime-store.json`
- GIS lookup is performed against local GeoJSON using Turf
- AI defaults to an honest mock heuristic provider

This is the default development path for machines that do not have PostGIS installed.

### Real mode

Use `APP_MODE=real` when PostgreSQL + PostGIS are available. In this mode:

- Prisma migrations create relational tables
- raw SQL migration enables PostGIS and geometry indexes
- spatial lookups use PostGIS `ST_Covers`
- GIS import scripts load real GeoJSON files into the spatial tables
- representative records are seeded into PostgreSQL

## Key features

- Landing page with state stats and workflow explanation
- Live report page with:
  - live camera capture
  - gallery fallback
  - GPS permission and accuracy capture
  - reverse geocoding abstraction
  - Odisha-only validation
  - constituency lookup
  - MLA/MP preview cards
  - AI verification summary
  - trust score and review notes
- Public dashboard with filters, map, and report list
- Report detail page with image, map, timeline, comments, support votes, and representative cards
- Representative profile page with area-linked reports
- Admin login, moderation queue, representative management, and import notes

## Folder structure

```text
app/
components/
data/
  mock/
lib/
  ai/
  auth/
  db/
  geo/
  gis/
  mock/
  storage/
  utils/
  validation/
prisma/
scripts/
server/
  repositories/
  services/
  workflows/
tests/
types/
public/
```

## Local setup

### Option A: quick local run with mock mode

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template:

```bash
cp .env.example .env
```

3. Keep `APP_MODE=mock` in `.env`.

4. Reset mock data:

```bash
npm run seed:mock
```

5. Start the app:

```bash
npm run dev
```

6. Open:

```text
http://localhost:3000
```

### Option B: run with PostgreSQL + PostGIS

1. Provision a PostgreSQL database with PostGIS enabled.
2. Set `APP_MODE=real` and `DATABASE_URL` in `.env`.
3. Apply migrations:

```bash
npx prisma migrate deploy
```

4. Seed the sample Odisha-like data into PostGIS:

```bash
npm run db:seed
```

5. Start the app:

```bash
npm run dev
```

## Environment variables

See `.env.example` for the full list. The most important ones are:

- `APP_MODE`
- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `STORAGE_PROVIDER`
- `LOCAL_UPLOAD_DIR`
- `GEOCODER_PROVIDER`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `GPS_ACCURACY_WARN_THRESHOLD`
- `GPS_ACCURACY_BLOCK_THRESHOLD`

## Database and PostGIS

The schema is defined in:

- `prisma/schema.prisma`
- `prisma/migrations/20260409000100_init/migration.sql`

Highlights:

- geometry columns for Odisha boundary, districts, constituencies, and report points
- GIST indexes on spatial columns
- representative records linked to assembly and parliament constituencies
- status history, comments, votes, moderation logs, and media assets

## Mock data included

The repo includes Odisha-like sample data in:

- `data/mock/odisha-boundary.geojson`
- `data/mock/districts.geojson`
- `data/mock/assembly-constituencies.geojson`
- `data/mock/parliament-constituencies.geojson`
- `data/mock/representatives.json`

These are intentionally small, test-oriented sample datasets for local end-to-end development.

## GIS and representative lookup flow

1. Capture browser GPS
2. Reverse geocode coordinates
3. Confirm the point is inside Odisha
4. Run AI on the image for clues and moderation support
5. Resolve district, assembly constituency, and parliament constituency
6. Load active MLA and MP records from the data layer
7. Return preview data to the user
8. Persist the report on final submit

In real mode, the authoritative spatial lookup is PostGIS-based. In mock mode, the same flow is reproduced against local GeoJSON so the app remains usable without a database.

## AI provider design

AI is wrapped behind `lib/ai/report-image-analyzer.ts`.

Available providers:

- `mock`
- `openai`

Structured output includes:

- `issue_detected`
- `issue_type`
- `confidence_score`
- `visible_landmarks`
- `detected_text`
- `language_detected`
- `likely_environment`
- `garbage_severity`
- `gps_image_consistency`
- `suspicious_flag`
- `moderation_notes`
- `locality_clues`

Important: AI is never treated as the source of exact coordinates.

## Storage provider design

Storage is wrapped behind `lib/storage/storage-adapter.ts`.

Available providers:

- `local`
- `s3`

Local mode stores files beneath `public/uploads`. The S3 adapter is included for production readiness.

## Import scripts

### Mock runtime reset

```bash
npm run seed:mock
```

### Representative seed

```bash
npm run seed:representatives
```

### Boundary import

```bash
npm run import:odisha-boundary
npm run import:odisha-boundary -- ./path/to/odisha-boundary.geojson
```

### Assembly import

```bash
npm run import:assembly
npm run import:assembly -- ./path/to/assembly.geojson
```

### Parliament import

```bash
npm run import:parliament
npm run import:parliament -- ./path/to/parliament.geojson
```

When `APP_MODE=mock`, these commands validate the files and preserve the local no-DB developer workflow. When `APP_MODE=real`, they load the data into PostgreSQL/PostGIS.

## Testing

Run:

```bash
npm run test
```

Included coverage:

- Odisha boundary validation
- GPS to constituency mapping
- representative lookup by point
- trust score rules
- duplicate detection
- analyze + submit API integration
- admin status update flow
- smoke test for seeded mock report flow

## Quality and verification commands

```bash
npm run typecheck
npm run lint
npm run test
npm run test:smoke
```

## Docker

### App image

Use the included `Dockerfile`.

### Local stack

Use the included `docker-compose.yml` to start:

- Next.js app
- PostgreSQL + PostGIS

Then run migrations and seed from inside the app container.

## Deployment notes

For production, separate the services into:

- frontend/app hosting for Next.js
- managed PostgreSQL with PostGIS
- object storage for media
- optional external reverse geocoder
- optional OpenAI API key for real multimodal analysis

## Limitations

- The bundled GIS data is sample/mock and not official Odisha election geometry.
- The real PostGIS report repository path is scaffolded through the schema, migrations, and import pipeline, but local automated verification in this environment was performed in mock mode because PostgreSQL/PostGIS is not installed here.
- The admin import API routes are intentionally lightweight; the primary import path is the documented CLI pipeline.
- Mock AI mode is explicit and honest about using heuristics rather than true multimodal inspection.

## Recommended next expansions

- replace mock geometry with authoritative Odisha GIS datasets
- update MLA/MP records after elections
- add OTP citizen authentication
- add multilingual English/Odia UI
- integrate municipal or ward-level boundaries
- add notification channels such as email or WhatsApp
