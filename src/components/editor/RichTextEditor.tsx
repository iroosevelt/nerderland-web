"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

import {
  FaBold,
  FaItalic,
  FaCode,
  FaLink,
  FaParagraph,
  FaImage,
} from "react-icons/fa";
import { useRef, useEffect } from "react";

export default function RichTextEditor({
  content,
  onChange,
}: {
  content: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CodeBlock,
      Image,
      Placeholder.configure({
        placeholder: "Go on now, tell your story...",
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert focus:outline-none text-sm min-h-[200px] text-white",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) editor.commands.focus("end");
  }, [editor]);

  if (!editor) return null;

  const setLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);

    editor.chain().focus().setImage({ src: url }).run();

    // Reset file input so you can upload the same file again if needed
    e.target.value = "";
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex space-x-3 text-sm items-center">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "text-yellow-400" : "opacity-60"}
        >
          <FaBold />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={
            editor.isActive("italic") ? "text-yellow-400" : "opacity-60"
          }
        >
          <FaItalic />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={
            editor.isActive("codeBlock") ? "text-yellow-400" : "opacity-60"
          }
        >
          <FaCode />
        </button>
        <button onClick={setLink} className="opacity-60 hover:text-yellow-400">
          <FaLink />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="opacity-60 hover:text-yellow-400"
        >
          <FaImage />
        </button>

        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className="opacity-60 hover:text-yellow-400"
        >
          <FaParagraph />
        </button>

        {/* Hidden File Input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          style={{ display: "none" }}
        />
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
