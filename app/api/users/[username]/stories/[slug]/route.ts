// app/api/users/[username]/stories/[slug]/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { stories, users } from "@db/schema";
import { eq, and, or } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; slug: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";

    // Rate limiting
    if (!RateLimiter.check(`user-story:${clientIP}`, 30, 60000)) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const { username, slug } = await params;

    // Input validation
    if (!username || !slug) {
      return NextResponse.json(
        { error: "Username and story identifier are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Sanitize username
    const sanitizedUsername = username
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 20);
    if (sanitizedUsername !== username || sanitizedUsername.length < 3) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // Check if the identifier is numeric (ID) or string (slug)
      const isNumeric = /^\d+$/.test(slug);

      // Get the story with user validation
      const storyData = await db
        .select({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          views: stories.views,
          created_at: stories.created_at,
          slug: stories.slug,
          user_id: stories.user_id,
          user_username: users.username,
          user_avatar_url: users.avatar_url,
        })
        .from(stories)
        .leftJoin(users, eq(stories.user_id, users.id))
        .where(
          and(
            eq(users.username, sanitizedUsername),
            isNumeric
              ? or(eq(stories.id, parseInt(slug)), eq(stories.slug, slug))
              : eq(stories.slug, slug)
          )
        )
        .limit(1);

      if (storyData.length === 0) {
        return NextResponse.json(
          { error: "Story not found or doesn't belong to this user" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const story = storyData[0];

      // Increment view count
      try {
        await db
          .update(stories)
          .set({ views: (story.views || 0) + 1 })
          .where(eq(stories.id, story.id));
      } catch (viewError) {
        console.error("Failed to increment view count:", viewError);
        // Don't fail the request if view increment fails
      }

      // Format the response
      const formattedStory = {
        id: story.id,
        title: story.title,
        content: story.content,
        media_url: story.media_url,
        views: (story.views || 0) + 1,
        created_at: story.created_at?.toISOString() || new Date().toISOString(),
        slug: story.slug,
        user: {
          id: story.user_id,
          username: story.user_username || "Unknown",
          avatar_url: story.user_avatar_url || "/img/avatar/little_wea.png",
        },
      };

      const response = NextResponse.json(formattedStory);

      // Apply security headers
      Object.entries(getSecurityHeaders()).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Cache headers
      response.headers.set(
        "Cache-Control",
        "public, max-age=300, stale-while-revalidate=60"
      );

      return response;
    } catch (dbError) {
      console.error("Database error fetching user story:", dbError);
      return NextResponse.json(
        { error: "Failed to fetch story" },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in GET /api/users/[username]/stories/[slug]:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods
export async function POST() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "GET", ...getSecurityHeaders() } }
  );
}
