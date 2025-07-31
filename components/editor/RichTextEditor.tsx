// components/editor/RichTextEditor.tsx
"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import CodeBlock from "@tiptap/extension-code-block";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import imageCompression from "browser-image-compression";
import { toast } from "sonner";

import {
  FaBold,
  FaItalic,
  FaCode,
  FaLink,
  FaParagraph,
  FaImage,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
} from "react-icons/fa";
import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Forward ref to expose clearContent method
const RichTextEditor = forwardRef<{clearContent: () => void; commands?: unknown; editor?: unknown}, RichTextEditorProps>(
  (
    {
      content,
      onChange,
      disabled = false,
      placeholder = "Go on now, tell your story...",
    },
    ref
  ) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // Disable extensions we want to customize
          link: false,
          codeBlock: false,
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-400 underline hover:text-blue-300",
          },
        }),
        CodeBlock.configure({
          HTMLAttributes: {
            class: "bg-gray-800 p-4 rounded text-green-400 font-mono text-sm",
          },
        }),
        Image.configure({
          HTMLAttributes: {
            class: "max-w-full h-auto rounded-lg my-4",
          },
        }),
        Placeholder.configure({
          placeholder,
        }),
      ],
      content,
      editable: !disabled,
      editorProps: {
        attributes: {
          class: `prose prose-invert max-w-none focus:outline-none text-sm min-h-[200px] text-white p-4 ${
            disabled ? "opacity-50" : ""
          }`,
        },
      },
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      },
      immediatelyRender: false,
    });

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      clearContent: () => {
        if (editor) {
          editor.commands.clearContent();
          onChange("");
        }
      },
      commands: editor?.commands,
      editor: editor,
    }));

    useEffect(() => {
      if (editor) {
        editor.setEditable(!disabled);
        if (!disabled) {
          editor.commands.focus("end");
        }
      }
    }, [editor, disabled]);

    // Update content when prop changes
    useEffect(() => {
      if (editor && content !== editor.getHTML()) {
        editor.commands.setContent(content);
      }
    }, [editor, content]);

    if (!editor) return null;

    const setLink = () => {
      if (disabled) return;

      const previousUrl = editor.getAttributes("link").href;
      const url = window.prompt("Enter URL:", previousUrl);

      // Empty string removes the link
      if (url === null) return;

      if (url === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }

      // Validate URL
      try {
        new URL(url);
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      } catch {
        toast.error("Please enter a valid URL");
      }
    };

    const handleImageUpload = async (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      if (disabled || isUploading) return;

      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (10MB max for editor)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image must be smaller than 10MB");
        return;
      }

      try {
        setIsUploading(true);
        toast.loading("Uploading image...");

        let processedFile = file;

        // Compress if needed
        if (file.size > 2 * 1024 * 1024) {
          try {
            processedFile = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1200,
              useWebWorker: true,
            });
          } catch (compressionError) {
            console.warn(
              "Compression failed, using original:",
              compressionError
            );
          }
        }

        // Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(processedFile);

        // Insert image into editor
        editor.chain().focus().setImage({ src: imageUrl }).run();

        toast.dismiss();
        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.dismiss();
        toast.error("Failed to upload image");
      } finally {
        setIsUploading(false);
        // Reset file input
        e.target.value = "";
      }
    };

    const buttonClass = (isActive: boolean) =>
      `p-2 rounded hover:bg-white/10 transition-colors ${
        isActive
          ? "text-yellow-400 bg-white/10"
          : "opacity-60 hover:opacity-100"
      } ${disabled ? "cursor-not-allowed opacity-30" : ""}`;

    return (
      <div className="border border-white/20 rounded-lg overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-3 bg-white/5 border-b border-white/10 flex-wrap">
          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleBold().run()
            }
            className={buttonClass(editor.isActive("bold"))}
            disabled={disabled || isUploading}
            title="Bold"
          >
            <FaBold />
          </button>

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleItalic().run()
            }
            className={buttonClass(editor.isActive("italic"))}
            disabled={disabled || isUploading}
            title="Italic"
          >
            <FaItalic />
          </button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleBulletList().run()
            }
            className={buttonClass(editor.isActive("bulletList"))}
            disabled={disabled || isUploading}
            title="Bullet List"
          >
            <FaListUl />
          </button>

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleOrderedList().run()
            }
            className={buttonClass(editor.isActive("orderedList"))}
            disabled={disabled || isUploading}
            title="Numbered List"
          >
            <FaListOl />
          </button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleBlockquote().run()
            }
            className={buttonClass(editor.isActive("blockquote"))}
            disabled={disabled || isUploading}
            title="Quote"
          >
            <FaQuoteLeft />
          </button>

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().toggleCodeBlock().run()
            }
            className={buttonClass(editor.isActive("codeBlock"))}
            disabled={disabled || isUploading}
            title="Code Block"
          >
            <FaCode />
          </button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            type="button"
            onClick={setLink}
            className={buttonClass(editor.isActive("link"))}
            disabled={disabled || isUploading}
            title="Add Link"
          >
            <FaLink />
          </button>

          <button
            type="button"
            onClick={() =>
              !disabled && !isUploading && fileInputRef.current?.click()
            }
            className={`${buttonClass(false)} ${
              isUploading ? "animate-pulse" : ""
            }`}
            disabled={disabled || isUploading}
            title={isUploading ? "Uploading..." : "Insert Image"}
          >
            <FaImage />
          </button>

          <div className="w-px h-6 bg-white/20 mx-2" />

          <button
            type="button"
            onClick={() =>
              !disabled && editor.chain().focus().setParagraph().run()
            }
            className={buttonClass(false)}
            disabled={disabled || isUploading}
            title="Paragraph"
          >
            <FaParagraph />
          </button>

          {/* Hidden File Input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {/* Editor */}
        <div className="min-h-[200px]">
          <EditorContent editor={editor} />
        </div>

        {/* Character count */}
        <div className="px-4 py-2 bg-white/5 border-t border-white/10 text-xs opacity-50">
          {editor.storage.characterCount?.characters() || 0} characters
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
