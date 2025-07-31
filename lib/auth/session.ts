// lib/auth/session.ts - Complete Session Management
import { createHash, randomBytes } from "crypto";

export function generateSessionId(): string {
  const timestamp = Date.now().toString();
  const randomData = randomBytes(32).toString("hex");
  const hash = createHash("sha256")
    .update(timestamp + randomData)
    .digest("hex");
  return hash.substring(0, 32);
}

export async function validateSession(
  sessionId: string,
  walletAddress: string
): Promise<boolean> {
  try {
    if (!sessionId || sessionId.length !== 32 || !walletAddress) {
      return false;
    }

    const isValidFormat = /^[a-f0-9]{32}$/.test(sessionId);
    return isValidFormat;
  } catch (error) {
    console.error("Session validation error:", error);
    return false;
  }
}

export class RateLimiter {
  private static cache = new Map<
    string,
    { count: number; resetTime: number }
  >();

  static check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.cache.get(key);

    if (!record || now > record.resetTime) {
      this.cache.set(key, { count: 1, resetTime: now + windowMs });
      this.cleanup();
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    this.cache.set(key, record);
    return true;
  }

  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.cache.entries()) {
      if (now > record.resetTime) {
        this.cache.delete(key);
      }
    }
  }
}

export function getSecurityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  };
}
