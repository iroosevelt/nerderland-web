// lib/seo/metadata.ts
import { Metadata } from "next";

export interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  author?: string;
  tags?: string[];
}

export function generateMetadata({
  title,
  description,
  image = "/img/og-default.png",
  url,
  type = "website",
  publishedTime,
  author,
  tags = [],
}: SEOProps): Metadata {
  const siteName = "Nerderland";
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const fullUrl = url
    ? `https://nerderland.com${url}`
    : "https://nerderland.com";
  const fullImage = image.startsWith("http")
    ? image
    : `https://nerderland.com${image}`;

  return {
    title: fullTitle,
    description,

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url: fullUrl,
      siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      ...(publishedTime && { publishedTime }),
      ...(author && { authors: [author] }),
    },

    // Twitter
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [fullImage],
      creator: author ? `@${author}` : "@nerderland",
    },

    // Article-specific metadata
    ...(type === "article" && {
      authors: author ? [{ name: author }] : undefined,
      keywords: tags,
    }),

    // Additional SEO
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Verification & Analytics
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
    },

    // Canonical URL
    alternates: {
      canonical: fullUrl,
    },
  };
}
