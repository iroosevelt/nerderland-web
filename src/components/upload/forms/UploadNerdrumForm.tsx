"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export function UploadNerdrumForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rules, setRules] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (
      file &&
      ["image/gif", "image/png", "image/jpeg", "image/jpg"].includes(file.type)
    ) {
      setAvatar(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      alert("Only GIF, PNG, or JPG files are supported.");
    }
  };

  return (
    <form className="space-y-4">
      <p className="text-sm opacity-70">
        <strong>Create a Board</strong>.
      </p>
      {/* Avatar Upload */}
      <div>
        <label className="block text-xs mb-1 font-medium">
          Upload Avatar (gif, png, jpg)
        </label>
        <div className="flex items-center space-x-4 self-start">
          {previewUrl && (
            <div className="mt-2">
              <Avatar className="w-12 h-12 border border-white/20">
                <AvatarImage className="object-cover" src={previewUrl} />
              </Avatar>
            </div>
          )}
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.gif"
            onChange={handleFileChange}
            className="text-sm bg-black border border-white/10 px-4 py-2 rounded-none"
          />
        </div>
      </div>

      {/* Nerdrum Name */}
      <input
        className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm"
        placeholder="Board Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      {/* Description */}
      <textarea
        className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm min-h-[100px]"
        placeholder="What is this Board about?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* Rules */}
      <textarea
        className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm min-h-[100px]"
        placeholder="Set board rules"
        value={rules}
        onChange={(e) => setRules(e.target.value)}
      />

      {/* Submit Button */}
      <button
        type="submit"
        className="bg-[var(--color-yellow)] text-black px-4 py-2 mt-4 text-md font-bold hover:bg-[#e620ca]"
      >
        Beam it!
      </button>
    </form>
  );
}
