// lib/auth/middleware.ts
import { NextRequest } from "next/server";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export async function validateWalletAuth(request: NextRequest) {
  try {
    // Get wallet address from cookie or header
    const walletAddress =
      request.cookies.get("wallet-address")?.value ||
      request.headers.get("x-wallet-address");

    if (!walletAddress) {
      return {
        success: false,
        error: "No wallet address provided",
        status: 401,
      };
    }

    // Validate wallet address format (basic check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return {
        success: false,
        error: "Invalid wallet address format",
        status: 400,
      };
    }

    // Verify user exists in database
    const user = await db
      .select()
      .from(users)
      .where(eq(users.wallet_address, walletAddress))
      .limit(1);

    if (user.length === 0) {
      return { success: false, error: "User not found", status: 404 };
    }

    return {
      success: true,
      user: user[0],
      walletAddress,
    };
  } catch (error) {
    console.error("Auth validation error:", error);
    return { success: false, error: "Internal server error", status: 500 };
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  const now = Date.now();
  const key = identifier;

  const current = rateLimitMap.get(key);

  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return {
      success: false,
      error: "Rate limit exceeded",
      resetTime: current.resetTime,
    };
  }

  current.count++;
  return { success: true, remaining: maxRequests - current.count };
}
