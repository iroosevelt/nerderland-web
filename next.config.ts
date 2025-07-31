import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve?.alias,
        "@db": path.resolve(__dirname, "../../packages/db"),
      },
    };

    return config;
  },
  images: {
    remotePatterns: [
      {
        hostname: "res.cloudinary.com",
      },
      {
        hostname: "img.youtube.com",
      },
      {
        hostname: "www.youtube.com",
      },
    ],
  },
};

export default nextConfig;
