import { db } from "@db";
import { saved_stories, stories, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function GET() {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get saved stories with story details and author info
    const savedStoriesData = await db
      .select({
        id: stories.id,
        title: stories.title,
        content: stories.content,
        media_url: stories.media_url,
        views: stories.views,
        created_at: stories.created_at,
        slug: stories.slug,
        saved_at: saved_stories.created_at,
        author: {
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(saved_stories)
      .innerJoin(stories, eq(saved_stories.story_id, stories.id))
      .innerJoin(users, eq(stories.user_id, users.id))
      .where(eq(saved_stories.user_id, auth.user.id))
      .orderBy(desc(saved_stories.created_at));

    return Response.json({ 
      savedStories: savedStoriesData.map(story => ({
        ...story,
        formatted_created_at: story.created_at?.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long", 
          day: "numeric"
        }) || "Unknown",
        formatted_saved_at: story.saved_at?.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        }) || "Unknown"
      }))
    });
  } catch (error) {
    console.error("Error fetching saved stories:", error);
    return Response.json(
      { error: "Failed to fetch saved stories" },
      { status: 500 }
    );
  }
}