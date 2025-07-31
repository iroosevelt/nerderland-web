// lib/uploadToCloudinary.ts
import axios, { AxiosError } from "axios";
import imageCompression from "browser-image-compression";

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  bytes: number;
  [key: string]: unknown;
}

interface CloudinaryError {
  error?: {
    message: string;
    http_code?: number;
  };
}

async function compressIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 5 * 1024 * 1024) return file;

  const options = {
    maxSizeMB: 4,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (err) {
    console.warn("Compression failed, using original", err);
    return file;
  }
}

export async function uploadToCloudinary(file: File): Promise<string> {
  // Validate file before upload
  if (!file) {
    throw new Error("No file provided");
  }

  file = await compressIfNeeded(file);

  // Check file size (50MB max)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File size exceeds 50MB limit");
  }

  // Check if required environment variables exist
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

  if (!uploadPreset) {
    console.error("Missing NEXT_PUBLIC_CLOUDINARY_PRESET environment variable");
    throw new Error("Upload configuration error");
  }

  // Determine resource type based on file type
  let resourceType: "image" | "video" | "auto" = "auto";
  if (file.type.startsWith("image/")) {
    resourceType = "image";
  } else if (file.type.startsWith("video/")) {
    resourceType = "video";
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    // Add additional parameters for better handling
    formData.append("resource_type", resourceType);

    // For videos, add some optimization
    if (resourceType === "video") {
      formData.append("quality", "auto");
      formData.append("fetch_format", "auto");
    }

    // Determine the correct endpoint based on cloud name or use default
    const cloudinaryUrl = cloudName
      ? `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
      : "https://api.cloudinary.com/v1_1/dieicedwv/auto/upload";

    const response = await axios.post<CloudinaryResponse>(
      cloudinaryUrl,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 second timeout for large files
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            // You could emit this progress to a progress bar if needed
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        },
      }
    );

    // Validate response
    if (!response.data?.secure_url) {
      throw new Error("Invalid response from Cloudinary");
    }

    return response.data.secure_url;
  } catch (error) {
    // Handle different types of errors
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<CloudinaryError>;

      if (axiosError.code === "ECONNABORTED") {
        throw new Error(
          "Upload timeout - file may be too large or connection is slow"
        );
      }

      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data as CloudinaryError;

        switch (status) {
          case 400:
            throw new Error(
              errorData.error?.message || "Invalid file or upload parameters"
            );
          case 401:
            throw new Error(
              "Upload authentication failed - check configuration"
            );
          case 413:
            throw new Error("File too large for upload");
          case 415:
            throw new Error("Unsupported file type");
          case 420:
            throw new Error("Rate limit exceeded - please try again later");
          case 500:
            throw new Error("Cloudinary server error - please try again");
          default:
            throw new Error(
              errorData.error?.message || `Upload failed with status ${status}`
            );
        }
      }

      if (axiosError.request) {
        throw new Error("Network error - unable to reach upload service");
      }
    }

    // Re-throw if it's already a proper error message
    throw error instanceof Error ? error : new Error("Upload failed");
  }
}
