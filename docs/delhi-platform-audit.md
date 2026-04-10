# Delhi Migration Audit

Date: 2026-04-10

## Current stack

- Framework: Next.js 15 App Router
- Language: TypeScript
- Styling: Tailwind CSS with custom UI primitives in `components/ui`
- UI kit status: custom CVA-based primitives; not full shadcn/ui, but close enough to extend
- Database layer: Prisma + PostgreSQL
- Geospatial path: raw SQL through Prisma in `server/repositories/postgis-geo-repository.ts`
- Mapping: `react-leaflet`
- Storage: local filesystem or S3 through `lib/storage/storage-adapter.ts`
- Auth: custom admin cookie auth; no citizen auth yet
- State management: page-local state today; Zustand added for upcoming shared filters
- Testing: Vitest + Testing Library
- Deployment shape: standalone Next.js output

## Current architecture

### Reusable parts worth keeping

- `components/ui/*`
  - buttons, cards, badges, inputs, selects, textarea, skeletons
- `components/maps/*`
  - Leaflet wrapper can be upgraded instead of replaced
- `lib/storage/*`
  - storage abstraction is reusable if we keep object storage outside the main DB
- `lib/utils/*`
  - request helpers, hashing, file helpers, rate limiting
- `lib/db/prisma.ts`
  - Prisma client bootstrap remains usable
- `server/repositories/postgis-geo-repository.ts`
  - the raw SQL pattern is the right direction for PostGIS lookups

### Odisha-specific parts that must be replaced or heavily refactored

- branding and copy across `app/*`, `components/layout/*`, `README.md`
- route model centered on Odisha districts and representatives
- current Prisma schema in `prisma/schema.prisma`
- GIS validation that rejects anything outside Odisha
- mock and sample geography in `data/mock/*` and `lib/mock/*`
- report and representative domain models in `types/domain.ts`

## Existing routes

### Public routes

- `/`
  - purpose: Odisha marketing landing page with light dashboard snapshot
  - keep/upgrade/replace: replace as Delhi public home
- `/dashboard`
  - purpose: Odisha public report map/list
  - keep/upgrade/replace: fold into `/` and preserve useful list/map pieces
- `/report`
  - purpose: old report submission flow
  - keep/upgrade/replace: replace with `/report/new`
- `/reports/[id]`
  - purpose: old public report detail page
  - keep/upgrade/replace: replace with canonical `/report/[id]`
- `/search`
  - purpose: report and representative search
  - keep/upgrade/replace: keep concept, refactor against Delhi entities
- `/leaderboard`
  - purpose: Odisha district leaderboard
  - keep/upgrade/replace: replace with `/stats`
- `/representatives/[id]`
  - purpose: old MLA/MP profile page
  - keep/upgrade/replace: split into `/mla/[id]` and `/mp/[id]`

### Admin routes

- `/admin`
  - purpose: moderation summary
  - keep/upgrade/replace: keep and refactor for Delhi moderation queues
- `/admin/login`
  - purpose: admin login
  - keep/upgrade/replace: keep
- `/admin/reports`
  - purpose: report moderation
  - keep/upgrade/replace: keep and extend
- `/admin/representatives`
  - purpose: representative management
  - keep/upgrade/replace: replace with leaders/jurisdiction admin tooling
- `/admin/imports`
  - purpose: GIS import instructions
  - keep/upgrade/replace: keep and rewrite for Delhi imports

### Missing routes required by the Delhi platform

- `/about`
- `/stats`
- `/report/new`
- `/report/[id]`
- `/report/[id]/verify`
- `/authority/[id]`
- `/ward/[id]`
- `/mla/[id]`
- `/mp/[id]`

## Existing backend/data flow

### Report creation path today

- `app/report/page.tsx`
- `components/report/live-report-experience.tsx`
- `app/api/reports/submit/route.ts`
- `server/services/report-submission-service.ts`
- `lib/storage/storage-adapter.ts`

This flow already has the right broad shape:

- capture/upload image
- capture location
- run representative lookup
- submit a report row

But it is coupled to the old Odisha schema and old moderation model.

### Report query path today

- `server/services/report-query-service.ts`
- `server/repositories/prisma-report-repository.ts`
- `app/dashboard/page.tsx`
- `app/reports/[id]/page.tsx`

This is reusable as a pattern, but not as a schema contract.

### Geospatial path today

- `server/services/spatial-lookup-service.ts`
- `server/repositories/postgis-geo-repository.ts`

This is the most directly reusable backend slice. The Delhi build should keep:

- raw SQL for point-in-polygon
- repository abstraction
- service layer above repository calls

## Database audit

### What the repo currently assumes

- Prisma is the DB entrypoint
- PostgreSQL is the DB
- PostGIS-backed geometry columns are used in the old schema

### What the Delhi target requires

- DigitalOcean Managed PostgreSQL as the only primary relational/geospatial DB
- PostGIS in that DB
- Delhi-wide civic authorities, wards, assembly constituencies, parliamentary constituencies, parties, leaders, reports, confirmations, verifications, and status history

### Verified blocker on the current DigitalOcean cluster

The connected DigitalOcean PostgreSQL cluster is reachable, but `postgis` is not currently available on it.

Verified findings:

- `pgcrypto` available
- `uuid-ossp` available
- `postgis` absent from `pg_available_extensions`

Impact:

- the new Delhi migration in `prisma/migrations/20260410223000_civic_reporting_init/migration.sql` cannot apply on this exact cluster as-is
- the non-negotiable requirement "all GIS lookups must run from this DB using PostGIS" is blocked until the cluster exposes PostGIS

This does not mean a second DB should be created. It means the DigitalOcean primary DB must be made PostGIS-capable first.

## Delhi data sourcing audit

### Ward and local authority coverage

Verified local source:

- `datameet/Municipal_Spatial_Data` Delhi wards GeoJSON

The Delhi ward dataset includes:

- MCD-style numbered wards
- NDMC wards
- Delhi Cantonment entries

This is useful because it matches the requirement to support special governance areas.

### Assembly and parliamentary constituency coverage

Verified ArcGIS source:

- NCR Geo Portal service with Delhi assembly and parliamentary constituency geometries

Important caveat:

- the assembly constituency pull returned 69 features
- Delhi should have 70 assembly constituencies
- AC 37 was missing from that source during validation

Result:

- constituency import pipeline should support source replacement or patch files
- the app must degrade gracefully if a geometry source is incomplete

### Leaders and parties

Added:

- `data/delhi/parties.json`
- template CSVs for MLA and MP assignments

Still missing:

- final current MLA roster
- final current MP roster
- official URLs and contact details for all leaders

These should be loaded from curated CSVs or official sources before production seed.

## Migration plan

### Phase 1: shell and route refactor

- replace Odisha metadata and header/footer copy
- add PWA shell
- create canonical Delhi route structure
- preserve current working pages while the Delhi routes are built

### Phase 2: DB authority on DigitalOcean Postgres

- keep Prisma as connection manager
- use raw SQL for PostGIS operations
- keep env-only DB credentials
- add retry-safe DB utilities and health checks

### Phase 3: Delhi schema

- apply the new Delhi governance schema once PostGIS is available on the DigitalOcean cluster
- migrate away from Odisha-only tables and domain models
- keep image metadata in DigitalOcean Postgres

### Phase 4: Delhi GIS import pipeline

- import civic authorities
- import wards and special local bodies
- import Delhi assembly constituencies
- import Delhi parliamentary constituencies
- import parties and leader assignments

### Phase 5: public product

- home map/list
- filter state in URL
- report submission flow
- report detail and confirmations
- cleanup verification flow
- stats
- authority/ward/MLA/MP pages

### Phase 6: moderation and hardening

- admin verification review
- moderation actions
- OG metadata
- tests
- README and deployment notes

## Immediate implementation decision

Proceed with the platform refactor in this order:

1. document current state and blocker
2. add PWA shell and canonical routes
3. isolate new Delhi data access code from old Odisha services
4. keep the current app bootable
5. stop short of claiming GIS-complete production readiness until the DigitalOcean cluster exposes PostGIS

