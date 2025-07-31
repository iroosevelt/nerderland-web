// lib/validation/schemas.ts
import { z } from "zod";

// Wallet address validation
export const walletAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid wallet address format");

// Username validation with additional security
export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be no more than 20 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers, and underscores"
  )
  .refine((val) => {
    const reserved = [
      "admin",
      "api",
      "www",
      "mail",
      "ftp",
      "localhost",
      "root",
      "support",
      "info",
      "help",
      "news",
      "blog",
      "shop",
      "store",
      "app",
      "mobile",
      "stories",
      "drops",
      "boards",
      "nerdrum",
      "nerd",
      "profile",
      "settings",
      "dashboard",
      "upload",
      "download",
      "file",
      "static",
      "assets",
      "public",
      "private",
      "test",
      "dev",
      "staging",
      "prod",
      "production",
    ];
    return !reserved.includes(val.toLowerCase());
  }, "Username is reserved");

// Email validation
export const emailSchema = z
  .string()
  .email("Invalid email format")
  .max(255, "Email too long")
  .optional()
  .or(z.literal(""));

// Date of birth validation
export const dobSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
  .refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const age = now.getFullYear() - date.getFullYear();
    return age >= 13 && age <= 120; // Age restrictions
  }, "Invalid date of birth")
  .optional()
  .or(z.literal(""));

// Profile update schema
export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  email: emailSchema,
  dob: dobSchema,
  address: walletAddressSchema,
});

// Story content validation
export const storySchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .regex(/^[^<>]*$/, "Title cannot contain HTML tags"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(50000, "Content too long"),
  media_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z.object({
    name: z.string().max(255, "Filename too long"),
    size: z.number().max(10 * 1024 * 1024, "File too large (max 10MB)"),
    type: z.enum([
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "application/pdf",
    ]).refine((val) => val, { message: "Invalid file type" }),
  }),
});

// Sanitization helper
export function sanitizeHtml(content: string): string {
  // Allow only basic formatting tags

  // Use DOMPurify or similar in production
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:/gi, "")
    .replace(/vbscript:/gi, "");
}
