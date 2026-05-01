// Modular rate limiter — auto-detects Upstash Redis, falls back to in-memory.
// Works everywhere: Vercel Edge (Redis) + local dev (in-memory).

import config from "@/lib/config";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = config.rateLimit.windowMs;
const MAX_REQUESTS = config.rateLimit.maxRequests;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/* ── Strategy interface ── */

interface RateLimitStrategy {
  check(ip: string): Promise<RateLimitResult>;
}

/* ── 1. Upstash Redis strategy (serverless-safe) ── */

function createUpstashStrategy(): RateLimitStrategy | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.startsWith("your_")) return null;

  try {
    const redis = new Redis({ url, token });
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, `${WINDOW_MS}ms`),
      analytics: true,
      prefix: "portfolio:ratelimit",
    });

    console.log("[rate-limiter] Using Upstash Redis strategy");

    return {
      async check(ip: string): Promise<RateLimitResult> {
        const { success, remaining, reset } = await limiter.limit(ip);
        if (success) return { allowed: true, remaining, resetAt: reset };
        const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
        return { allowed: false, remaining: 0, resetAt: reset, retryAfter };
      },
    };
  } catch {
    console.warn("[rate-limiter] Upstash packages not available, skipping");
    return null;
  }
}

/* ── 2. In-memory strategy (local dev / single-process) ── */

function createInMemoryStrategy(): RateLimitStrategy {
  const store = new Map<string, { count: number; resetAt: number }>();

  console.log("[rate-limiter] Using in-memory strategy (local dev mode)");

  return {
    async check(ip: string): Promise<RateLimitResult> {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || entry.resetAt < now) {
        store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        return { allowed: true, remaining: MAX_REQUESTS - 1, resetAt: now + WINDOW_MS };
      }

      if (entry.count >= MAX_REQUESTS) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter };
      }

      entry.count += 1;
      return { allowed: true, remaining: MAX_REQUESTS - entry.count, resetAt: entry.resetAt };
    },
  };
}

/* ── Auto-detect: try Upstash first, fall back to in-memory ── */

const strategy: RateLimitStrategy = createUpstashStrategy() ?? createInMemoryStrategy();

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  return strategy.check(ip);
}
