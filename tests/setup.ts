import { Blob, File } from "node:buffer";

Object.assign(process.env, {
  NODE_ENV: "test",
  APP_MODE: "mock",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  STORAGE_PROVIDER: "local",
  LOCAL_UPLOAD_DIR: "public/uploads",
  GEOCODER_PROVIDER: "mock",
  AI_PROVIDER: "mock",
  ADMIN_EMAIL: "admin@safaodisha.local",
  ADMIN_PASSWORD: "ChangeThis123!",
  ADMIN_SESSION_SECRET: "12345678901234567890123456789012",
  PREVIEW_TOKEN_SECRET: "abcdefghijklmnopqrstuvwxyz123456",
  MAX_UPLOAD_MB: "8",
  GPS_ACCURACY_WARN_THRESHOLD: "35",
  GPS_ACCURACY_BLOCK_THRESHOLD: "150",
  RATE_LIMIT_ANALYZE_PER_HOUR: "100",
  RATE_LIMIT_SUBMIT_PER_HOUR: "100",
});

globalThis.File = File as typeof globalThis.File;
globalThis.Blob = Blob as typeof globalThis.Blob;
