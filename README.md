# Delhi Garbage Watch

Delhi Garbage Watch is being migrated from the existing SafaOdisha codebase into a Delhi-wide civic garbage reporting platform. Citizens can capture a garbage photo from a phone, share GPS, map the point to the correct Delhi civic authority, ward or equivalent local unit, MLA, and MP, then publish the report on a public map/list dashboard.

The app is built with a real architecture for:

- GPS-first report capture
- DigitalOcean PostgreSQL as the single primary relational/geospatial database
- PostGIS point-in-polygon lookup for civic authority, ward, assembly, and parliamentary boundaries
- database-managed party, leader, and jurisdiction records
- public reporting, confirmations, cleanup verification, and status history
- admin moderation and representative management
- PWA install support for mobile use

## Migration status

The current codebase still contains older Odisha routes, tests, and import scripts while the Delhi migration is in progress. New Delhi-specific work is under:

- `lib/delhi/*`
- `components/delhi/*`
- `app/report/new`
- `app/report/[id]`
- `app/authority/[id]`
- `app/ward/[id]`
- `app/mla/[id]`
- `app/mp/[id]`
- `app/stats`
- `docs/delhi-platform-audit.md`

Important current blocker:

- the connected DigitalOcean PostgreSQL cluster is reachable
- `postgis` is not available on that cluster yet
- the Delhi migration cannot be applied until the same primary DigitalOcean database is PostGIS-capable

## Core principles

- Exact location comes from browser/device GPS and geospatial lookup, never image-only AI.
- Live camera capture is the primary reporting flow.
- Civic authority, ward, MLA, and MP lookup must come from DigitalOcean PostgreSQL + PostGIS.
- Party names and logos are loaded from data records, not copied from a reference site.
- Anonymous citizen reporting is allowed by default.

## Stack

- Frontend: Next.js 15 App Router, TypeScript, Tailwind CSS
- Backend: Next.js route handlers with service and repository layers
- Database: existing DigitalOcean Managed PostgreSQL cluster only
- Geospatial: PostGIS in that same DigitalOcean database
- ORM/query layer: Prisma client with raw SQL for PostGIS operations
- Maps: React Leaflet
- Validation: Zod
- Storage: local filesystem adapter plus S3-compatible adapter interface
- Image processing: Sharp + EXIF parsing
- Testing: Vitest
- PWA: `public/manifest.webmanifest`, `public/sw.js`, and install button in the header

## Required environment variables

Do not commit real credentials. Use `.env`, `.env.local`, production secrets, or hosting environment settings.

```bash
DATABASE_URL=
PGHOST=
PGPORT=25060
PGUSER=
PGPASSWORD=
PGDATABASE=
PGSSLMODE=require

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_COMMUNITY_LINK=https://t.me/garbagewatchdelhi
NEXT_PUBLIC_COMPLAINT_WHATSAPP=https://wa.me/<number>

STORAGE_PROVIDER=local # local, s3, or database
LOCAL_UPLOAD_DIR=public/uploads
```

## DigitalOcean PostgreSQL setup

The Delhi schema requires these database extensions in the existing DigitalOcean PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Check connection and extension availability:

```bash
set -a; source .env; set +a; npm run db:health
```

Current expected failure mode on the existing cluster:

```text
DigitalOcean PostgreSQL connection is healthy, but GIS prerequisites are incomplete.
PostGIS is not available on the connected DigitalOcean PostgreSQL cluster.
```

Do not create a second primary Postgres database to work around this. The DigitalOcean primary database must be made PostGIS-capable first.

## Delhi migrations and imports

After PostGIS is available on the existing DigitalOcean database:

```bash
set -a; source .env; set +a; npm run db:migrate
set -a; source .env; set +a; npm run import:delhi:boundaries
set -a; source .env; set +a; npm run import:delhi:parties
set -a; source .env; set +a; npm run import:delhi:leaders
```

Leader imports expect curated CSV files:

```text
data/delhi/assembly-leaders.csv
data/delhi/parliament-leaders.csv
```

Templates are provided in `data/delhi/*.template.csv`.

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

## Bhubaneswar MP/MLA lookup

The Bhubaneswar representative detector is available at `/representatives/by-location` and is also shown inside the report form after GPS capture. The browser only sends latitude and longitude to `POST /api/political-representatives/by-location`; the backend reverse geocodes the point, loads the active `political_area_mappings` JSONB row, and then resolves representatives in this order:

1. constituency polygon contains the GPS point
2. reverse-geocoded BMC ward number
3. reverse-geocoded gram panchayat or village
4. normalized locality keyword score
5. ambiguous/manual review fallback

GPS alone is not enough when the available political data is keyword based. A raw coordinate must be converted into administrative or locality evidence before it can be matched to the JSON. When polygon data is missing, the response is explicitly marked as an approximate fallback with `matched_by`, `confidence_score`, and notes.

Seed or refresh the active mapping:

```bash
npm run seed:political-mapping
```

Accuracy improves when ward shapefiles and assembly/Lok Sabha GeoJSON are loaded into PostGIS, because polygon containment can return `matched_by: "polygon"` with high confidence before keyword fallback runs.

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

This project targets Node.js 20+, which matches the production Docker image and current dependency set.

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

For DigitalOcean App Platform deployments without durable local disk or object storage, set
`STORAGE_PROVIDER=database` with `DATABASE_URL` pointed at the managed PostgreSQL database. Uploaded
report images are then written to `public.uploaded_media` and served through `/api/uploads/...`.

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

Local mode stores files beneath `public/uploads` by default. If you override `LOCAL_UPLOAD_DIR`, keep it inside the `public/` tree so uploaded media remains web-accessible. The S3 adapter is included for production readiness.

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
