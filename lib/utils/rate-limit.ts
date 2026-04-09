type RateLimitBucket = {
  hits: number[];
};

const buckets = new Map<string, RateLimitBucket>();

export function checkRateLimit(key: string, maxHits: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((timestamp) => now - timestamp <= windowMs);

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
