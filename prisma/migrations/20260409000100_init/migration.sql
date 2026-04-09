CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'ADMIN', 'MODERATOR');
CREATE TYPE "SourceType" AS ENUM ('LIVE_CAPTURE', 'GALLERY_UPLOAD', 'MANUAL_PIN_ONLY');
CREATE TYPE "ReportCategory" AS ENUM ('garbage', 'overflow', 'drain', 'roadside_dump', 'mixed_waste', 'litter', 'other');
CREATE TYPE "ReportSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "ReportStatus" AS ENUM ('REPORTED', 'VERIFIED', 'FORWARDED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'DUPLICATE');
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVIEW');
CREATE TYPE "RepresentativeType" AS ENUM ('MLA', 'MP');
CREATE TYPE "ConstituencyType" AS ENUM ('ASSEMBLY', 'PARLIAMENT');
CREATE TYPE "PartyLevelScope" AS ENUM ('STATE', 'NATIONAL', 'BOTH');

CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT UNIQUE,
  "phone" TEXT,
  "password_hash" TEXT,
  "role" "UserRole" NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "districts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "code" TEXT NOT NULL UNIQUE,
  "geometry" geometry(MultiPolygon, 4326),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "assembly_constituencies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "district_name" TEXT,
  "geometry" geometry(MultiPolygon, 4326) NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "parliament_constituencies" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "geometry" geometry(MultiPolygon, 4326) NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "parties" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "abbreviation" TEXT NOT NULL,
  "level_scope" "PartyLevelScope" NOT NULL,
  "is_state_ruling_party_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_central_ruling_party_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "representatives" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "representative_type" "RepresentativeType" NOT NULL,
  "name" TEXT NOT NULL,
  "constituency_type" "ConstituencyType" NOT NULL,
  "assembly_constituency_id" UUID REFERENCES "assembly_constituencies"("id"),
  "parliament_constituency_id" UUID REFERENCES "parliament_constituencies"("id"),
  "party_name" TEXT NOT NULL,
  "is_state_ruling_party" BOOLEAN NOT NULL DEFAULT FALSE,
  "is_central_ruling_party" BOOLEAN NOT NULL DEFAULT FALSE,
  "opposition_label" TEXT,
  "photo_url" TEXT,
  "official_role_title" TEXT,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "website_url" TEXT,
  "social_links_json" JSONB,
  "term_start" TIMESTAMPTZ,
  "term_end" TIMESTAMPTZ,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_verified_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "reports" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_code" TEXT NOT NULL UNIQUE,
  "source_type" "SourceType" NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ReportCategory" NOT NULL,
  "severity" "ReportSeverity" NOT NULL,
  "status" "ReportStatus" NOT NULL DEFAULT 'REPORTED',
  "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "trust_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "gps_accuracy_meters" DOUBLE PRECISION NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "location_point" geometry(Point, 4326) NOT NULL,
  "address_line" TEXT NOT NULL,
  "locality" TEXT,
  "ward_name" TEXT,
  "block_name" TEXT,
  "district_id" UUID REFERENCES "districts"("id"),
  "assembly_constituency_id" UUID REFERENCES "assembly_constituencies"("id"),
  "parliament_constituency_id" UUID REFERENCES "parliament_constituencies"("id"),
  "mla_representative_id" UUID REFERENCES "representatives"("id"),
  "mp_representative_id" UUID REFERENCES "representatives"("id"),
  "ai_issue_detected" BOOLEAN NOT NULL DEFAULT FALSE,
  "ai_issue_type" "ReportCategory" NOT NULL DEFAULT 'other',
  "ai_confidence_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "ai_gps_image_consistency" TEXT NOT NULL DEFAULT 'low',
  "ai_suspicious_flag" BOOLEAN NOT NULL DEFAULT FALSE,
  "ai_summary_json" JSONB NOT NULL,
  "anonymous_flag" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_by_user_id" UUID REFERENCES "users"("id"),
  "device_fingerprint_hash" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "media_assets" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "storage_key" TEXT NOT NULL,
  "original_filename" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "file_size" INTEGER NOT NULL,
  "width" INTEGER,
  "height" INTEGER,
  "sha256_hash" TEXT NOT NULL,
  "exif_json" JSONB,
  "captured_at" TIMESTAMPTZ,
  "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "report_status_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "old_status" "ReportStatus",
  "new_status" "ReportStatus" NOT NULL,
  "note" TEXT NOT NULL,
  "changed_by_user_id" UUID REFERENCES "users"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "report_comments" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users"("id"),
  "display_name" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "moderation_status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "report_votes" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "user_id" UUID REFERENCES "users"("id"),
  "session_key" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "moderation_logs" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "report_id" UUID NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "moderator_id" UUID REFERENCES "users"("id"),
  "action_type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "odisha_boundary" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL UNIQUE,
  "geometry" geometry(MultiPolygon, 4326) NOT NULL
);

CREATE INDEX "reports_status_created_at_idx" ON "reports" ("status", "created_at" DESC);
CREATE INDEX "reports_category_severity_idx" ON "reports" ("category", "severity");
CREATE INDEX "reports_district_id_idx" ON "reports" ("district_id");
CREATE INDEX "reports_assembly_constituency_id_idx" ON "reports" ("assembly_constituency_id");
CREATE INDEX "reports_parliament_constituency_id_idx" ON "reports" ("parliament_constituency_id");
CREATE INDEX "reports_source_type_idx" ON "reports" ("source_type");
CREATE INDEX "representatives_type_active_idx" ON "representatives" ("representative_type", "active");
CREATE INDEX "representatives_assembly_idx" ON "representatives" ("assembly_constituency_id");
CREATE INDEX "representatives_parliament_idx" ON "representatives" ("parliament_constituency_id");
CREATE INDEX "media_assets_report_idx" ON "media_assets" ("report_id");
CREATE INDEX "media_assets_hash_idx" ON "media_assets" ("sha256_hash");
CREATE INDEX "report_status_history_report_idx" ON "report_status_history" ("report_id", "created_at" DESC);
CREATE INDEX "report_comments_report_idx" ON "report_comments" ("report_id", "created_at" DESC);
CREATE INDEX "report_votes_report_idx" ON "report_votes" ("report_id", "created_at" DESC);
CREATE INDEX "moderation_logs_report_idx" ON "moderation_logs" ("report_id", "created_at" DESC);
CREATE INDEX "assembly_constituencies_name_idx" ON "assembly_constituencies" ("name");
CREATE INDEX "parliament_constituencies_name_idx" ON "parliament_constituencies" ("name");

CREATE INDEX "districts_geometry_gist_idx" ON "districts" USING GIST ("geometry");
CREATE INDEX "assembly_constituencies_geometry_gist_idx" ON "assembly_constituencies" USING GIST ("geometry");
CREATE INDEX "parliament_constituencies_geometry_gist_idx" ON "parliament_constituencies" USING GIST ("geometry");
CREATE INDEX "reports_location_point_gist_idx" ON "reports" USING GIST ("location_point");
CREATE INDEX "odisha_boundary_geometry_gist_idx" ON "odisha_boundary" USING GIST ("geometry");

CREATE UNIQUE INDEX "report_votes_report_id_user_id_unique"
  ON "report_votes" ("report_id", "user_id")
  WHERE "user_id" IS NOT NULL;

CREATE UNIQUE INDEX "report_votes_report_id_session_key_unique"
  ON "report_votes" ("report_id", "session_key")
  WHERE "session_key" IS NOT NULL;
