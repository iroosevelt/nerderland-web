import { Heart, ExternalLink, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";

interface PinCardProps {
  id: string;
  image: string | StaticImageData;
  title: string;
  description?: string;
  height: number;
}

export default function PinCard({
  image,
  title,
  description,
  height,
}: PinCardProps) {
  const router = useRouter();
  return (
    <div
      className="group relative bg-card rounded-0 overflow-hidden shadow-pin hover:shadow-pin-hover transition-all duration-300 mb-4"
      style={{ height: `${height}px` }}
      onClick={() => router.push("/post/test")}
    >
      {/* Image */}
      <Image
        src={image}
        alt={title}
        width={200}
        height={200}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Overlay that appears on hover */}
      <div className="absolute inset-0 bg-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content overlay */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {/* Top actions */}
        <div className="flex justify-end">
          <Button
            size="sm"
            className="bg-primary hover:bg-primary-hover text-primary-foreground rounded-full px-4"
          >
            Save
          </Button>
        </div>

        {/* Bottom content */}
        <div className="space-y-2">
          {/* Action buttons */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20 rounded-full"
            >
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          {/* Title and description */}
          <div className="text-white">
            <h3 className="font-semibold text-sm mb-1">{title}</h3>
            {description && (
              <p className="text-xs opacity-80 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
