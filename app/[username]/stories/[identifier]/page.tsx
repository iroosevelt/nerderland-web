// app/[username]/stories/[identifier]/page.tsx

import { notFound } from "next/navigation";
import { db } from "@db";
import { users, stories } from "@db/schema";
import { eq, and, or } from "drizzle-orm";
import { StoryModal } from "@/components/story/StoryModal";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    username: string;
    identifier: string; // Can be either slug or ID
  }>;
}

// Validate that the story belongs to the specified user (handles both slug and ID)
async function validateStoryOwnership(username: string, identifier: string) {
  try {
    const isNumeric = /^\d+$/.test(identifier);

    const result = await db
      .select({
        story_id: stories.id,
        story_slug: stories.slug,
        user_username: users.username,
      })
      .from(stories)
      .leftJoin(users, eq(stories.user_id, users.id))
      .where(
        and(
          eq(users.username, username),
          isNumeric
            ? or(
                eq(stories.id, parseInt(identifier)),
                eq(stories.slug, identifier)
              )
            : eq(stories.slug, identifier)
        )
      )
      .limit(1);

    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("Error validating story ownership:", error);
    return null;
  }
}

export default async function UserStoryPage({ params }: PageProps) {
  const { username, identifier } = await params;

  if (!username || !identifier) {
    notFound();
  }

  // Validate that the story belongs to the specified user
  const storyInfo = await validateStoryOwnership(username, identifier);

  if (!storyInfo) {
    notFound();
  }

  // Use the slug if available, otherwise use the ID
  const storyIdentifier = storyInfo.story_slug || storyInfo.story_id.toString();

  return (
    <div className="w-full bg-black border border-white/10 transition rounded-none">
      <main className="container max-w-5xl mx-auto flex justify-center">
        {/* Pass both slug and username to StoryModal */}
        <StoryModal slug={storyIdentifier} username={username} />
      </main>
    </div>
  );
}

// Generate metadata for the story page
export async function generateMetadata({ params }: PageProps) {
  const { username, identifier } = await params;

  try {
    const isNumeric = /^\d+$/.test(identifier);

    const result = await db
      .select({
        title: stories.title,
        content: stories.content,
        username: users.username,
      })
      .from(stories)
      .leftJoin(users, eq(stories.user_id, users.id))
      .where(
        and(
          eq(users.username, username),
          isNumeric
            ? or(
                eq(stories.id, parseInt(identifier)),
                eq(stories.slug, identifier)
              )
            : eq(stories.slug, identifier)
        )
      )
      .limit(1);

    if (result.length > 0) {
      const story = result[0];
      return {
        title: `${story.title} - by ${story.username}`,
        description: story.content.replace(/<[^>]*>/g, "").slice(0, 160),
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Story",
    description: "Read this story",
  };
}
