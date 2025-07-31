import { NextRequest } from "next/server";
import { db } from "@db";
import { adverts, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const advertId = parseInt(id);
    if (isNaN(advertId)) {
      return Response.json({ error: "Invalid advert ID" }, { status: 400 });
    }

    const [advert] = await db
      .select({
        id: adverts.id,
        title: adverts.title,
        content: adverts.content,
        image_url: adverts.image_url,
        link_url: adverts.link_url,
        created_at: adverts.created_at,
        user: {
          id: users.id,
          username: users.username,
          avatar_url: users.avatar_url,
        },
      })
      .from(adverts)
      .leftJoin(users, eq(adverts.user_id, users.id))
      .where(eq(adverts.id, advertId))
      .limit(1);

    if (!advert) {
      return Response.json({ error: "Advert not found" }, { status: 404 });
    }

    const formattedAdvert = {
      ...advert,
      formatted_created_at: advert.created_at?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) || "Unknown",
    };

    return Response.json(formattedAdvert);
  } catch (error) {
    console.error("Error fetching advert:", error);
    return Response.json(
      { error: "Failed to fetch advert" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const advertId = parseInt(id);
    if (isNaN(advertId)) {
      return Response.json({ error: "Invalid advert ID" }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, image_url, link_url } = body;

    // Check if advert exists and belongs to user
    const [existingAdvert] = await db
      .select({ user_id: adverts.user_id })
      .from(adverts)
      .where(eq(adverts.id, advertId))
      .limit(1);

    if (!existingAdvert) {
      return Response.json({ error: "Advert not found" }, { status: 404 });
    }

    if (existingAdvert.user_id !== auth.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Validate fields
    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (title.length > 100) {
      return Response.json(
        { error: "Title is too long" },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return Response.json(
        { error: "Content is too long" },
        { status: 400 }
      );
    }

    // Validate URL if provided
    if (link_url && link_url.trim() !== "") {
      try {
        new URL(link_url);
      } catch {
        return Response.json(
          { error: "Invalid link URL" },
          { status: 400 }
        );
      }
    }

    // Update the advert
    const [updatedAdvert] = await db
      .update(adverts)
      .set({
        title: title.trim(),
        content: content.trim(),
        image_url: image_url || null,
        link_url: link_url?.trim() || null,
      })
      .where(eq(adverts.id, advertId))
      .returning();

    return Response.json({ 
      advert: updatedAdvert,
      message: "Advert updated successfully" 
    });
  } catch (error) {
    console.error("Error updating advert:", error);
    return Response.json(
      { error: "Failed to update advert" },
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
    const advertId = parseInt(id);
    if (isNaN(advertId)) {
      return Response.json({ error: "Invalid advert ID" }, { status: 400 });
    }

    // Check if advert exists and belongs to user
    const [existingAdvert] = await db
      .select({ user_id: adverts.user_id })
      .from(adverts)
      .where(eq(adverts.id, advertId))
      .limit(1);

    if (!existingAdvert) {
      return Response.json({ error: "Advert not found" }, { status: 404 });
    }

    if (existingAdvert.user_id !== auth.user.id) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the advert
    await db.delete(adverts).where(eq(adverts.id, advertId));

    return Response.json({ message: "Advert deleted successfully" });
  } catch (error) {
    console.error("Error deleting advert:", error);
    return Response.json(
      { error: "Failed to delete advert" },
      { status: 500 }
    );
  }
}