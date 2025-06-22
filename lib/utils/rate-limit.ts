import { NextRequest, NextResponse } from 'next/server';

interface RateLimitOptions {
  max: number;
  window: number; // in milliseconds
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

// In a real application, this would use a persistent store like Redis
// For demonstration, we'll use a simple in-memory map
const requestCounts = new Map<string, { count: number; lastReset: number }>();

export const rateLimit = {
  async check(
    request: NextRequest,
    key: string,
    options: RateLimitOptions
  ): Promise<RateLimitResult> {
    const now = Date.now();
    let entry = requestCounts.get(key);

    if (!entry || now - entry.lastReset > options.window) {
      entry = { count: 0, lastReset: now };
      requestCounts.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, options.max - entry.count);
    const reset = entry.lastReset + options.window;

    return {
      success: entry.count <= options.max,
      limit: options.max,
      remaining: remaining,
      reset: reset,
    };
  },
};
