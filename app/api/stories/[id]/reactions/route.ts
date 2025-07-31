import { NextRequest } from "next/server";
import { db } from "@db";
import { reactions, users, stories } from "@db/schema";
import { eq } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return Response.json({ error: "Invalid story ID" }, { status: 400 });
    }

    const { type } = await request.json();

    if (type !== "good_stuff") {
      return Response.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    // Allow multiple reactions (tipping) - no restriction check needed

    // Check if user is trying to tip their own story
    const [story] = await db
      .select({ user_id: stories.user_id })
      .from(stories)
      .where(eq(stories.id, storyId));

    if (story && story.user_id === auth.user.id) {
      return Response.json(
        { error: "You cannot tip your own story" },
        { status: 400 }
      );
    }

    // Check user's current points
    const [user] = await db
      .select({ nerdy_points: users.nerdy_points })
      .from(users)
      .where(eq(users.id, auth.user.id));

    if (!user || (user.nerdy_points || 0) < 1) {
      return Response.json(
        { error: "Insufficient nerdy points" },
        { status: 400 }
      );
    }

    // Deduct points and add reaction
    const pointsToSpend = 1;

    // Deduct points from user
    await db
      .update(users)
      .set({ nerdy_points: (user.nerdy_points || 0) - pointsToSpend })
      .where(eq(users.id, auth.user.id));

    // Add reaction
    await db.insert(reactions).values({
      user_id: auth.user.id,
      story_id: storyId,
      type: type,
      points_spent: pointsToSpend,
    });

    return Response.json({
      success: true,
      points_remaining: (user.nerdy_points || 0) - pointsToSpend,
    });
  } catch (error) {
    console.error("Error creating reaction:", error);
    return Response.json(
      { error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return Response.json({ error: "Invalid story ID" }, { status: 400 });
    }

    const reactionCounts = await db
      .select({
        type: reactions.type,
        count: reactions.points_spent,
      })
      .from(reactions)
      .where(eq(reactions.story_id, storyId));

    const counts = reactionCounts.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + (reaction.count || 0);
      return acc;
    }, {} as Record<string, number>);

    return Response.json({ reactions: counts });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    return Response.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}
