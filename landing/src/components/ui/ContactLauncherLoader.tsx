"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageCircle, MessagesSquare } from "lucide-react";

type ContactMode = "chat" | "whatsapp";

const ContactLauncherPanel = dynamic(() => import("./ContactLauncher"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      className="fixed bottom-24 right-5 z-[9997] rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
    >
      Loading contact form…
    </div>
  ),
});

export default function ContactLauncherLoader() {
  const [mode, setMode] = useState<ContactMode | null>(null);
  const [lastMode, setLastMode] = useState<ContactMode>("chat");
  const [hasOpened, setHasOpened] = useState(false);

  function open(nextMode: ContactMode) {
    setLastMode(nextMode);
    setMode(nextMode);
    setHasOpened(true);
  }

  return (
    <>
      <div className="fixed bottom-6 left-5 z-[9996]">
        <button
          type="button"
          onClick={() => open("whatsapp")}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-status-success-solid)] text-[var(--color-status-success-on-solid)] shadow-[0_18px_40px_-18px_color-mix(in_srgb,var(--color-status-success-solid)_90%,transparent)] ring-1 ring-[var(--color-focus-ring)] transition hover:-translate-y-0.5 hover:bg-[var(--color-status-success-solid)] focus:outline-none focus:ring-4 focus:ring-[var(--color-status-success-solid)]/30"
          aria-label="Open WhatsApp message form"
        >
          <MessageCircle className="h-6 w-6 transition group-hover:scale-105" />
        </button>
      </div>

      <div className="fixed bottom-6 right-5 z-[9996]">
        <button
          type="button"
          onClick={() => open("chat")}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-chrome-platform)] text-[var(--color-text-on-primary)] shadow-[0_18px_42px_-20px_color-mix(in_srgb,var(--color-surface-page)_90%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--color-text-inverse)_10%,transparent)] transition hover:-translate-y-0.5 hover:bg-[var(--color-chrome-platform)] focus:outline-none focus:ring-4 focus:ring-[var(--color-focus-ring)]/30"
          aria-label="Open live chat"
        >
          <MessagesSquare className="h-5 w-5 transition group-hover:scale-105" />
        </button>
      </div>

      {hasOpened && (
        <ContactLauncherPanel
          initialMode={lastMode}
          isOpen={mode !== null}
          onClose={() => setMode(null)}
        />
      )}
    </>
  );
}
