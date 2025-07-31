// components/forms/UploadStoryForm.tsx

"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import imageCompression from "browser-image-compression";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { BoardMultiSelect } from "@/components/forms/BoardMultiSelect";
import { useUserProfile } from "@/stores/useUserProfile";
import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

// Lazy-load Tiptap editor
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  {
    ssr: false,
    loading: () => <p className="opacity-50 text-sm">Loading editor...</p>,
  }
);

const StorySchema = z.object({
  title: z
    .string()
    .min(2, "Title must be at least 2 characters")
    .max(200, "Title is too long"),
  body: z
    .string()
    .min(10, "Story content must be at least 10 characters")
    .max(50000, "Story content is too long"),
  thumbnail: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        if (!(file instanceof File)) return false;

        // Check file size (5MB max for thumbnails)
        if (file.size > 5 * 1024 * 1024) return false;

        // Check file type - only images and GIFs
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];

        return validTypes.includes(file.type);
      },
      {
        message:
          "Thumbnail must be under 5MB and be a valid image format (JPEG, PNG, GIF, WebP)",
      }
    ),
});

type StoryInput = z.infer<typeof StorySchema>;

export function UploadStoryForm() {
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [isLoadingStory, setIsLoadingStory] = useState(false);
  const { user } = useUserProfile();
  const { close } = useModalStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const richTextEditorRef = useRef<{clearContent: () => void; commands?: unknown; editor?: unknown}>(null);

  // Check for edit parameter and load story data
  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId) {
      setIsEditing(true);
      setEditingStoryId(editId);
      loadStoryForEdit(editId);
    }
  }, [searchParams]);

  // Check for pre-selected boards on component mount
  useEffect(() => {
    const preSelected = sessionStorage.getItem("preSelectedBoards");
    if (preSelected) {
      try {
        const boards = JSON.parse(preSelected);
        if (Array.isArray(boards)) {
          setSelectedBoards(boards);
        }
      } catch (error) {
        console.error("Error parsing pre-selected boards:", error);
      }
      // Clear after use
      sessionStorage.removeItem("preSelectedBoards");
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StoryInput>({
    resolver: zodResolver(StorySchema),
    defaultValues: {
      title: "",
      body: "",
      thumbnail: undefined,
    },
  });

  // Load story data for editing
  const loadStoryForEdit = async (storyId: string) => {
    try {
      setIsLoadingStory(true);
      const response = await fetch(`/api/stories/${storyId}`);

      if (!response.ok) {
        throw new Error("Failed to load story");
      }

      const story = await response.json();

      // Populate form with existing data
      setValue("title", story.title || "");
      setValue("body", story.content || "");

      // Set thumbnail preview if exists
      if (story.media_url) {
        setThumbnailPreview(story.media_url);
      }

      // Load story boards as string IDs for the form
      if (story.boards && Array.isArray(story.boards)) {
        setSelectedBoards(
          story.boards.map(
            (board: {id?: number} | string) => 
              typeof board === 'object' && board.id 
                ? board.id.toString() 
                : board.toString()
          )
        );
      }

      toast.success("Story loaded for editing");
    } catch (error) {
      console.error("Error loading story for edit:", error);
      toast.error("Failed to load story for editing");
    } finally {
      setIsLoadingStory(false);
    }
  };

  // Helper function to compress and optimize thumbnail
  const processThumbnailFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      let processedFile = file;

      // Skip compression for GIFs
      if (file.type === "image/gif") {
        toast.loading("Processing GIF thumbnail...");
        toast.dismiss();
        toast.success("GIF thumbnail ready");
      } else {
        // Compress other image types
        toast.loading("Processing thumbnail...");

        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 1, // Compress to max 1MB
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: file.type.includes("png") ? "image/png" : "image/jpeg",
          });

          toast.dismiss();
          toast.success("Thumbnail processed successfully");
        } catch (compressionError) {
          console.error("Thumbnail compression failed:", compressionError);
          toast.dismiss();
          toast.error("Failed to process thumbnail, using original");
          processedFile = file;
        }
      }

      // Upload to Cloudinary
      toast.loading("Uploading thumbnail...");
      const thumbnailUrl = await uploadToCloudinary(processedFile);
      toast.dismiss();

      return thumbnailUrl;
    } catch (uploadError) {
      toast.dismiss();
      console.error("Thumbnail upload failed:", uploadError);
      throw new Error("Failed to upload thumbnail");
    } finally {
      setIsUploading(false);
    }
  };

  // Generate URL-friendly slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  // Handle thumbnail file selection
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("thumbnail", file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue("thumbnail", undefined);
      setThumbnailPreview(null);
    }
  };

  // Remove thumbnail
  const removeThumbnail = () => {
    setValue("thumbnail", undefined);
    setThumbnailPreview(null);
    // Reset file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onSubmit = async (values: StoryInput) => {
    // Check if user is authenticated
    if (!user?.wallet_address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setUploadProgress(30);
      let thumbnailUrl: string | null = null;

      // Handle thumbnail upload
      if (values.thumbnail) {
        thumbnailUrl = await processThumbnailFile(values.thumbnail);
      }

      // Generate slug for the story
      const slug = generateSlug(values.title);

      // Submit story (create or update)
      const isUpdate = isEditing && editingStoryId;
      const apiUrl = isUpdate
        ? `/api/stories/${editingStoryId}`
        : "/api/stories";
      const method = isUpdate ? "PUT" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          body: values.body,
          thumbnailUrl: thumbnailUrl || "",
          boards: selectedBoards,
          walletAddress: user.wallet_address,
          slug: slug,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadProgress(100);

      // Success handling - Navigate to story URL structure
      const storyUrl = `/${user.username}/stories/${
        data.story.slug || data.story.id
      }`;

      // Close the modal immediately
      close();

      // Show success toast with board information
      let description = "Redirecting to your story...";
      if (selectedBoards.length > 0) {
        description = `Added to ${selectedBoards.length} board${
          selectedBoards.length > 1 ? "s" : ""
        }. Redirecting to your story...`;
      }

      const successMessage = isUpdate
        ? "Story updated successfully! 🎉"
        : "Story published successfully! 🎉";

      toast.success(successMessage, {
        description,
        duration: 3000,
      });

      // Reset form completely
      reset();
      setSelectedBoards([]);
      setUploadProgress(0);
      setThumbnailPreview(null);

      // Reset rich text editor
      if (richTextEditorRef.current) {
        if (richTextEditorRef.current.clearContent) {
          richTextEditorRef.current.clearContent();
        }
      }
      setValue("body", "");

      // Navigate to the story page
      router.push(storyUrl);
    } catch (error) {
      console.error("Story submission error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      let userMessage = "Failed to publish story";
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        userMessage =
          "Network error - please check your connection and try again";
      } else if (
        errorMessage.includes("validation") ||
        errorMessage.includes("Validation")
      ) {
        userMessage = "Please check your input and try again";
      } else if (errorMessage.includes("auth")) {
        userMessage = "Authentication failed - please reconnect your wallet";
      }

      toast.error(userMessage, {
        description:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
        action: {
          label: "Try Again",
          onClick: () => {
            // Could implement retry logic
          },
        },
      });
    }
  };

  const isFormDisabled = isSubmitting || isUploading || isLoadingStory;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 sm:space-y-6"
      >
        {/* Title Input */}
        <div>
          <input
            placeholder="Title here..."
            className="w-full font-display bg-black border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:border-[var(--color-yellow)] transition-colors rounded-none"
            disabled={isFormDisabled}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-2">
              {errors.title.message?.toString()}
            </p>
          )}
        </div>

        {/* Rich Text Editor */}
        <div>
          <RichTextEditor
            ref={richTextEditorRef}
            content={watch("body")}
            onChange={(value) => setValue("body", value)}
            disabled={isFormDisabled}
          />
          {errors.body && (
            <p className="text-red-400 text-sm mt-2">
              {errors.body.message?.toString()}
            </p>
          )}
        </div>

        {/* Thumbnail Upload Section */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Add Thumbnail (Optional)
          </label>

          {!thumbnailPreview ? (
            <>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="bg-black border border-white/20 px-3 sm:px-4 py-2 w-full rounded-none file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-none file:border-0 file:text-xs sm:file:text-sm file:bg-[var(--color-yellow)] file:text-black hover:file:bg-[var(--color-yellow)]"
                disabled={isFormDisabled}
                onChange={handleThumbnailChange}
              />
              {errors.thumbnail && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.thumbnail.message?.toString()}
                </p>
              )}
            </>
          ) : (
            <div className="relative">
              <div className="border border-white/20 rounded p-4">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="w-full max-w-xs h-auto rounded object-cover mx-auto"
                />
              </div>
              <button
                type="button"
                onClick={removeThumbnail}
                disabled={isFormDisabled}
                className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove thumbnail
              </button>
            </div>
          )}

          <p className="text-xs opacity-50 mt-1">
            Supported: JPEG, PNG, GIF, WebP. Max size: 5MB. This will be used as
            a story thumbnail.
          </p>
        </div>

        {/* Board Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Add to Boards (Optional)
          </label>
          <BoardMultiSelect
            selected={selectedBoards}
            setSelected={setSelectedBoards}
            disabled={isFormDisabled}
          />
          {selectedBoards.length > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              This story will be added to {selectedBoards.length} board
              {selectedBoards.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Progress Bar */}
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[var(--color-yellow)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-4 gap-3 sm:gap-0">
          <div className="text-xs sm:text-sm opacity-70">
            {!user?.wallet_address && (
              <span className="text-[var(--color-yellow)]">
                ⚠️ Connect your wallet to publish
              </span>
            )}
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-[var(--color-yellow)] text-black px-4 sm:px-6 py-2 sm:py-3 font-bold hover:bg-[var(--color-yellow)] disabled:opacity-50 disabled:cursor-not-allowed transition-all rounded-none text-sm sm:text-base"
            disabled={isFormDisabled || !user?.wallet_address}
          >
            {isLoadingStory
              ? "Loading Story..."
              : isUploading
              ? "Uploading Thumbnail..."
              : isSubmitting
              ? isEditing
                ? "Beaming..."
                : "Beaming..."
              : isEditing
              ? "Update Story"
              : "Beam it!"}
          </button>
        </div>
      </form>
    </div>
  );
}
