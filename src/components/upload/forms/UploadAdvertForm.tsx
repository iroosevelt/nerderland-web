"use client";

import { useState } from "react";

export function UploadAdvertForm() {
  const [headline, setHeadline] = useState("");
  const [link, setLink] = useState("");
  const [image, setImage] = useState<File | null>(null);

  return (
    <form className="space-y-4">
      <div>
        <label className="block text-xs mb-1">Advert Headline</label>
        <input
          className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm"
          placeholder="Catchy headline"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs mb-1">Target Link</label>
        <input
          className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm"
          placeholder="https://..."
          value={link}
          onChange={(e) => setLink(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs mb-1">Upload Banner</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          className="w-fit bg-black border border-white/10 px-4 py-2 rounded-none text-sm"
        />
      </div>

      <button
        type="submit"
        className="bg-[var(--color-yellow)] text-black px-4 py-2 mt-4 text-md font-bold hover:bg-[#e620ca]"
      >
        Beam it!
      </button>
    </form>
  );
}
