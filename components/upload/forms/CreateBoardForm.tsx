// components/forms/CreateBoardForm.tsx

"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUserProfile } from "@/stores/useUserProfile";
import { useModalStore } from "@/components/nerd-modal/useModalStore";
import imageCompression from "browser-image-compression";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

// Board creation schema
const BoardSchema = z.object({
  name: z
    .string()
    .min(2, "Board name must be at least 2 characters")
    .max(100, "Board name is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  rules: z.string().max(2000, "Rules text is too long").optional(),
  isPublic: z.boolean().default(true),
  avatar: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        if (!(file instanceof File)) return false;

        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) return false;

        // Check file type
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
        message: "Avatar must be under 5MB and be a valid image format",
      }
    ),
});

type BoardInput = z.infer<typeof BoardSchema>;

export function CreateBoardForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { user } = useUserProfile();
  const { close } = useModalStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BoardInput>({
    resolver: zodResolver(BoardSchema),
    defaultValues: {
      name: "",
      description: "",
      rules: "",
      isPublic: true,
      avatar: undefined,
    },
  });

  // Process avatar file
  const processAvatarFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      let processedFile = file;

      toast.loading("Processing avatar...");

      try {
        processedFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 400,
          useWebWorker: true,
          fileType: file.type.includes("png") ? "image/png" : "image/jpeg",
        });

        toast.dismiss();
        toast.success("Avatar processed successfully");
      } catch (compressionError) {
        console.error("Avatar compression failed:", compressionError);
        toast.dismiss();
        toast.error("Failed to process avatar, using original");
        processedFile = file;
      }

      // Upload to Cloudinary
      toast.loading("Uploading avatar...");
      const avatarUrl = await uploadToCloudinary(processedFile);
      toast.dismiss();

      return avatarUrl;
    } catch (uploadError) {
      toast.dismiss();
      console.error("Avatar upload failed:", uploadError);
      throw new Error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ["image/gif", "image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only GIF, PNG, or JPG files are supported");
        return;
      }

      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be under 5MB");
        return;
      }

      setValue("avatar", file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const removeAvatar = () => {
    setValue("avatar", undefined);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (values: BoardInput) => {
    // Check if user is authenticated
    if (!user?.wallet_address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setUploadProgress(30);
      let avatarUrl: string | null = null;

      // Handle avatar upload
      if (values.avatar) {
        avatarUrl = await processAvatarFile(values.avatar);
      }

      // Create board
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          rules: values.rules,
          avatarUrl: avatarUrl || "",
          isPublic: values.isPublic,
          walletAddress: user.wallet_address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadProgress(100);

      // Success handling - Navigate to new board
      const boardUrl = `/${user.username}/boards/${data.board.id}`;

      // Close the modal immediately
      close();

      // Show success toast
      toast.success("Board created! 🎉", {
        description: "Redirecting to your new board...",
        duration: 3000,
      });

      // Reset form
      reset();
      setAvatarPreview(null);
      setUploadProgress(0);

      // Navigate to the board page
      router.push(boardUrl);
    } catch (error) {
      console.error("Board creation error:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      let userMessage = "Failed to create board";
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        userMessage =
          "Network error - please check your connection and try again";
      } else if (errorMessage.includes("validation")) {
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

  const isFormDisabled = isSubmitting || isUploading;

  return (
    <div className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm">
          <strong className="text-[var(--color-green)]">Create a Board</strong>{" "}
          - A space for interplanetary discourse
        </p>

        {/* Avatar Upload */}
        <div>
          <label className="block text-xs mb-1 uppercase">Upload Avatar</label>
          <div className="flex items-center space-x-4">
            {avatarPreview && (
              <div className="relative">
                <Avatar className="w-12 h-12 border border-white/20">
                  <AvatarImage className="object-cover" src={avatarPreview} />
                </Avatar>
                <button
                  type="button"
                  onClick={removeAvatar}
                  disabled={isFormDisabled}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                >
                  ×
                </button>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.gif,.webp"
              onChange={handleAvatarChange}
              disabled={isFormDisabled}
              className="text-sm bg-black border border-white/10 px-4 py-2 rounded-none file:mr-4 file:py-1 file:px-2 file:rounded-none file:border-0 file:text-xs file:bg-[var(--color-pink)] file:text-[var(--color-yellow)] hover:file:bg-[var(--color-blue)]"
            />
          </div>
          {errors.avatar && (
            <p className="text-red-400 text-xs mt-1">
              {errors.avatar.message?.toString()}
            </p>
          )}
          <p className="text-xs opacity-50 mt-1">
            Supported: GIF, PNG, JPG, WebP. Max size: 5MB.
          </p>
        </div>

        {/* Board Name */}
        <div>
          <input
            className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm focus:border-[var(--color-yellow)] transition-colors"
            placeholder="Board Name"
            disabled={isFormDisabled}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <textarea
            className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm min-h-[80px] focus:border-[var(--color-yellow)] transition-colors resize-vertical"
            placeholder="What is this Board about? (optional)"
            disabled={isFormDisabled}
            {...register("description")}
          />
          {errors.description && (
            <p className="text-red-400 text-xs mt-1">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Rules */}
        <div>
          <textarea
            className="w-full bg-black border border-white/10 px-4 py-2 rounded-none text-sm min-h-[80px] focus:border-[var(--color-yellow)] transition-colors resize-vertical"
            placeholder="Set board guidelines and rules (optional)"
            disabled={isFormDisabled}
            {...register("rules")}
          />
          {errors.rules && (
            <p className="text-red-400 text-xs mt-1">{errors.rules.message}</p>
          )}
        </div>

        {/* Privacy Setting */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            disabled={isFormDisabled}
            {...register("isPublic")}
            className="w-4 h-4 text-[var(--color-yellow)] bg-black border-white/20 rounded focus:ring-[var(--color-yellow)]"
          />
          <label htmlFor="isPublic" className="text-sm">
            Make this board public (others can discover and join)
          </label>
        </div>

        {/* Progress Bar */}
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-[var(--color-yellow)] h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-between items-center pt-4">
          <div className="text-sm opacity-70">
            {!user?.wallet_address && (
              <span className="text-[var(--color-yellow)]">
                ⚠️ Connect your wallet to create
              </span>
            )}
          </div>

          <button
            type="submit"
            className="bg-[var(--color-yellow)] text-black px-6 py-2 font-bold hover:bg-[var(--color-yellow)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            disabled={isFormDisabled || !user?.wallet_address}
          >
            {isUploading
              ? "Uploading Avatar..."
              : isSubmitting
              ? "Creating..."
              : "Beam it!"}
          </button>
        </div>
      </form>
    </div>
  );
}
