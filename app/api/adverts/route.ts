import { NextRequest } from "next/server";
import { db } from "@db";
import { adverts, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { getServerAuth } from "@/lib/auth/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    const advertsData = await db
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
      .orderBy(desc(adverts.created_at))
      .limit(limit)
      .offset(offset);

    const formattedAdverts = advertsData.map(advert => ({
      ...advert,
      formatted_created_at: advert.created_at?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      }) || "Unknown",
    }));

    return Response.json({ adverts: formattedAdverts });
  } catch (error) {
    console.error("Error fetching adverts:", error);
    return Response.json(
      { error: "Failed to fetch adverts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getServerAuth();
    if (!auth?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, image_url, link_url, walletAddress } = body;

    // Validate required fields
    if (!title || !content) {
      return Response.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Validate title length
    if (title.length > 100) {
      return Response.json(
        { error: "Title is too long" },
        { status: 400 }
      );
    }

    // Validate content length
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

    // Verify user owns the wallet address
    if (walletAddress !== auth.user.wallet_address) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create the advert
    const [newAdvert] = await db
      .insert(adverts)
      .values({
        user_id: auth.user.id,
        title: title.trim(),
        content: content.trim(),
        image_url: image_url || null,
        link_url: link_url?.trim() || null,
      })
      .returning();

    return Response.json({ 
      advert: newAdvert,
      message: "Advert created successfully" 
    });
  } catch (error) {
    console.error("Error creating advert:", error);
    return Response.json(
      { error: "Failed to create advert" },
      { status: 500 }
    );
  }
}