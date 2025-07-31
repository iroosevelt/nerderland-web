import { NextRequest } from "next/server";
import { db } from "@db";
import { comments, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

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

    const commentsData = await db
      .select({
        id: comments.id,
        content: comments.content,
        created_at: comments.created_at,
        parent_id: comments.parent_id,
        user: {
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.story_id, storyId))
      .orderBy(desc(comments.created_at));

    // Organize comments in a tree structure
    const commentMap = new Map();
    const rootComments: Array<{
      id: number;
      content: string;
      created_at: Date | null;
      parent_id: number | null;
      user: {
        id: number;
        username: string;
        avatar_url: string | null;
      } | null;
      replies: Array<{
        id: number;
        content: string;
        created_at: Date | null;
        parent_id: number | null;
        user: {
          id: number;
          username: string;
          avatar_url: string | null;
        } | null;
        replies: Array<{
          id: number;
          content: string;
          created_at: Date | null;
          parent_id: number | null;
          user: {
            id: number;
            username: string;
            avatar_url: string | null;
          } | null;
          replies: unknown[];
        }>;
      }>;
    }> = [];

    commentsData.forEach((comment) => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    commentsData.forEach((comment) => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(commentMap.get(comment.id));
        }
      } else {
        rootComments.push(commentMap.get(comment.id));
      }
    });

    return Response.json({ comments: rootComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return Response.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

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

    const { content, parent_id } = await request.json();

    if (!content || content.trim().length === 0) {
      return Response.json({ error: "Comment content is required" }, { status: 400 });
    }

    if (content.length > 2000) {
      return Response.json({ error: "Comment too long" }, { status: 400 });
    }

    const [newComment] = await db
      .insert(comments)
      .values({
        user_id: auth.user.id,
        story_id: storyId,
        content: content.trim(),
        parent_id: parent_id || null,
      })
      .returning();

    // Fetch the complete comment with user data
    const [commentWithUser] = await db
      .select({
        id: comments.id,
        content: comments.content,
        created_at: comments.created_at,
        parent_id: comments.parent_id,
        user: {
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.user_id, users.id))
      .where(eq(comments.id, newComment.id));

    return Response.json({ comment: commentWithUser });
  } catch (error) {
    console.error("Error creating comment:", error);
    return Response.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}