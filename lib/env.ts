import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["mock", "real"]).default("mock"),
  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
  PGDATABASE: z.string().optional(),
  PGSSLMODE: z.string().default("require"),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["local", "s3", "database"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("public/uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  GEOCODER_PROVIDER: z.enum(["mock", "nominatim"]).default("mock"),
  GEOCODER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["mock", "openai", "openrouter"]).default("mock"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  OPENROUTER_MODEL: z.string().default("google/gemma-4-31b-it:free"),
  ADMIN_EMAIL: z.string().email().default("admin@safaodisha.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeThis123!"),
  ADMIN_SESSION_SECRET: z.string().min(32).default("replace-this-admin-session-secret-32"),
  PREVIEW_TOKEN_SECRET: z.string().min(32).default("replace-this-preview-token-secret-32"),
  MAX_UPLOAD_MB: z.coerce.number().default(8),
  GPS_ACCURACY_WARN_THRESHOLD: z.coerce.number().default(35),
  GPS_ACCURACY_BLOCK_THRESHOLD: z.coerce.number().default(150),
  RATE_LIMIT_ANALYZE_PER_HOUR: z.coerce.number().default(25),
  RATE_LIMIT_SUBMIT_PER_HOUR: z.coerce.number().default(15),
  NEXT_PUBLIC_COMMUNITY_LINK: z.string().url().default("https://t.me/garbagewatchdelhi"),
  NEXT_PUBLIC_COMPLAINT_WHATSAPP: z.string().default("https://wa.me/919999999999"),
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation error", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables for SafaOdisha");
}

function normalizeAppUrl(value?: string) {
  const fallback = "http://localhost:3000";

  if (!value) {
    return fallback;
  }

  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    console.warn(`Invalid NEXT_PUBLIC_APP_URL "${value}" provided. Falling back to ${fallback}.`);
    return fallback;
  }
}

export const env = {
  ...parsed.data,
  NEXT_PUBLIC_APP_URL: normalizeAppUrl(parsed.data.NEXT_PUBLIC_APP_URL),
};
