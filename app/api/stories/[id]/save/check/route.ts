import { NextRequest } from "next/server";
import { db } from "@db";
import { saved_stories } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ saved: false });
    }

    const { id } = await params;
    const storyId = parseInt(id);
    if (isNaN(storyId)) {
      return Response.json({ error: "Invalid story ID" }, { status: 400 });
    }

    const savedStory = await db
      .select()
      .from(saved_stories)
      .where(
        and(
          eq(saved_stories.user_id, auth.user.id),
          eq(saved_stories.story_id, storyId)
        )
      )
      .limit(1);

    return Response.json({ saved: savedStory.length > 0 });
  } catch (error) {
    console.error("Error checking saved story:", error);
    return Response.json({ saved: false });
  }
}