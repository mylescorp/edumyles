"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

/**
 * Initialises PostHog once on the client and wraps children in the provider
 * so that any component can call `usePostHog()` for event capture.
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

    if (!key) return; // silently skip if env var not configured

    posthog.init(key, {
      api_host: host,
      // Only track page views automatically in production
      capture_pageview: process.env.NODE_ENV === "production",
      // Respect Do-Not-Track headers
      respect_dnt: true,
      // Don't record session replays by default
      disable_session_recording: true,
      // Bootstrap feature flags on load
      bootstrap: {},
    });
  }, []);

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return <>{children}</>;

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
