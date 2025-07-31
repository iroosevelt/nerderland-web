// lib/auth/server.ts
import { cookies } from "next/headers";
import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { validateSession } from "./session";

export async function getServerAuth() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session-id')?.value;
    const walletAddress = cookieStore.get('wallet-address')?.value;

    if (!sessionId || !walletAddress) {
      return null;
    }

    // Validate session
    const isValidSession = await validateSession(sessionId, walletAddress);
    if (!isValidSession) {
      return null;
    }

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.wallet_address, walletAddress))
      .limit(1);

    if (!user) {
      return null;
    }

    return {
      user: {
        id: user.id, // Keep as number, don't convert to string
        wallet_address: user.wallet_address,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url,
        nerdy_points: user.nerdy_points,
        level: user.level,
        created_at: user.created_at,
        dob: user.dob,
      }
    };
  } catch (error) {
    console.error("Server auth error:", error);
    return null;
  }
}