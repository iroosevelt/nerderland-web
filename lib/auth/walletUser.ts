// lib/auth/walletUser.ts
"use server";

import { db } from "@db";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { generateUniqueUsername } from "../generateUniqueUsername";

export async function getOrCreateWalletUser(walletAddress: string) {
  try {
    // First, try to find existing user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.wallet_address, walletAddress))
      .limit(1);

    if (user) {
      return user;
    }

    // Generate unique username for new user
    const username = await generateUniqueUsername();

    // Create new user with default values
    const [newUser] = await db
      .insert(users)
      .values({
        wallet_address: walletAddress,
        username,
        avatar_url: "/img/avatar/little_wea.png",
        nerdy_points: 50,
        level: 1,
        email: null, // Explicitly set nullable fields
        dob: null,
      })
      .returning();

    return newUser;
  } catch (error) {
    console.error("Error in getOrCreateWalletUser:", error);
    throw new Error("Failed to get or create wallet user");
  }
}
