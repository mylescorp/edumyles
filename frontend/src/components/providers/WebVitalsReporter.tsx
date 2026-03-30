"use client";

import { useEffect } from "react";
import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";

/**
 * Reports Core Web Vitals to:
 *  1. Google Analytics (via gtag) — already wired via @vercel/speed-insights
 *  2. PostHog — if configured
 *  3. Sentry — as measurements on the active transaction
 *
 * Mount this once in the root layout.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    function report(metric: Metric) {
      // 1. gtag (Google Analytics / Vercel Analytics)
      if (typeof window !== "undefined" && "gtag" in window) {
        (window as any).gtag("event", metric.name, {
          value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
          event_category: "Web Vitals",
          event_label: metric.id,
          non_interaction: true,
        });
      }

      // 2. PostHog
      try {
        const { default: posthog } = require("posthog-js");
        if (posthog.__loaded) {
          posthog.capture("web_vital", {
            metric: metric.name,
            value: metric.value,
            id: metric.id,
            navigationType: metric.navigationType,
          });
        }
      } catch {
        // PostHog not initialised yet — skip
      }

      // 3. Sentry
      try {
        const Sentry = require("@sentry/nextjs");
        const activeSpan = Sentry.getActiveSpan();
        if (activeSpan) {
          const rootSpan = Sentry.getRootSpan(activeSpan);
          rootSpan?.setAttribute(`web_vital.${metric.name.toLowerCase()}`, metric.value);
        }
      } catch {
        // Sentry not initialised — skip
      }
    }

    onCLS(report);
    onINP(report);
    onFCP(report);
    onLCP(report);
    onTTFB(report);
  }, []);

  return null;
}
