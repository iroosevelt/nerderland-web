import { NextRequest } from "next/server";
import { db } from "@db";
import { subscriptions, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    
    // Look up the user ID by username
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const targetUserId = targetUser.id;
    const subscriberId = auth.user.id; // Already a number from getServerAuth

    if (subscriberId === targetUserId) {
      return Response.json({ error: "Cannot subscribe to yourself" }, { status: 400 });
    }

    // Check if already subscribed
    const [existingSubscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriber_id, subscriberId),
          eq(subscriptions.subscribed_to_id, targetUserId)
        )
      );

    if (existingSubscription) {
      return Response.json({ error: "Already subscribed" }, { status: 400 });
    }

    // Create subscription
    await db.insert(subscriptions).values({
      subscriber_id: subscriberId,
      subscribed_to_id: targetUserId,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error creating subscription:", error);
    return Response.json(
      { error: "Failed to create subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username } = await params;
    
    // Look up the user ID by username
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const targetUserId = targetUser.id;
    const subscriberId = auth.user.id; // Already a number from getServerAuth

    // Delete subscription
    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriber_id, subscriberId),
          eq(subscriptions.subscribed_to_id, targetUserId)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    return Response.json(
      { error: "Failed to delete subscription" },
      { status: 500 }
    );
  }
}

// GET subscription status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ subscribed: false });
    }

    const { username } = await params;
    
    // Look up the user ID by username
    const [targetUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    if (!targetUser) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const targetUserId = targetUser.id;
    const subscriberId = auth.user.id; // Already a number from getServerAuth

    // Check if subscribed
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriber_id, subscriberId),
          eq(subscriptions.subscribed_to_id, targetUserId)
        )
      );

    return Response.json({ subscribed: !!subscription });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return Response.json(
      { error: "Failed to check subscription" },
      { status: 500 }
    );
  }
}