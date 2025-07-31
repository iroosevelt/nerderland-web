// components/board/types.ts

export interface Board {
  id: number;
  name: string;
  description: string | null;
  is_public: boolean | null;
  member_count: number | null;
  created_at: string;
  avatar_url?: string | null;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
}

export interface BoardMember {
  id: number;
  user: {
    id: number;
    username: string | null;
    avatar_url?: string | null;
    level?: number | null;
    nerdy_points?: number | null;
  };
  joined_at: string;
  role: string;
}

export interface Story {
  id: number;
  title: string;
  content: string;
  media_url: string | null;
  slug: string | null;
  views: number;
  created_at: string;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  };
}

export interface BoardResponse {
  board: Board;
  isOwner: boolean;
  isMember: boolean;
  meta: {
    timestamp: string;
    requestedBy: string;
  };
}