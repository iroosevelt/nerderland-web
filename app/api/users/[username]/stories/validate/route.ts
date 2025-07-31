// app/api/users/[username]/stories/validate/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { stories, users } from "@db/schema";
import { eq, and } from "drizzle-orm";

// GET - Validate story ownership and existence
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const slug = searchParams.get("slug");

  if (!username || !slug) {
    return NextResponse.json(
      { error: "Username and slug are required" },
      { status: 400 }
    );
  }

  try {
    const result = await db
      .select({
        story_id: stories.id,
        story_slug: stories.slug,
        user_username: users.username,
        story_title: stories.title,
      })
      .from(stories)
      .leftJoin(users, eq(stories.user_id, users.id))
      .where(and(eq(stories.slug, slug), eq(users.username, username)))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { exists: false, error: "Story not found or doesn't belong to user" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      exists: true,
      story: result[0],
    });
  } catch (error) {
    console.error("Error validating story:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
