import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? [new URL(process.env.NEXT_PUBLIC_APP_URL).host]
          : []),
      ],
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL ?? "",
    NEXT_PUBLIC_ROOT_DOMAIN: process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "edumyles.com",
    NEXT_PUBLIC_WORKOS_CLIENT_ID: process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID ?? "",
    WORKOS_REDIRECT_URI: process.env.WORKOS_REDIRECT_URI ?? "",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "",
    NEXT_PUBLIC_LANDING_URL: process.env.NEXT_PUBLIC_LANDING_URL ?? "",
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "**.cloudinary.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  headers: async () => [
    // ── Security + default cache for all routes ───────────────────────────
    {
      source: '/(.*)',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    // ── Static Next.js assets — long-lived, immutable ────────────────────
    {
      source: '/_next/static/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    // ── Protected app routes — NEVER cache; always re-validate with server ─
    // This prevents the browser from serving a cached authenticated page after
    // logout (back-button attack). Middleware enforces session on every request.
    {
      source: '/admin/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    {
      source: '/platform/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    {
      source: '/portal/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    {
      source: '/dashboard/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    {
      source: '/student/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    // ── Auth routes — never cache; always fresh ───────────────────────────
    {
      source: '/auth/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    // ── Auth + session API routes — never cache ───────────────────────────
    {
      source: '/api/auth/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
    // ── Other API routes ─────────────────────────────────────────────────
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, no-cache, must-revalidate, max-age=0' },
        { key: 'Pragma', value: 'no-cache' },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Fix for "self is not defined" error in Convex
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        self: false,
      };
    }
    
    return config;
  },
} as NextConfig & {
  eslint?: {
    ignoreDuringBuilds?: boolean;
  };
};

export default withSentryConfig(nextConfig, {
  // Sentry organisation and project (from env vars — no secrets in code)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Suppress the Sentry CLI output unless SENTRY_LOG_LEVEL is set
  silent: !process.env.SENTRY_LOG_LEVEL,
  // Only upload source maps in CI/production (skip on local dev to avoid noise)
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },
  // Disable the Sentry telemetry
  telemetry: false,
});
