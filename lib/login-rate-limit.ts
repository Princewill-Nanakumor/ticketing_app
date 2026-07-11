type AttemptState = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, AttemptState>();

function getKey(email: string, ip?: string | null) {
  return `${(ip ?? "unknown").trim()}::${email.trim().toLowerCase()}`;
}

export function checkLoginRateLimit(email: string, ip?: string | null) {
  const key = getKey(email, ip);
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 0, resetAt: now + WINDOW_MS });
    return { allowed: true as const, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false as const,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((current.resetAt - now) / 1000),
      ),
    };
  }

  return { allowed: true as const, retryAfterSeconds: 0 };
}

export function recordFailedLogin(email: string, ip?: string | null) {
  const key = getKey(email, ip);
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }

  current.count += 1;
  attempts.set(key, current);
}

export function clearLoginRateLimit(email: string, ip?: string | null) {
  attempts.delete(getKey(email, ip));
}
