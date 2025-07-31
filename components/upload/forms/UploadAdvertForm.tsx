"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import imageCompression from "browser-image-compression";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import { useUserProfile } from "@/stores/useUserProfile";
import { useModalStore } from "@/components/nerd-modal/useModalStore";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const AdvertSchema = z.object({
  title: z
    .string()
    .min(1, "Headline is required")
    .max(100, "Headline is too long"),
  content: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description is too long"),
  link_url: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  image: z
    .any()
    .optional()
    .refine(
      (file) => {
        if (!file) return true;
        if (!(file instanceof File)) return false;
        return file.size <= 5 * 1024 * 1024; // 5MB max
      },
      { message: "Image must be under 5MB" }
    )
    .refine(
      (file) => {
        if (!file) return true;
        if (!(file instanceof File)) return false;
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        return validTypes.includes(file.type);
      },
      { message: "Invalid image format" }
    ),
});

type AdvertInput = z.infer<typeof AdvertSchema>;

export function UploadAdvertForm() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user } = useUserProfile();
  const { close } = useModalStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdvertInput>({
    resolver: zodResolver(AdvertSchema),
    defaultValues: {
      title: "",
      content: "",
      link_url: "",
      image: undefined,
    },
  });

  // Process and compress image
  const processImageFile = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      let processedFile = file;

      // Skip compression for GIFs
      if (file.type === "image/gif") {
        toast.loading("Processing GIF...");
      } else {
        toast.loading("Processing image...");
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 2,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          });
        } catch (compressionError) {
          console.warn("Compression failed, using original:", compressionError);
        }
      }

      toast.dismiss();
      toast.loading("Uploading image...");
      const imageUrl = await uploadToCloudinary(processedFile);
      toast.dismiss();
      
      return imageUrl;
    } catch (error) {
      toast.dismiss();
      console.error("Image upload failed:", error);
      throw new Error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("image", file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setValue("image", undefined);
      setImagePreview(null);
    }
  };

  // Remove image
  const removeImage = () => {
    setValue("image", undefined);
    setImagePreview(null);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const onSubmit = async (values: AdvertInput) => {
    if (!user?.wallet_address) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setUploadProgress(30);
      let imageUrl: string | null = null;

      // Handle image upload
      if (values.image) {
        imageUrl = await processImageFile(values.image);
      }

      setUploadProgress(70);

      // Submit advert
      const response = await fetch("/api/adverts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          content: values.content,
          link_url: values.link_url || null,
          image_url: imageUrl,
          walletAddress: user.wallet_address,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setUploadProgress(100);

      // Success
      close();
      toast.success("Advert published successfully! 🎉", {
        description: "Your advert is now live in the feed",
        duration: 3000,
      });

      // Reset form
      reset();
      setUploadProgress(0);
      setImagePreview(null);

      // Refresh to show new advert
      router.refresh();
    } catch (error) {
      console.error("Advert submission error:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      let userMessage = "Failed to publish advert";
      
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        userMessage = "Network error - please check your connection and try again";
      } else if (errorMessage.includes("validation") || errorMessage.includes("Validation")) {
        userMessage = "Please check your input and try again";
      } else if (errorMessage.includes("auth")) {
        userMessage = "Authentication failed - please reconnect your wallet";
      }

      toast.error(userMessage, {
        description: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  };

  const isFormDisabled = isSubmitting || isUploading;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        {/* Title Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Advert Headline <span className="text-red-400">*</span>
          </label>
          <input
            placeholder="Eye-catching headline..."
            className="w-full bg-black border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-lg focus:border-[var(--color-yellow)] transition-colors rounded-none"
            disabled={isFormDisabled}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-red-400 text-sm mt-2">
              {errors.title.message?.toString()}
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            placeholder="Describe what you're advertising..."
            className="w-full bg-black border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-sm focus:border-[var(--color-yellow)] transition-colors rounded-none resize-none"
            rows={4}
            disabled={isFormDisabled}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-red-400 text-sm mt-2">
              {errors.content.message?.toString()}
            </p>
          )}
        </div>

        {/* Target Link */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Target Link (Optional)
          </label>
          <input
            placeholder="https://your-website.com"
            className="w-full bg-black border border-white/20 px-3 sm:px-4 py-2 sm:py-3 text-sm focus:border-[var(--color-yellow)] transition-colors rounded-none"
            disabled={isFormDisabled}
            {...register("link_url")}
          />
          {errors.link_url && (
            <p className="text-red-400 text-sm mt-2">
              {errors.link_url.message?.toString()}
            </p>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Banner Image (Optional)
          </label>

          {!imagePreview ? (
            <>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="bg-black border border-white/20 px-3 sm:px-4 py-2 w-full rounded-none file:mr-2 sm:file:mr-4 file:py-1 sm:file:py-2 file:px-2 sm:file:px-4 file:rounded-none file:border-0 file:text-xs sm:file:text-sm file:bg-[var(--color-yellow)] file:text-black hover:file:bg-[var(--color-yellow)]"
                disabled={isFormDisabled}
                onChange={handleImageChange}
              />
              {errors.image && (
                <p className="text-red-400 text-sm mt-2">
                  {errors.image.message?.toString()}
                </p>
              )}
            </>
          ) : (
            <div className="relative">
              <div className="border border-white/20 rounded p-4">
                <img
                  src={imagePreview}
                  alt="Banner preview"
                  className="w-full max-w-md h-auto rounded object-cover mx-auto"
                />
              </div>
              <button
                type="button"
                onClick={removeImage}
                disabled={isFormDisabled}
                className="mt-2 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Remove image
              </button>
            </div>
          )}

          <p className="text-xs opacity-50 mt-1">
            Supported: JPEG, PNG, GIF, WebP. Max size: 5MB.
          </p>
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
            {isUploading
              ? "Uploading Image..."
              : isSubmitting
              ? "Beaming..."
              : "Beam it!"}
          </button>
        </div>
      </form>
    </div>
  );
}
