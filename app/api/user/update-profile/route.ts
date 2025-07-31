// app/api/user/update-profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@db";
import { users } from "@db/schema";
import { eq, and, ne } from "drizzle-orm";
import { headers } from "next/headers";
import { RateLimiter } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const headersList = await headers();
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Security: Validate session
    if (!userWallet || !sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    if (
      !RateLimiter.check(`profile-update:${userWallet}`, 10, 60 * 60 * 1000)
    ) {
      return NextResponse.json(
        { error: "Too many profile updates" },
        { status: 429 }
      );
    }

    const { username, email, dob, address } = await req.json();

    // Security: Verify wallet address matches session
    if (address !== userWallet) {
      return NextResponse.json(
        { error: "Wallet address mismatch" },
        { status: 403 }
      );
    }

    // Validate username if provided
    if (username) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        return NextResponse.json(
          { error: "Invalid username format" },
          { status: 400 }
        );
      }

      // Check if username is taken by another user
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(eq(users.username, username), ne(users.wallet_address, address))
        )
        .limit(1);

      if (existingUser.length > 0) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Validate email if provided
    if (email && email.trim() !== "") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: "Invalid email format" },
          { status: 400 }
        );
      }
    }

    // Update user
    const updated = await db
      .update(users)
      .set({
        username: username || undefined,
        email: email || null,
        dob: dob || null,
      })
      .where(eq(users.wallet_address, address))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: updated[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
