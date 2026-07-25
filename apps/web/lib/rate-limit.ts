const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 10;

interface Bucket {
	count: number;
	resetAt: number;
}

/**
 * Best-effort throttle on share-code guessing.
 *
 * This is in-memory, so on serverless it is per-instance and resets on cold
 * start — it raises the cost of grinding 234k combinations without being a
 * hard guarantee. That is the honest security level of a 4-letter code, and
 * why codes are casual privacy rather than a secret. Upgrade path when it
 * matters: move the counter into the Postgres that ships with the Supabase
 * project.
 */
const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
	allowed: boolean;
	retryAfterSeconds: number;
}

export function consumeAttempt(key: string, now = Date.now()): RateLimitResult {
	const bucket = buckets.get(key);

	if (bucket === undefined || now >= bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
		sweep(now);
		return { allowed: true, retryAfterSeconds: 0 };
	}

	bucket.count += 1;
	if (bucket.count > MAX_ATTEMPTS) {
		return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
	}
	return { allowed: true, retryAfterSeconds: 0 };
}

/** Keeps the map from growing without bound on a long-lived instance. */
function sweep(now: number): void {
	if (buckets.size < 1000) return;
	for (const [key, bucket] of buckets) {
		if (now >= bucket.resetAt) buckets.delete(key);
	}
}

export function clientKey(request: { headers: Headers }): string {
	const forwarded = request.headers.get("x-forwarded-for");
	return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
