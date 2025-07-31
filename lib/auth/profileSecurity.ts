// lib/auth/profileSecurity.ts
import { db } from "@db";
import { users } from "@db/schema";
import { eq, and, ne } from "drizzle-orm";
import { rateLimit } from "./middleware";

export class ProfileSecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "ProfileSecurityError";
  }
}

export async function validateProfileUpdate(
  currentUserId: number,
  updates: {
    username?: string;
    email?: string;
    dob?: string;
  }
): Promise<{
  success: boolean;
  sanitizedUpdates?: Record<string, unknown>;
  error?: string;
}> {
  try {
    // Rate limiting per user
    const rateLimitResult = rateLimit(
      `profile-update:${currentUserId}`,
      3, // 3 updates per 5 minutes
      5 * 60 * 1000
    );

    if (!rateLimitResult.success) {
      throw new ProfileSecurityError(
        "Too many profile updates. Please wait before trying again.",
        "RATE_LIMIT_EXCEEDED",
        429
      );
    }

    const sanitizedUpdates: Record<string, unknown> = {};

    // Username validation and sanitization
    if (updates.username !== undefined) {
      const username = updates.username.trim();

      // Length check
      if (username.length < 3 || username.length > 20) {
        throw new ProfileSecurityError(
          "Username must be between 3 and 20 characters",
          "INVALID_USERNAME_LENGTH"
        );
      }

      // Format validation
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new ProfileSecurityError(
          "Username can only contain letters, numbers, and underscores",
          "INVALID_USERNAME_FORMAT"
        );
      }

      // Reserved names check
      const reservedNames = [
        "admin",
        "api",
        "www",
        "mail",
        "ftp",
        "localhost",
        "root",
        "support",
        "info",
        "help",
        "news",
        "blog",
        "shop",
        "store",
        "app",
        "mobile",
        "stories",
        "drops",
        "boards",
        "nerdrum",
        "nerd",
        "profile",
        "settings",
        "dashboard",
        "upload",
        "download",
        "file",
        "static",
        "assets",
        "public",
        "private",
        "test",
        "dev",
        "staging",
        "prod",
        "production",
        "null",
        "undefined",
        "true",
        "false",
        "nerderland",
        "nfts",
        "crypto",
        "wallet",
        "ethereum",
        "bitcoin",
        "web3",
        "defi",
        "dao",
        "token",
        "mint",
        "burn",
      ];

      if (reservedNames.includes(username.toLowerCase())) {
        throw new ProfileSecurityError(
          "This username is reserved and cannot be used",
          "RESERVED_USERNAME"
        );
      }

      // Profanity check (basic implementation)
      const profanityWords = ["spam", "scam", "fake", "admin", "moderator"];
      if (profanityWords.some(word => username.toLowerCase().includes(word))) {
        throw new ProfileSecurityError(
          "Username contains inappropriate content",
          "INAPPROPRIATE_USERNAME"
        );
      }

      // Uniqueness check
      const existingUser = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.username, username), ne(users.id, currentUserId)))
        .limit(1);

      if (existingUser.length > 0) {
        throw new ProfileSecurityError(
          "Username is already taken",
          "USERNAME_TAKEN",
          409
        );
      }

      sanitizedUpdates.username = username;
    }

    // Email validation and sanitization
    if (updates.email !== undefined) {
      const email = updates.email.trim();

      if (email && email !== "") {
        // Email format validation
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
          throw new ProfileSecurityError(
            "Invalid email format",
            "INVALID_EMAIL_FORMAT"
          );
        }

        // Length check
        if (email.length > 255) {
          throw new ProfileSecurityError(
            "Email address is too long",
            "EMAIL_TOO_LONG"
          );
        }

        // Disposable email check (basic implementation)
        const disposableDomains = ["tempmail.org", "10minutemail.com", "mailinator.com"];
        const emailDomain = email.split("@")[1]?.toLowerCase();
        if (emailDomain && disposableDomains.includes(emailDomain)) {
          throw new ProfileSecurityError(
            "Disposable email addresses are not allowed",
            "DISPOSABLE_EMAIL"
          );
        }

        sanitizedUpdates.email = email.toLowerCase();
      } else {
        sanitizedUpdates.email = null;
      }
    }

    // Date of birth validation
    if (updates.dob !== undefined) {
      const dob = updates.dob.trim();

      if (dob && dob !== "") {
        // Date format validation
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
          throw new ProfileSecurityError(
            "Invalid date format. Use YYYY-MM-DD",
            "INVALID_DATE_FORMAT"
          );
        }

        const dobDate = new Date(dob);
        const now = new Date();

        // Valid date check
        if (isNaN(dobDate.getTime())) {
          throw new ProfileSecurityError("Invalid date", "INVALID_DATE");
        }

        // Age validation (13-120 years)
        const age = now.getFullYear() - dobDate.getFullYear();
        const monthDiff = now.getMonth() - dobDate.getMonth();
        const dayDiff = now.getDate() - dobDate.getDate();

        const actualAge =
          age - (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? 1 : 0);

        if (actualAge < 13) {
          throw new ProfileSecurityError(
            "You must be at least 13 years old to use this platform",
            "UNDERAGE"
          );
        }

        if (actualAge > 120) {
          throw new ProfileSecurityError(
            "Invalid date of birth",
            "INVALID_AGE"
          );
        }

        // Future date check
        if (dobDate > now) {
          throw new ProfileSecurityError(
            "Date of birth cannot be in the future",
            "FUTURE_DATE"
          );
        }

        sanitizedUpdates.dob = dob;
      } else {
        sanitizedUpdates.dob = null;
      }
    }

    return {
      success: true,
      sanitizedUpdates,
    };
  } catch (error) {
    if (error instanceof ProfileSecurityError) {
      return {
        success: false,
        error: error.message,
      };
    }

    console.error("Profile validation error:", error);
    return {
      success: false,
      error: "Validation failed",
    };
  }
}
