type RateLimitBucket = {
  hits: number[];
  lastAccess: number;
};

const buckets = new Map<string, RateLimitBucket>();

// Evict stale buckets every 10 minutes to prevent unbounded memory growth.
const EVICTION_INTERVAL_MS = 10 * 60 * 1000;
const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours idle

function evictStaleBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastAccess > STALE_THRESHOLD_MS) {
      buckets.delete(key);
    }
  }
}

if (typeof setInterval !== "undefined") {
  setInterval(evictStaleBuckets, EVICTION_INTERVAL_MS).unref?.();
}

export function checkRateLimit(key: string, maxHits: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [], lastAccess: now };
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp <= windowMs);
  bucket.lastAccess = now;

  if (bucket.hits.length >= maxHits) {
    buckets.set(key, bucket);
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: windowMs - (now - bucket.hits[0]),
    };
  }

  bucket.hits.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: maxHits - bucket.hits.length,
    retryAfterMs: 0,
  };
}
