/**
 * In-memory login rate limiter for Cloudflare Workers.
 *
 * Tracks failed login attempts per email address.
 * After MAX_ATTEMPTS failures within WINDOW_MS, the key is blocked for BLOCK_MS.
 *
 * Note: state is per-isolate. For a multi-isolate / high-traffic deployment
 * consider Cloudflare KV or Durable Objects for global coordination.
 * For a typical CRM with a small team this is more than sufficient.
 */

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 2 * 60 * 1000; // 2 minutes sliding window
const BLOCK_MS = 2 * 60 * 1000; // 2 minutes block after limit exceeded

const store = new Map<string, AttemptRecord>();

/** Call BEFORE validating credentials. Returns 429 response data if blocked. */
export function checkLoginRateLimit(key: string): { blocked: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = store.get(key);

  if (!record) return { blocked: false };

  // Currently in a hard block
  if (record.blockedUntil !== null && now < record.blockedUntil) {
    return { blocked: true, retryAfter: Math.ceil((record.blockedUntil - now) / 1000) };
  }

  // Window has expired — clear stale record
  if (now - record.firstAttempt > WINDOW_MS) {
    store.delete(key);
    return { blocked: false };
  }

  return { blocked: false };
}

/** Call AFTER a FAILED login attempt. */
export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  let record = store.get(key);

  if (!record || now - record.firstAttempt > WINDOW_MS) {
    record = { count: 0, firstAttempt: now, blockedUntil: null };
  }

  record.count++;

  if (record.count >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_MS;
  }

  store.set(key, record);
}

/** Call AFTER a SUCCESSFUL login — resets the counter for that key. */
export function clearAttempts(key: string): void {
  store.delete(key);
}
