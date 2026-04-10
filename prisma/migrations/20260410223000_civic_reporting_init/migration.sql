CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leader_role') THEN
    CREATE TYPE leader_role AS ENUM ('mla', 'mp', 'councillor', 'authority_official');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('citizen', 'moderator', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_severity') THEN
    CREATE TYPE report_severity AS ENUM ('minor', 'moderate', 'severe', 'critical');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('unresolved', 'in_progress', 'pending_verification', 'resolved');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waste_type') THEN
    CREATE TYPE waste_type AS ENUM (
      'household_waste',
      'construction_debris',
      'mixed_waste',
      'e_waste',
      'biomedical',
      'other'
    );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_multipolygon_geometry_from_geojson()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geom = ST_SetSRID(
    ST_Multi(ST_GeomFromGeoJSON(NEW.boundary_geojson::text)),
    4326
  )::geometry(MultiPolygon, 4326);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_report_point_geometry()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geometry(Point, 4326);
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.civic_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL UNIQUE,
  type text NOT NULL,
  description text,
  boundary_geojson jsonb,
  geom geometry(MultiPolygon, 4326),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id uuid REFERENCES public.civic_authorities(id) ON DELETE SET NULL,
  ward_number text NOT NULL,
  ward_name text NOT NULL,
  zone_name text,
  boundary_geojson jsonb NOT NULL,
  geom geometry(MultiPolygon, 4326),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(authority_id, ward_number)
);

CREATE TABLE IF NOT EXISTS public.assembly_constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  district_name text,
  boundary_geojson jsonb NOT NULL,
  geom geometry(MultiPolygon, 4326),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parliamentary_constituencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  boundary_geojson jsonb NOT NULL,
  geom geometry(MultiPolygon, 4326),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  short_name text NOT NULL UNIQUE,
  logo_url text NOT NULL,
  color_hex text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role leader_role NOT NULL,
  full_name text NOT NULL,
  party_id uuid REFERENCES public.parties(id) ON DELETE SET NULL,
  photo_url text,
  contact_phone text,
  contact_email text,
  official_url text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mla_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  assembly_constituency_id uuid NOT NULL REFERENCES public.assembly_constituencies(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(leader_id, assembly_constituency_id, start_date)
);

CREATE TABLE IF NOT EXISTS public.mp_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  parliamentary_constituency_id uuid NOT NULL REFERENCES public.parliamentary_constituencies(id) ON DELETE CASCADE,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(leader_id, parliamentary_constituency_id, start_date)
);

CREATE TABLE IF NOT EXISTS public.ward_leader_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid NOT NULL REFERENCES public.wards(id) ON DELETE CASCADE,
  leader_id uuid NOT NULL REFERENCES public.leaders(id) ON DELETE CASCADE,
  role_note text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(ward_id, leader_id)
);

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_provider_id text,
  role user_role NOT NULL DEFAULT 'citizen',
  name text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id text NOT NULL UNIQUE DEFAULT substring(replace(gen_random_uuid()::text, '-', '') from 1 for 12),
  title text NOT NULL,
  description text,
  address_text text NOT NULL,
  landmark text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  geom geometry(Point, 4326),
  authority_id uuid REFERENCES public.civic_authorities(id) ON DELETE SET NULL,
  ward_id uuid REFERENCES public.wards(id) ON DELETE SET NULL,
  assembly_constituency_id uuid REFERENCES public.assembly_constituencies(id) ON DELETE SET NULL,
  parliamentary_constituency_id uuid REFERENCES public.parliamentary_constituencies(id) ON DELETE SET NULL,
  mla_leader_id uuid REFERENCES public.leaders(id) ON DELETE SET NULL,
  mp_leader_id uuid REFERENCES public.leaders(id) ON DELETE SET NULL,
  severity report_severity NOT NULL,
  waste_type waste_type NOT NULL,
  status report_status NOT NULL DEFAULT 'unresolved',
  photo_url text NOT NULL,
  thumbnail_url text,
  reporter_count integer NOT NULL DEFAULT 1,
  created_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  resolved_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  session_fingerprint text,
  ip_hash text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  photo_url text NOT NULL,
  thumbnail_url text,
  note text,
  submitted_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT NOW(),
  reviewed_at timestamptz,
  reviewed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.report_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  from_status report_status,
  to_status report_status NOT NULL,
  note text,
  changed_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_civic_authorities_geom ON public.civic_authorities USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_wards_geom ON public.wards USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_assembly_constituencies_geom ON public.assembly_constituencies USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_parliamentary_constituencies_geom ON public.parliamentary_constituencies USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_reports_geom ON public.reports USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.reports (severity);
CREATE INDEX IF NOT EXISTS idx_reports_waste_type ON public.reports (waste_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status_severity ON public.reports (status, severity, waste_type);
CREATE INDEX IF NOT EXISTS idx_confirmations_report_id ON public.confirmations (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verifications_report_id ON public.verifications (report_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mla_assignments_constituency ON public.mla_assignments (assembly_constituency_id, end_date);
CREATE INDEX IF NOT EXISTS idx_mp_assignments_constituency ON public.mp_assignments (parliamentary_constituency_id, end_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_confirmations_session_unique
  ON public.confirmations (report_id, session_fingerprint)
  WHERE session_fingerprint IS NOT NULL;

DROP TRIGGER IF EXISTS trg_civic_authorities_sync_geom ON public.civic_authorities;
CREATE TRIGGER trg_civic_authorities_sync_geom
BEFORE INSERT OR UPDATE OF boundary_geojson ON public.civic_authorities
FOR EACH ROW
WHEN (NEW.boundary_geojson IS NOT NULL)
EXECUTE FUNCTION public.sync_multipolygon_geometry_from_geojson();

DROP TRIGGER IF EXISTS trg_wards_sync_geom ON public.wards;
CREATE TRIGGER trg_wards_sync_geom
BEFORE INSERT OR UPDATE OF boundary_geojson ON public.wards
FOR EACH ROW
EXECUTE FUNCTION public.sync_multipolygon_geometry_from_geojson();

DROP TRIGGER IF EXISTS trg_assembly_constituencies_sync_geom ON public.assembly_constituencies;
CREATE TRIGGER trg_assembly_constituencies_sync_geom
BEFORE INSERT OR UPDATE OF boundary_geojson ON public.assembly_constituencies
FOR EACH ROW
EXECUTE FUNCTION public.sync_multipolygon_geometry_from_geojson();

DROP TRIGGER IF EXISTS trg_parliamentary_constituencies_sync_geom ON public.parliamentary_constituencies;
CREATE TRIGGER trg_parliamentary_constituencies_sync_geom
BEFORE INSERT OR UPDATE OF boundary_geojson ON public.parliamentary_constituencies
FOR EACH ROW
EXECUTE FUNCTION public.sync_multipolygon_geometry_from_geojson();

DROP TRIGGER IF EXISTS trg_reports_sync_geom ON public.reports;
CREATE TRIGGER trg_reports_sync_geom
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.sync_report_point_geometry();

DROP TRIGGER IF EXISTS trg_civic_authorities_updated_at ON public.civic_authorities;
CREATE TRIGGER trg_civic_authorities_updated_at
BEFORE UPDATE ON public.civic_authorities
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_wards_updated_at ON public.wards;
CREATE TRIGGER trg_wards_updated_at
BEFORE UPDATE ON public.wards
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_assembly_constituencies_updated_at ON public.assembly_constituencies;
CREATE TRIGGER trg_assembly_constituencies_updated_at
BEFORE UPDATE ON public.assembly_constituencies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_parliamentary_constituencies_updated_at ON public.parliamentary_constituencies;
CREATE TRIGGER trg_parliamentary_constituencies_updated_at
BEFORE UPDATE ON public.parliamentary_constituencies
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_parties_updated_at ON public.parties;
CREATE TRIGGER trg_parties_updated_at
BEFORE UPDATE ON public.parties
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_leaders_updated_at ON public.leaders;
CREATE TRIGGER trg_leaders_updated_at
BEFORE UPDATE ON public.leaders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_mla_assignments_updated_at ON public.mla_assignments;
CREATE TRIGGER trg_mla_assignments_updated_at
BEFORE UPDATE ON public.mla_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_mp_assignments_updated_at ON public.mp_assignments;
CREATE TRIGGER trg_mp_assignments_updated_at
BEFORE UPDATE ON public.mp_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_ward_leader_links_updated_at ON public.ward_leader_links;
CREATE TRIGGER trg_ward_leader_links_updated_at
BEFORE UPDATE ON public.ward_leader_links
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_reports_updated_at ON public.reports;
CREATE TRIGGER trg_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.lookup_delhi_jurisdictions_by_point(input_lat double precision, input_lng double precision)
RETURNS TABLE (
  authority_id uuid,
  ward_id uuid,
  assembly_constituency_id uuid,
  parliamentary_constituency_id uuid,
  mla_leader_id uuid,
  mp_leader_id uuid
)
LANGUAGE sql
STABLE
AS $$
  WITH point_input AS (
    SELECT ST_SetSRID(ST_MakePoint(input_lng, input_lat), 4326) AS geom
  ),
  ward_match AS (
    SELECT w.id, w.authority_id
    FROM public.wards w, point_input p
    WHERE ST_Covers(w.geom, p.geom)
    ORDER BY w.ward_number
    LIMIT 1
  ),
  authority_match AS (
    SELECT COALESCE(
      (SELECT authority_id FROM ward_match),
      (SELECT a.id FROM public.civic_authorities a, point_input p WHERE ST_Covers(a.geom, p.geom) ORDER BY a.name LIMIT 1)
    ) AS id
  ),
  ac_match AS (
    SELECT ac.id
    FROM public.assembly_constituencies ac, point_input p
    WHERE ST_Covers(ac.geom, p.geom)
    ORDER BY ac.name
    LIMIT 1
  ),
  pc_match AS (
    SELECT pc.id
    FROM public.parliamentary_constituencies pc, point_input p
    WHERE ST_Covers(pc.geom, p.geom)
    ORDER BY pc.name
    LIMIT 1
  ),
  mla_match AS (
    SELECT ma.leader_id
    FROM public.mla_assignments ma
    JOIN ac_match ac ON ac.id = ma.assembly_constituency_id
    WHERE ma.end_date IS NULL OR ma.end_date >= CURRENT_DATE
    ORDER BY ma.start_date DESC NULLS LAST
    LIMIT 1
  ),
  mp_match AS (
    SELECT ma.leader_id
    FROM public.mp_assignments ma
    JOIN pc_match pc ON pc.id = ma.parliamentary_constituency_id
    WHERE ma.end_date IS NULL OR ma.end_date >= CURRENT_DATE
    ORDER BY ma.start_date DESC NULLS LAST
    LIMIT 1
  )
  SELECT
    (SELECT id FROM authority_match) AS authority_id,
    (SELECT id FROM ward_match) AS ward_id,
    (SELECT id FROM ac_match) AS assembly_constituency_id,
    (SELECT id FROM pc_match) AS parliamentary_constituency_id,
    (SELECT leader_id FROM mla_match) AS mla_leader_id,
    (SELECT leader_id FROM mp_match) AS mp_leader_id
$$;

CREATE OR REPLACE VIEW public.report_cards AS
SELECT
  r.id,
  r.public_id,
  r.title,
  r.description,
  r.address_text,
  r.landmark,
  r.latitude,
  r.longitude,
  r.severity,
  r.waste_type,
  r.status,
  r.photo_url,
  r.thumbnail_url,
  r.reporter_count,
  r.created_at,
  r.updated_at,
  r.resolved_at,
  ca.id AS authority_id,
  ca.slug AS authority_slug,
  ca.name AS authority_name,
  ca.type AS authority_type,
  w.id AS ward_id,
  w.ward_number,
  w.ward_name,
  w.zone_name,
  ac.id AS assembly_constituency_id,
  ac.name AS assembly_constituency_name,
  ac.code AS assembly_constituency_code,
  pc.id AS parliamentary_constituency_id,
  pc.name AS parliamentary_constituency_name,
  pc.code AS parliamentary_constituency_code,
  mla.id AS mla_leader_id,
  mla.full_name AS mla_name,
  mla_party.name AS mla_party_name,
  mla_party.short_name AS mla_party_short_name,
  mla_party.logo_url AS mla_party_logo_url,
  mla.contact_phone AS mla_contact_phone,
  mla.contact_email AS mla_contact_email,
  mla.official_url AS mla_official_url,
  mp.id AS mp_leader_id,
  mp.full_name AS mp_name,
  mp_party.name AS mp_party_name,
  mp_party.short_name AS mp_party_short_name,
  mp_party.logo_url AS mp_party_logo_url,
  mp.contact_phone AS mp_contact_phone,
  mp.contact_email AS mp_contact_email,
  mp.official_url AS mp_official_url
FROM public.reports r
LEFT JOIN public.civic_authorities ca ON ca.id = r.authority_id
LEFT JOIN public.wards w ON w.id = r.ward_id
LEFT JOIN public.assembly_constituencies ac ON ac.id = r.assembly_constituency_id
LEFT JOIN public.parliamentary_constituencies pc ON pc.id = r.parliamentary_constituency_id
LEFT JOIN public.leaders mla ON mla.id = r.mla_leader_id
LEFT JOIN public.parties mla_party ON mla_party.id = mla.party_id
LEFT JOIN public.leaders mp ON mp.id = r.mp_leader_id
LEFT JOIN public.parties mp_party ON mp_party.id = mp.party_id;
