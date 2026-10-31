"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackCookieConsent } from "@/lib/analytics";

export default function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setMounted(true);
      try {
        setVisible(!window.localStorage.getItem("em-cookies"));
      } catch {
        setVisible(true);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function accept() {
    try {
      localStorage.setItem("em-cookies", "accepted");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
    trackCookieConsent("accepted");
  }

  function decline() {
    try {
      localStorage.setItem("em-cookies", "declined");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
    trackCookieConsent("declined");
  }

  if (!mounted || !visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 rounded-2xl p-5 shadow-2xl"
      style={{ background: "var(--card)", border: "1px solid rgb(var(--primary-rgb) / 30%)" }}
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <p className="font-jakarta text-sm mb-4 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        We use cookies to improve your experience and analyse site performance. See our{" "}
        <Link
          href="/privacy"
          className="no-underline hover:underline transition-all duration-200"
          style={{ color: "var(--accent-foreground)" }}
        >
          Privacy Policy
        </Link>
        .
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={accept}
          className="flex-1 font-jakarta font-semibold text-sm py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 font-jakarta text-sm py-2.5 rounded-lg transition-all duration-200"
          style={{
            background: "transparent",
            color: "var(--muted-foreground)",
            border: "1px solid rgba(168,230,195,0.3)"
          }}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
