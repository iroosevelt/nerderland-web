// components/board/BoardProfile.tsx

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  Globe,
  Lock,
  Settings,
  Share2,
  Camera,
  Upload,
} from "lucide-react";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import imageCompression from "browser-image-compression";
import type { Board } from "./types";

interface BoardProfileProps {
  board: Board;
  username: string;
  boardId: number;
  isOwner: boolean;
  isMember: boolean;
  isJoining: boolean;
  onJoinBoard: () => void;
  onRefetch: () => void;
}

export function BoardProfile({
  board,
  username,
  boardId,
  isOwner,
  isMember,
  isJoining,
  onJoinBoard,
  onRefetch,
}: BoardProfileProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: board.name,
    description: board.description || "",
    is_public: board.is_public || false,
    avatar_url: board.avatar_url || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update form data when board data changes
  if (formData.name === "" && board.name) {
    setFormData({
      name: board.name,
      description: board.description || "",
      is_public: board.is_public || false,
      avatar_url: board.avatar_url || "",
    });
  }

  const handleShare = async () => {
    try {
      const url = window.location.href;
      if (navigator.share) {
        await navigator.share({
          title: board.name,
          text: board.description || `Check out ${board.name}`,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Board link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share board");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Board name is required");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${username}/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          is_public: formData.is_public,
          avatar_url: formData.avatar_url,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        toast.success("Board updated successfully");
        onRefetch();
      } else {
        const result = await response.json();
        toast.error(result.error || "Failed to update board");
      }
    } catch (error) {
      console.error("Error updating board:", error);
      toast.error("Failed to update board");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    setIsUploadingImage(true);
    try {
      toast.loading("Processing image...");

      let processedFile = file;
      const isGif = file.type === "image/gif";

      if (!isGif && file.size > 1024 * 1024) {
        try {
          processedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true,
            fileType: file.type.includes("png") ? "image/png" : "image/jpeg",
          });
          toast.dismiss();
          toast.loading("Uploading image...");
        } catch (compressionError) {
          console.warn(
            "Image compression failed, using original:",
            compressionError
          );
          toast.dismiss();
          toast.loading("Uploading image...");
        }
      } else {
        toast.dismiss();
        if (isGif) {
          toast.loading("Uploading GIF...");
        } else {
          toast.loading("Uploading image...");
        }
      }

      const avatarUrl = await uploadToCloudinary(processedFile);

      toast.dismiss();
      toast.loading("Saving board...");

      const response = await fetch(`/api/users/${username}/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl }),
      });

      if (response.ok) {
        setFormData((prev) => ({ ...prev, avatar_url: avatarUrl }));
        toast.dismiss();
        if (isGif) {
          toast.success("Board GIF updated successfully! 🎉");
        } else {
          toast.success("Board image updated successfully!");
        }
        onRefetch();
      } else {
        const result = await response.json();
        toast.dismiss();
        toast.error(result.error || "Failed to save image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.dismiss();

      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          toast.error("Upload timeout. Please try with a smaller image.");
        } else if (error.message.includes("network")) {
          toast.error(
            "Network error. Please check your connection and try again."
          );
        } else if (error.message.includes("file size")) {
          const maxSize = file.type === "image/gif" ? "10MB" : "5MB";
          toast.error(
            `Image is too large. Please use an image smaller than ${maxSize}.`
          );
        } else {
          toast.error("Failed to upload image. Please try again.");
        }
      } else {
        toast.error("Failed to upload image. Please try again.");
      }
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const supportedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!supportedTypes.includes(file.type)) {
        toast.error(
          "Please select a valid image file (JPEG, PNG, GIF, or WebP)"
        );
        return;
      }

      const maxSize =
        file.type === "image/gif" ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxSize) {
        const maxSizeText = file.type === "image/gif" ? "10MB" : "5MB";
        toast.error(`Image must be smaller than ${maxSizeText}`);
        return;
      }

      handleImageUpload(file);
    }
  };

  return (
    <div className="w-full lg:w-[320px] bg-black/50 p-3 ml-auto sm:p-4 border-b lg:border-b-0 lg:border-r border-white/10 flex-shrink-0 overflow-y-auto lg:order-2">
      <div className="flex flex-col lg:flex-col items-center lg:items-start w-full mb-4 sm:mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row w-full items-center sm:items-start justify-center sm:justify-between gap-4">
          <div className="relative group">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 lg:w-16 lg:h-16 border border-white/20">
              <AvatarImage
                src={board.avatar_url || board.user.avatar_url}
                alt={board.name}
                className="object-cover"
              />
              <AvatarFallback className="bg-gray-700 text-white">
                {board.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOwner && isEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {isUploadingImage ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="border-white/20 text-xs sm:text-sm rounded-none px-2 sm:px-3"
            >
              <Share2 className="w-3 h-3 mr-1" />
              Share
            </Button>
            {isOwner ? (
              <Button
                onClick={() => setIsEditing(!isEditing)}
                size="sm"
                className="bg-gray-700 text-white hover:bg-gray-600 text-xs sm:text-sm rounded-none px-2 sm:px-3"
              >
                <Settings className="w-3 h-3 mr-1" />
                {isEditing ? "Cancel" : "Edit"}
              </Button>
            ) : isMember ? (
              <Button
                size="sm"
                disabled
                className="bg-gray-600 text-white text-xs sm:text-sm rounded-none px-2 sm:px-3 cursor-not-allowed"
              >
                <Users className="w-3 h-3 mr-1" />
                Member
              </Button>
            ) : (
              <Button
                onClick={onJoinBoard}
                disabled={isJoining}
                size="sm"
                className="bg-[var(--color-yellow)]  text-black hover:bg-[var(--color-yellow)]  text-xs sm:text-sm rounded-none px-2 sm:px-3"
              >
                <Users className="w-3 h-3 mr-1" />
                {isJoining ? "Joining..." : "Join"}
              </Button>
            )}
          </div>
        </div>

        <div className="text-center lg:text-left w-full">
          {isEditing ? (
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">
                  Board Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full bg-black border border-white/20 px-2 sm:px-3 py-2 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
                  placeholder="Enter board name"
                  maxLength={50}
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">
                  Board Image (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) =>
                      setFormData({ ...formData, avatar_url: e.target.value })
                    }
                    className="flex-1 bg-black border border-white/20 px-2 sm:px-3 py-2 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
                    placeholder="Enter image URL or upload file"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    size="sm"
                    className="bg-gray-700 text-white hover:bg-gray-600 px-2"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full bg-black border border-white/20 px-2 sm:px-3 py-2 rounded focus:border-[var(--color-yellow)]  transition-colors text-xs sm:text-sm"
                  placeholder="Enter board description"
                  rows={3}
                  maxLength={500}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) =>
                      setFormData({ ...formData, is_public: e.target.checked })
                    }
                    className="rounded"
                  />
                  Public board
                </label>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[var(--color-yellow)]  text-black hover:bg-[var(--color-yellow)]  disabled:opacity-50 w-full rounded-none text-xs sm:text-sm"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-3">
                <h1 className="text-sm sm:text-base font-display text-white font-bold">
                  {board.name}
                </h1>
                <p className="text-xs text-gray-400">
                  by{" "}
                  <span
                    className="text-[var(--color-yellow)]  hover:underline cursor-pointer"
                    onClick={() => router.push(`/${board.user.username}`)}
                  >
                    {board.user.username}
                  </span>
                </p>
              </div>

              {board.description && (
                <div className="mb-3">
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                    {board.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                <Badge
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 text-xs"
                >
                  <Users className="w-3 h-3 mr-1" />
                  {board.member_count} member
                  {board.member_count !== 1 ? "s" : ""}
                </Badge>
                <Badge
                  variant="secondary"
                  className="bg-gray-800 text-gray-300 text-xs"
                >
                  {board.is_public ? (
                    <>
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </>
                  )}
                </Badge>
              </div>

              <div className="text-xs text-gray-400 space-y-1">
                <p>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Created {new Date(board.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
