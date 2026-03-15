"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("em-cookies")) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem("em-cookies", "accepted");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }

  function decline() {
    try {
      localStorage.setItem("em-cookies", "declined");
    } catch {
      // ignore storage errors
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-navy-dark border border-white/10 rounded-2xl p-5 shadow-2xl"
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
    >
      <p className="font-inter text-sm text-white/80 mb-4 leading-relaxed">
        We use cookies to improve your experience and analyse site performance. See our{" "}
        <a href="/privacy" className="text-gold underline">
          Privacy Policy
        </a>
        .
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={accept}
          className="flex-1 bg-gold hover:bg-gold-dark text-white font-inter font-semibold text-sm py-2.5 rounded-full transition-colors"
        >
          Accept All
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-inter text-sm py-2.5 rounded-full transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
