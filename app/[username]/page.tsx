// app/[username]/page.tsx

import { notFound } from "next/navigation";
import { db } from "@db";
import { users, stories, boards, board_members } from "@db/schema";
import { eq, desc, count, sql } from "drizzle-orm";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { AdminDashboard } from "@/components/profile/AdminDashboard";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

// Consistent date formatting helper
const formatDate = (date: Date | null | string): string => {
  if (!date) return "Unknown";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Use a consistent format that works on both server and client
  return dateObj.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Get comprehensive user data
async function getUserData(username: string) {
  try {
    // Get user info
    const userResult = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        avatar_url: users.avatar_url,
        nerdy_points: users.nerdy_points,
        level: users.level,
        created_at: users.created_at,
        wallet_address: users.wallet_address,
        dob: users.dob,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userResult.length === 0) {
      return null;
    }

    const user = userResult[0];

    // Get counts for different content types
    const [storiesCount, ownedBoardsCount, joinedBoardsCount] =
      await Promise.all([
        db
          .select({ count: count() })
          .from(stories)
          .where(eq(stories.user_id, user.id)),
        db
          .select({ count: count() })
          .from(boards)
          .where(eq(boards.user_id, user.id)),
        db
          .select({ count: count() })
          .from(board_members)
          .where(eq(board_members.user_id, user.id)),
      ]);

    const totalBoardsCount =
      ownedBoardsCount[0].count + joinedBoardsCount[0].count;

    // Get recent content
    const [recentStories, ownedBoards, joinedBoards] = await Promise.all([
      db
        .select({
          id: stories.id,
          title: stories.title,
          content: stories.content,
          media_url: stories.media_url,
          views: stories.views,
          created_at: stories.created_at,
          slug: stories.slug,
        })
        .from(stories)
        .where(eq(stories.user_id, user.id))
        .orderBy(desc(stories.created_at))
        .limit(6),

      // Get owned boards
      db
        .select({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          avatar_url: boards.avatar_url,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
          role: sql<string>`'owner'`.as("role"),
          owner_id: boards.user_id,
          owner_username: users.username,
          owner_avatar_url: users.avatar_url,
        })
        .from(boards)
        .innerJoin(users, eq(boards.user_id, users.id))
        .where(eq(boards.user_id, user.id))
        .orderBy(desc(boards.created_at))
        .limit(10),

      // Get joined boards (as member) with owner info
      db
        .select({
          id: boards.id,
          name: boards.name,
          description: boards.description,
          avatar_url: boards.avatar_url,
          is_public: boards.is_public,
          member_count: boards.member_count,
          created_at: boards.created_at,
          role: board_members.role,
          owner_id: boards.user_id,
          owner_username: sql<string>`owner.username`,
          owner_avatar_url: sql<string>`owner.avatar_url`,
        })
        .from(board_members)
        .innerJoin(boards, eq(board_members.board_id, boards.id))
        .innerJoin(sql`users AS owner`, sql`owner.id = ${boards.user_id}`)
        .where(eq(board_members.user_id, user.id))
        .orderBy(desc(board_members.joined_at))
        .limit(10),
    ]);

    // Combine and sort all boards by creation date
    const allBoards = [...ownedBoards, ...joinedBoards]
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 6);

    return {
      user: {
        ...user,
        // Pre-format the date on the server to avoid hydration issues
        formatted_created_at: formatDate(user.created_at),
      },
      stats: {
        stories: storiesCount[0].count,
        boards: totalBoardsCount,
      },
      content: {
        stories: recentStories.map((story) => ({
          ...story,
          formatted_created_at: formatDate(story.created_at),
        })),
        boards: allBoards.map((board) => ({
          id: board.id,
          name: board.name,
          description: board.description,
          avatar_url: board.avatar_url,
          is_public: board.is_public,
          member_count: board.member_count,
          created_at: board.created_at,
          role: board.role,
          formatted_created_at: formatDate(board.created_at),
          user: {
            id: board.owner_id,
            username: board.owner_username,
            avatar_url: board.owner_avatar_url || "/img/avatar/little_wea.png",
          },
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

export default async function UserProfilePage({ params }: PageProps) {
  const { username } = await params;

  if (!username) {
    notFound();
  }

  const userData = await getUserData(username);

  if (!userData) {
    notFound();
  }

  // Get authentication info from middleware headers
  const headersList = await headers();
  const userWallet = headersList.get("x-user-wallet");
  const isOwnerHeader = headersList.get("x-is-owner");

  // Determine if this is the owner viewing their own profile
  const isOwner =
    isOwnerHeader === "true" || userWallet === userData.user.wallet_address;

  if (isOwner) {
    return <AdminDashboard userData={userData} />;
  } else {
    return <PublicProfile userData={userData} />;
  }
}

// Generate metadata
export async function generateMetadata({ params }: PageProps) {
  const { username } = await params;

  try {
    const userResult = await db
      .select({
        username: users.username,
        created_at: users.created_at,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    if (userResult.length > 0) {
      const user = userResult[0];
      return {
        title: `${user.username} - Nerderland`,
        description: `Check out ${user.username}'s profile, stories, and boards on Nerderland`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "User Profile - Nerderland",
    description: "User profile on Nerderland",
  };
}
