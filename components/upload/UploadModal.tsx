"use client";

import { useState } from "react";
import { UploadAdvertForm } from "./forms/UploadAdvertForm";
import { UploadStoryForm } from "./forms/UploadStoryForm";

import AdIcon from "../icons/AdIcon";
import NerdrumIcon from "../icons/NerdrumIcon";
import StoryIcon from "../icons/StoryIcon";
import { CreateBoardForm } from "./forms/CreateBoardForm";

const uploadTypes = [
  {
    name: "Story",
    Icon: StoryIcon,
    description: "Such a wonderful, rich story.",
  },
  {
    name: "Nerdrum",
    Icon: NerdrumIcon,
    description: "Board of interplanetary discourse.",
  },
  {
    name: "Advert",
    Icon: AdIcon,
    description: "Promotional content or announcements.",
  },
];

export function UploadModal() {
  const [selected, setSelected] = useState("Story");

  const renderForm = () => {
    switch (selected) {
      case "Story":
        return <UploadStoryForm />;
      case "Nerdrum":
        return <CreateBoardForm />;
      case "Advert":
        return <UploadAdvertForm />;
      default:
        return null;
    }
  };

  return (
    <div className="relative max-w-5xl w-full h-full flex flex-col bg-black/90 text-white md:col-span-2">
      {/* Header */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3">
        <h2 className="text-lg sm:text-xl font-display">Nerdy Stuff!</h2>
      </div>

      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
        {renderForm()}
      </div>

      {/* Fixed bottom Bar */}
      <div className="sticky bottom-0 left-0 w-full bg-black px-4 sm:px-6 pt-4 pb-4 sm:pb-6 border-t border-white/10">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-x-auto">
          {uploadTypes.map((type) => (
            <button
              key={type.name}
              onClick={() => setSelected(type.name)}
              className={`min-w-0 sm:min-w-[140px] text-left border rounded-none px-3 sm:px-4 py-2 sm:py-3 flex flex-row sm:flex-col transition ${
                selected === type.name
                  ? "border-[var(--color-yellow)]"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center sm:flex-col sm:items-start w-full">
                <div className="flex items-center">
                  <type.Icon className="mr-3 flex-shrink-0" />
                  <p className="font-display text-sm">{type.name}</p>
                </div>
                {/* <div className="flex-1">
                  <p className="text-xs opacity-60 mt-1 hidden sm:block">
                    {type.description}
                  </p>
                </div> */}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
