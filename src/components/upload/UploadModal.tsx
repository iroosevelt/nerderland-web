"use client";

import { useState } from "react";
import { UploadFolderForm } from "./forms/UploadFolderForm";
import { UploadAdvertForm } from "./forms/UploadAdvertForm";
import { UploadNerdrumForm } from "./forms/UploadNerdrumForm";
import { UploadStoryForm } from "./forms/UploadStoryForm";

import AdIcon from "../icons/AdIcon";
import FolderIcon from "../icons/FolderIcon";
import NerdrumIcon from "../icons/NerdrumIcon";
import StoryIcon from "../icons/StoryIcon";

const uploadTypes = [
  {
    name: "Story",
    Icon: StoryIcon,
    description: "Such a wonderful, rich story.",
  },
  {
    name: "Drops",
    Icon: FolderIcon,
    description: "Upload code, music, tools, + more.",
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
      case "Drops":
        return <UploadFolderForm />;
      case "Nerdrum":
        return <UploadNerdrumForm />;
      case "Advert":
        return <UploadAdvertForm />;
      default:
        return null;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black/90 text-white col-span-2">
      {/* Header */}
      <div className="px-6 pt-6 pb-3">
        <h2 className="text-xl font-display">Nerdy Stuff!</h2>
      </div>

      {/* Scrollable Form Area */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">{renderForm()}</div>

      {/* Fixed Tab Bar */}
      <div className="sticky bottom-0 left-0 w-full bg-black px-6 pt-4 pb-6 border-t border-white/10">
        <div className="flex justify-between gap-4 overflow-x-auto">
          {uploadTypes.map((type) => (
            <button
              key={type.name}
              onClick={() => setSelected(type.name)}
              className={`min-w-[140px] text-left border rounded-md px-4 py-3 flex flex-col transition ${
                selected === type.name
                  ? "border-[var(--color-yellow)]"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center">
                <type.Icon className="mr-3 text-[#FF31E2]" />
                <p className="font-display text-sm">{type.name}</p>
              </div>
              <p className="text-xs opacity-60 mt-1">{type.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
