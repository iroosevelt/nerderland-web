import { NextRequest } from "next/server";
import { db } from "@db";
import { subscriptions, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    
    // Look up the user ID by username
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username));
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }
    
    const userId = user.id;

    // Get subscribers with their user info
    const subscribersData = await db
      .select({
        id: subscriptions.id,
        subscriber_id: subscriptions.subscriber_id,
        created_at: subscriptions.created_at,
        subscriber: {
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
          level: users.level,
          nerdy_points: users.nerdy_points,
        },
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.subscriber_id, users.id))
      .where(eq(subscriptions.subscribed_to_id, userId))
      .orderBy(desc(subscriptions.created_at));

    // Get total count
    const totalCount = subscribersData.length;

    return Response.json({
      subscribers: subscribersData.map(sub => ({
        id: sub.id,
        created_at: sub.created_at,
        subscriber: {
          id: sub.subscriber.id,
          username: sub.subscriber.username || `User${sub.subscriber.id}`,
          avatar_url: sub.subscriber.avatar_url || "/img/avatar/little_wea.png",
          level: sub.subscriber.level || 1,
          nerdy_points: sub.subscriber.nerdy_points || 0,
        },
      })),
      total: totalCount,
    });
  } catch (error) {
    console.error("Error fetching subscribers:", error);
    return Response.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    );
  }
}