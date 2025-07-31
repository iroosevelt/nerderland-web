// components/cards/StoryCard.tsx

import Image from "next/image";
import Link from "next/link";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useState } from "react";

interface StoryCardProps {
  id: number;
  title: string;
  image: string;
  description: string;
  slug?: string | null;
  user: {
    id: number;
    username: string;
    avatar_url: string;
  } | null;
  href?: string; // Optional custom href
  className?: string; // Allow custom styling
}

export default function StoryCard({
  id,
  title,
  image,
  description,
  slug,
  user,
  href,
  className = "",
}: StoryCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const storyUrl =
    href || `/${user?.username || "unknown"}/stories/${slug || id}`;

  // Generate random aspect ratio
  // Smaller ratios for compact sidebar display
  const aspectRatios = [
    "aspect-[4/3]",
    "aspect-[5/4]",
    "aspect-[1/1]",
    "aspect-[6/5]",
  ];
  const randomAspect = aspectRatios[id % aspectRatios.length];

  return (
    <Link href={storyUrl} className={`block group mb-4 ${className}`}>
      <article className="bg-white/5 backdrop-blur-sm rounded-none overflow-hidden hover:bg-white/8 hover:shadow-lg hover:shadow-black/20 transition-all duration-300 cursor-pointer border border-white/5 hover:border-white/10">
        {/* Story Image */}
        <div
          className={`relative w-full ${randomAspect} overflow-hidden bg-white/5`}
        >
          {!imageError && (
            <Image
              src={image}
              alt={`Cover image for ${title}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover group-hover:scale-110 transition-all duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              priority={false}
              unoptimized={
                image.toLowerCase().includes(".gif") ||
                image.toLowerCase().includes("image/gif")
              }
            />
          )}

          {/* Loading/Error State */}
          {(!imageLoaded || imageError) && (
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
              {imageError ? (
                <div className="text-gray-400 text-xs text-center p-2">
                  📖 Story
                </div>
              ) : (
                <div className="animate-pulse bg-white/5 w-full h-full" />
              )}
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        <div className="p-2 space-y-1">
          <header>
            <h3 className="text-xs font-medium text-white line-clamp-2 group-hover:text-[var(--color-yellow)] transition-colors duration-200 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 leading-relaxed opacity-80">
                {description}
              </p>
            )}
          </header>

          {user && (
            <footer className="flex items-center gap-1.5 pt-0.5">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/${user.username}`;
                }}
              >
                <Avatar className="w-3 h-3 border border-white/10 flex-shrink-0 hover:border-white/20 transition-colors cursor-pointer">
                  <AvatarImage
                    src={user.avatar_url}
                    alt={`${user.username}'s avatar`}
                    className="object-cover"
                  />
                </Avatar>
              </div>
              <span
                className="text-xs text-gray-400 truncate opacity-75 hover:text-white transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/${user.username}`;
                }}
              >
                {user.username}
              </span>
            </footer>
          )}
        </div>
      </article>
    </Link>
  );
}
