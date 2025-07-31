// app/[username]/boards/[identifier]/page.tsx

import { BoardView } from "@/components/board/BoardView";
import { notFound } from "next/navigation";

interface BoardPageProps {
  params: Promise<{
    username: string;
    identifier: string;
  }>;
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { username, identifier } = await params;

  // Validate parameters
  if (!username || !identifier) {
    notFound();
  }

  // Validate username format
  const validUsername = /^[a-zA-Z0-9_]{2,20}$/.test(username);
  if (!validUsername) {
    notFound();
  }

  // Validate identifier is a number (board ID)
  const boardId = parseInt(identifier);
  if (isNaN(boardId) || boardId <= 0) {
    notFound();
  }

  return (
    <div className="w-full bg-black border border-white/10 transition rounded-none">
      <main className="container max-w-5xl mx-auto">
        <BoardView username={username} boardId={boardId} />
      </main>
    </div>
  );
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BoardPageProps) {
  try {
    const { username, identifier } = await params;

    // Validate parameters before making API call
    if (!username || !identifier) {
      return {
        title: "Board Not Found",
        description: "The requested board could not be found.",
      };
    }

    const boardId = parseInt(identifier);
    if (isNaN(boardId)) {
      return {
        title: "Invalid Board",
        description: "The board identifier is invalid.",
      };
    }

    // Fetch board data for metadata
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/users/${username}/boards/${boardId}`,
      {
        cache: "force-cache",
        next: { revalidate: 300 }, // Revalidate every 5 minutes
      }
    );

    if (!response.ok) {
      return {
        title: "Board Not Found",
        description: "The requested board could not be found.",
      };
    }

    const data = await response.json();
    const board = data.board;

    return {
      title: `${board.name} - ${board.user.username}'s Board`,
      description:
        board.description ||
        `Explore ${board.name} board by ${board.user.username}`,
      openGraph: {
        title: board.name,
        description: board.description || `A board by ${board.user.username}`,
        type: "website",
        images: board.user.avatar_url
          ? [
              {
                url: board.user.avatar_url,
                width: 400,
                height: 400,
                alt: `${board.user.username}'s avatar`,
              },
            ]
          : [],
      },
      twitter: {
        card: "summary",
        title: board.name,
        description: board.description || `A board by ${board.user.username}`,
        images: board.user.avatar_url ? [board.user.avatar_url] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Board",
      description: "Explore this board",
    };
  }
}
