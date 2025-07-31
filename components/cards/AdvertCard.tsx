// components/cards/AdvertCard.tsx

import Image from "next/image";
import { Avatar, AvatarImage } from "../ui/avatar";
import { useState } from "react";
import AdIcon from "../icons/AdIcon";

interface AdvertCardProps {
  id: number;
  title: string;
  content: string;
  image_url?: string | null;
  link_url?: string | null;
  user: {
    id: number;
    username: string | null;
    avatar_url: string | null;
  } | null;
  formatted_created_at: string;
  className?: string;
}

export default function AdvertCard({
  id,
  title,
  content,
  image_url,
  link_url,
  user,
  formatted_created_at,
  className = "",
}: AdvertCardProps) {
  const [imageError, setImageError] = useState(false);

  const CardContent = () => (
    <div
      className={`group relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-yellow-400/50 rounded-lg overflow-hidden hover:border-yellow-400 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-400/20 ${className}`}
    >
      {/* Ad Label */}
      <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-1 text-xs font-bold rounded z-10 flex items-center gap-1">
        <AdIcon className="w-3 h-3" />
        AD
      </div>

      {/* Image */}
      {image_url && !imageError && (
        <div className="relative w-full h-48 bg-gray-800">
          <Image
            src={image_url}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            onError={() => setImageError(true)}
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-bold text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
          {content}
        </p>

        {/* User Info */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-white/20">
              <AvatarImage
                src={user?.avatar_url || "/img/avatar/little_wea.png"}
                alt={user?.username || "Anonymous"}
                className="object-cover"
              />
            </Avatar>
            <div>
              <p className="text-xs text-gray-400">
                by {user?.username || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500">{formatted_created_at}</p>
            </div>
          </div>

          {/* Call to Action */}
          {link_url && (
            <div className="text-xs bg-yellow-400 text-black px-2 py-1 rounded font-medium hover:bg-yellow-300 transition-colors">
              Learn More →
            </div>
          )}
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );

  // If there's a link, wrap in an anchor tag
  if (link_url) {
    return (
      <a
        href={link_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block cursor-pointer"
        onClick={() => {
          // Track click analytics here if needed
          console.log(`Advert clicked: ${id}`);
        }}
      >
        <CardContent />
      </a>
    );
  }

  // Otherwise, just return the card content
  return <CardContent />;
}