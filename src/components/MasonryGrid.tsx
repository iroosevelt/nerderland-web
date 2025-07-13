"use client";

import { useEffect, useState } from "react";
import PinCard from "./PinCard";

// Sample pin data
import pin1 from "@/assets/pin1.gif";
import pin2 from "@/assets/pin2.jpeg";
import pin3 from "@/assets/pin3.jpeg";
import pin4 from "@/assets/pin4.jpeg";
import pin5 from "@/assets/pin5.jpeg";
import pin6 from "@/assets/pin6.jpeg";
import pin7 from "@/assets/pin7.jpg";
import { Button } from "./ui/button";

const samplePins = [
  {
    id: "1",
    image: pin1,
    title: "Mountain Landscape",
    description: "Breathtaking mountain views with lush forest",
    height: 200,
  },
  {
    id: "2",
    image: pin2,
    title: "Modern Living Room",
    description: "Minimalist interior design inspiration",
    height: 200,
  },
  {
    id: "3",
    image: pin3,
    title: "Healthy Salad Bowl",
    description: "Colorful and nutritious meal ideas",
    height: 200,
  },
  {
    id: "4",
    image: pin4,
    title: "Fashion Portrait",
    description: "Stylish outfit inspiration",
    height: 200,
  },
  {
    id: "5",
    image: pin5,
    title: "Ocean Sunset",
    description: "Beautiful travel destination",
    height: 200,
  },
  {
    id: "6",
    image: pin6,
    title: "DIY Crafts",
    description: "Creative handmade project ideas",
    height: 200,
  },
  {
    id: "7",
    image: pin7,
    title: "DIY Crafts",
    description: "Creative handmade project ideas",
    height: 200,
  },
];

// Create more pins by duplicating with variations
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

const MasonryGrid = () => {
  const [columns, setColumns] = useState(2);
  const allPins = [...samplePins, ...createMorePins(samplePins, 3)];

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 1200) setColumns(5);
      else if (width >= 900) setColumns(4);
      else if (width >= 600) setColumns(3);
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
    <div className="container mx-auto px-4 py-6">
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
      <Button
        variant="ghost"
        className="font-mono rounded-none text-[#FDFC26] hover:text-[#FDFC26] cursor-pointer"
      >
        See More...
      </Button>
    </div>
  );
};

export default MasonryGrid;
