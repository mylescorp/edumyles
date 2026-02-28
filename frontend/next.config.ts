import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "edumyles.com",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
  },
};

export default nextConfig;
