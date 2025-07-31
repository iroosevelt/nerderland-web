// lib/utils/textUtils.ts

/**
 * Strips HTML tags from a string and returns plain text
 */
export const stripHtmlTags = (html: string): string => {
  if (!html) return "";

  // Use browser API if available (client-side)
  if (typeof window !== "undefined") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return (tempDiv.textContent || tempDiv.innerText || "").trim();
  }

  // Server-side fallback - remove HTML tags with regex
  return html.replace(/<[^>]*>/g, "").trim();
};

/**
 * Truncates text to a specified length and adds ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 100): string => {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

/**
 * Generates a URL-friendly slug from a title
 */
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

/**
 * Cleans and processes story description for display
 */
export const processStoryDescription = (
  content: string,
  maxLength: number = 100
): string => {
  if (!content) return "";

  const plainText = stripHtmlTags(content);
  return truncateText(plainText, maxLength);
};

/**
 * Validates if a URL is a video URL
 */
export const isVideoUrl = (url: string): boolean => {
  if (typeof url === "object") return false; // StaticImageData
  return (
    /\.(mp4|webm|mov|avi|wmv|flv)$/i.test(url) ||
    url.includes("youtube.com") ||
    url.includes("youtu.be") ||
    url.includes("vimeo.com")
  );
};

/**
 * Gets video thumbnail URL for supported video platforms
 */
export const getVideoThumbnail = (url: string): string => {
  // YouTube thumbnail
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const videoId = url.includes("youtu.be")
      ? url.split("youtu.be/")[1]?.split("?")[0]
      : url.split("v=")[1]?.split("&")[0];
    if (videoId) {
      return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    }
  }

  // Vimeo thumbnail (would need API call for real implementation)
  if (url.includes("vimeo.com")) {
    return "/img/video_placeholder.png";
  }

  // For direct video files, return a placeholder
  return "/img/video_placeholder.png";
};
