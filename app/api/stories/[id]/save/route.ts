import { NextRequest } from "next/server";
import { db } from "@db";
import { saved_stories } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function POST(
  _request: NextRequest,
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

    // Check if already saved
    const existingSave = await db
      .select()
      .from(saved_stories)
      .where(
        and(
          eq(saved_stories.user_id, auth.user.id),
          eq(saved_stories.story_id, storyId)
        )
      )
      .limit(1);

    if (existingSave.length > 0) {
      return Response.json({ error: "Story already saved" }, { status: 400 });
    }

    await db.insert(saved_stories).values({
      user_id: auth.user.id,
      story_id: storyId,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error saving story:", error);
    return Response.json(
      { error: "Failed to save story" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    await db
      .delete(saved_stories)
      .where(
        and(
          eq(saved_stories.user_id, auth.user.id),
          eq(saved_stories.story_id, storyId)
        )
      );

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error unsaving story:", error);
    return Response.json(
      { error: "Failed to unsave story" },
      { status: 500 }
    );
  }
}