"use client";

import { ChevronDown } from "lucide-react";
import Image from "next/image";
import PinCard from "../PinCard";
import { Avatar, AvatarImage } from "../ui/avatar";

// Sample pin data
import pin1 from "@/assets/pin1.gif";
import pin2 from "@/assets/pin2.jpeg";
import pin3 from "@/assets/pin3.jpeg";
import pin4 from "@/assets/pin4.jpeg";
import pin5 from "@/assets/pin5.jpeg";
import pin6 from "@/assets/pin6.jpeg";
import pin7 from "@/assets/pin7.jpg";
import { useEffect, useState } from "react";

const samplePins = [
  {
    id: "1",
    image: pin1,
    title: "Mountain Landscape",
    description: "Breathtaking mountain views with lush forest",
    height: 150,
  },
  {
    id: "2",
    image: pin2,
    title: "Modern Living Room",
    description: "Minimalist interior design inspiration",
    height: 150,
  },
  {
    id: "3",
    image: pin3,
    title: "Healthy Salad Bowl",
    description: "Colorful and nutritious meal ideas",
    height: 150,
  },
  {
    id: "4",
    image: pin4,
    title: "Fashion Portrait",
    description: "Stylish outfit inspiration",
    height: 150,
  },
  {
    id: "5",
    image: pin5,
    title: "Ocean Sunset",
    description: "Beautiful travel destination",
    height: 150,
  },
  {
    id: "6",
    image: pin6,
    title: "DIY Crafts",
    description: "Creative handmade project ideas",
    height: 150,
  },
  {
    id: "7",
    image: pin7,
    title: "DIY Crafts",
    description: "Creative handmade project ideas",
    height: 150,
  },
];

const createMorePins = (basePins: typeof samplePins, count: number) => {
  const morePins = [];
  for (let i = 0; i < count; i++) {
    const basePin = basePins[i % basePins.length];
    morePins.push({
      ...basePin,
      id: `${basePin.id}-${i}`,
      height: Math.floor(Math.random() * 150) + 150, // Random height between 200-350px
    });
  }
  return morePins;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function PostModal({ slug }: { slug: string }) {
  const [columns, setColumns] = useState(1);
  const allPins = [...samplePins, ...createMorePins(samplePins, 3)];

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) setColumns(2);
      else if (width >= 900) setColumns(2);
      else if (width >= 600) setColumns(2);
      else setColumns(2);
    };

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  // Distribute pins across columns
  const columnArrays = Array.from(
    { length: columns },
    () => [] as typeof allPins
  );

  allPins.forEach((pin, index) => {
    const columnIndex = index % columns;
    columnArrays[columnIndex].push(pin);
  });

  return (
    <div className="flex w-full h-full overflow-hidden col-span-2">
      {/* LEFT: Post and comments */}
      <div className="flex-1 bg-black/70 p-6 overflow-y-auto">
        {/* Topbar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Avatar className="w-12 h-12 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/founder.png"
              />
            </Avatar>
            <div>
              <p className="text-sm font-bold">Nerd-c930</p>
              <p className="text-xs opacity-50">3h ago</p>
            </div>
          </div>
          <button className="text-xs">⋮</button>
        </div>

        {/* Post content */}
        <div className="space-y-3 mb-6">
          <Image
            src="/img/bg.webp"
            alt="Image"
            width={400}
            height={200}
            className="w-full rounded-lg"
          />
          <p className="text-white text-sm">
            If I see you doing anything above average during the chase up until
            the crane I won't expect you to drop because that's what good
            players do. It's all about the odds. Good players won't drop from
            the tanker either unless you move towards them. Balanced landing
            players will drop from bloody anywhere :7385:
          </p>
        </div>

        <div className="flex items-center justify-between mb-6">
          <p className="text-xs opacity-50">126 Comments</p>
          {/* Actions */}
          <div className="flex items-center gap-4 ">
            <button className="flex items-center text-xs bg-[var(--color-blue)] text-[var(--color-yellow)] px-2 py-1">
              <Image
                aria-label="hidden"
                src="/img/coin.gif"
                alt="Coin"
                width={28}
                height={28}
              />
              Good Stuff (12)
            </button>
            <button className="text-xs">💾 Save</button>
          </div>
        </div>

        {/* Comment box */}
        <div className="mb-6">
          <textarea
            className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm min-h-[60px]"
            placeholder="Comment..."
            // value=
            // onChange={(e) => setDescription(e.target.value)}
          />
          <button className="flex items-center text-xs bg-[var(--color-yellow)] text-black px-2 py-1">
            Beam it!
          </button>
        </div>

        {/* Comments */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/prophet.png"
              />
            </Avatar>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold">nerd-123</span>
                <span className="opacity-50">2h ago</span>
              </div>
              <p className="text-xs opacity-80 py-1">Nice post!</p>
            </div>
          </div>
          <hr />
          <div className="flex gap-2">
            <Avatar className="w-8 h-8 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/nu-goth.png"
              />
            </Avatar>
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold">nerd-xr8</span>
                <span className="opacity-50">2h ago</span>
              </div>
              <p className="text-xs opacity-80 py-1">
                I fully expect you to drop if this is the first time meeting you
                in the alien council trial.
              </p>
              <button className="flex items-center text-xs opacity-50 mt-1">
                <ChevronDown className="w-4 h-4 mr-1" /> View replies
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Author info */}
      <div className="w-[320px] bg-black/50 p-4 border-l border-white/10 flex-shrink-0 overflow-y-auto">
        <div className="flex flex-col items-start w-full mb-6">
          <div className="flex flex-col gap-2 mb-3">
            <Avatar className="w-12 h-12 border border-white/20">
              <AvatarImage
                className="object-cover"
                src="/img/avatar/founder.png"
              />
            </Avatar>
            <p className="font-bold">Nerd-c930</p>
            <p className="text-xs opacity-50">1.2K Subscribers</p>
          </div>
          <button className="bg-[var(--color-yellow)] text-black text-xs border px-2 py-1">
            Subscribe
          </button>
        </div>

        <div>
          <h4 className="text-xs mb-2">More Stories</h4>
          <div className="flex gap-4 justify-center">
            {columnArrays.map((columnPins, columnIndex) => (
              <div key={columnIndex} className="flex-1 max-w-xs">
                {columnPins.map((pin) => (
                  <PinCard
                    key={pin.id}
                    id={pin.id}
                    image={pin.image}
                    title={pin.title}
                    description={pin.description}
                    height={pin.height}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
