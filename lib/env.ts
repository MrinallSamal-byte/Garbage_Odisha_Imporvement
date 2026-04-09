import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_MODE: z.enum(["mock", "real"]).default("mock"),
  DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_PROVIDER: z.enum(["local", "s3"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("public/uploads"),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  GEOCODER_PROVIDER: z.enum(["mock", "nominatim"]).default("mock"),
  GEOCODER_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  AI_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  ADMIN_EMAIL: z.string().email().default("admin@safaodisha.local"),
  ADMIN_PASSWORD: z.string().min(8).default("ChangeThis123!"),
  ADMIN_SESSION_SECRET: z.string().min(32).default("replace-this-admin-session-secret-32"),
  PREVIEW_TOKEN_SECRET: z.string().min(32).default("replace-this-preview-token-secret-32"),
  MAX_UPLOAD_MB: z.coerce.number().default(8),
  GPS_ACCURACY_WARN_THRESHOLD: z.coerce.number().default(35),
  GPS_ACCURACY_BLOCK_THRESHOLD: z.coerce.number().default(150),
  RATE_LIMIT_ANALYZE_PER_HOUR: z.coerce.number().default(25),
  RATE_LIMIT_SUBMIT_PER_HOUR: z.coerce.number().default(15),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Environment validation error", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables for SafaOdisha");
}

export const env = parsed.data;
