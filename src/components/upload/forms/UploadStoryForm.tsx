"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { BoardMultiSelect } from "@/components/forms/BoardMultiSelect";

// Dynamically import the editor to prevent SSR issues
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  {
    ssr: false,
    loading: () => <p className="opacity-50 text-sm">Loading editor...</p>,
  }
);

export function UploadStoryForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // TODO: Submit the title, body, and media to your API or server
    console.log({ title, body, media });
  };

  const [selectedBoards, setSelectedBoards] = useState<
    { id: number; name: string }[]
  >([]);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div>
        <input
          className="w-full font-display bg-black border-none px-4 py-2 rounded-none text-lg"
          placeholder="Title here..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div>
        <RichTextEditor content={body} onChange={setBody} />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-1">
          Thumbnail Image or Video
        </label>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMedia(e.target.files?.[0] || null)}
          className="w-fit bg-black border border-white/10 px-4 py-2 rounded-none text-sm"
        />
      </div>

      <div className="flex flex-row-reverse justify-between items-center">
        <div>
          <BoardMultiSelect
            selected={selectedBoards}
            setSelected={setSelectedBoards}
          />
        </div>
        <button
          type="submit"
          className="bg-[var(--color-yellow)] text-black px-4 py-2 text-md font-bold hover:bg-[#e620ca]"
        >
          Beam it!
        </button>
      </div>
    </form>
  );
}
