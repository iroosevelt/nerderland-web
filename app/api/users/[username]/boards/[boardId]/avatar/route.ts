// app/api/users/[username]/boards/[boardId]/avatar/route.ts

import { NextResponse } from "next/server";
import { db } from "@db";
import { boards, users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { RateLimiter, getSecurityHeaders } from "@/lib/auth/session";
import { headers } from "next/headers";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import imageCompression from "browser-image-compression";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ username: string; boardId: string }> }
) {
  try {
    const headersList = await headers();
    const clientIP = headersList.get("x-client-ip") || "unknown";
    const userWallet = headersList.get("x-user-wallet");
    const sessionId = headersList.get("x-session-id");

    // Rate limiting for image uploads
    if (!RateLimiter.check(`board-avatar:${clientIP}`, 5, 60000)) {
      return NextResponse.json(
        { error: "Too many upload requests. Please wait a minute." },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            ...getSecurityHeaders(),
          },
        }
      );
    }

    const { username, boardId } = await params;

    // Input validation
    if (!username || !boardId) {
      return NextResponse.json(
        { error: "Username and board ID are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Sanitize username
    const sanitizedUsername = username
      .replace(/[^a-zA-Z0-9_]/g, "")
      .slice(0, 20);
    if (sanitizedUsername !== username || sanitizedUsername.length < 2) {
      return NextResponse.json(
        { error: "Invalid username format" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate board ID
    const boardIdNum = parseInt(boardId);
    if (isNaN(boardIdNum)) {
      return NextResponse.json(
        { error: "Invalid board ID" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Parse form data
    let formData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    const file = formData.get("image") as File;
    if (!file) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be smaller than 5MB" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    try {
      // First, verify the board exists and belongs to the user
      const boardData = await db
        .select({
          id: boards.id,
          user_id: boards.user_id,
          user_wallet_address: users.wallet_address,
        })
        .from(boards)
        .leftJoin(users, eq(boards.user_id, users.id))
        .where(
          and(eq(boards.id, boardIdNum), eq(users.username, sanitizedUsername))
        )
        .limit(1);

      if (boardData.length === 0) {
        return NextResponse.json(
          { error: "Board not found" },
          { status: 404, headers: getSecurityHeaders() }
        );
      }

      const board = boardData[0];

      // Check if requester is the board owner
      const isOwner = Boolean(
        sessionId && userWallet && userWallet === board.user_wallet_address
      );

      if (!isOwner) {
        return NextResponse.json(
          { error: "Only the board owner can update the board avatar" },
          { status: 403, headers: getSecurityHeaders() }
        );
      }

      // Process and upload the image
      let processedFile = file;

      // Compress image if needed
      if (file.size > 1024 * 1024) {
        // Only compress if larger than 1MB
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 400,
            useWebWorker: false, // Set to false for server-side
            fileType: file.type.includes("png") ? "image/png" : "image/jpeg",
          });
        } catch (compressionError) {
          console.warn("Image compression failed, using original:", compressionError);
          processedFile = file;
        }
      }

      // Upload to Cloudinary
      const avatarUrl = await uploadToCloudinary(processedFile);

      // Update the board with new avatar URL
      await db
        .update(boards)
        .set({
          avatar_url: avatarUrl,
          updated_at: new Date(),
        })
        .where(eq(boards.id, boardIdNum));

      const response = NextResponse.json(
        {
          success: true,
          message: "Board avatar updated successfully",
          avatar_url: avatarUrl,
        },
        { status: 200, headers: getSecurityHeaders() }
      );

      return response;
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      
      // Provide user-friendly error messages
      if (uploadError instanceof Error) {
        if (uploadError.message.includes("timeout")) {
          return NextResponse.json(
            { error: "Upload timeout. Please try with a smaller image." },
            { status: 408, headers: getSecurityHeaders() }
          );
        }
        if (uploadError.message.includes("network")) {
          return NextResponse.json(
            { error: "Network error. Please check your connection and try again." },
            { status: 503, headers: getSecurityHeaders() }
          );
        }
      }
      
      return NextResponse.json(
        { error: "Failed to upload image. Please try again." },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  } catch (error) {
    console.error(
      "Unexpected error in POST /api/users/[username]/boards/[boardId]/avatar:",
      error
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Block other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST", ...getSecurityHeaders() } }
  );
}