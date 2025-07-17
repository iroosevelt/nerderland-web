"use client";

import { BoardMultiSelect } from "@/components/forms/BoardMultiSelect";
import { useState } from "react";

export function UploadFolderForm() {
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [lockCode, setLockCode] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/zip") {
      setZipFile(file);
    } else {
      alert("Only .zip files are supported for now.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Handle upload logic via backend route / API call
    console.log({ zipFile, lockCode, securityQuestion, securityAnswer });
  };

  const [selectedBoards, setSelectedBoards] = useState<
    { id: number; name: string }[]
  >([]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm opacity-70">
        Drops will auto-expire after <strong>24 hours</strong>.
      </p>

      <div>
        <label className="text-xs">Upload Folder (.zip)</label>
        <input
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          className="block mt-1 w-fit bg-black/50 border border-white/10 p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs">Lock Code (optional)</label>
        <input
          type="text"
          value={lockCode}
          placeholder="******"
          onChange={(e) => setLockCode(e.target.value)}
          className="block mt-1 w-full bg-black/50 border border-white/10 p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs">Security Question (optional)</label>
        <input
          type="text"
          value={securityQuestion}
          placeholder="What is the name of my first OSINT tool?"
          onChange={(e) => setSecurityQuestion(e.target.value)}
          className="block mt-1 w-full bg-black/50 border border-white/10 p-2 text-sm"
        />
      </div>

      <div>
        <label className="text-xs">Security Answer</label>
        <input
          type="text"
          value={securityAnswer}
          onChange={(e) => setSecurityAnswer(e.target.value)}
          className="block mt-1 w-full bg-black/50 border border-white/10 p-2 text-sm"
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
