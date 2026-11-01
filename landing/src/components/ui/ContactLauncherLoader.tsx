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

  return (
    <>
      <div className="fixed bottom-6 left-5 z-[9996]">
        <button
          type="button"
          onClick={() => {
            setLastMode("whatsapp");
            setMode("whatsapp");
          }}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-[#052E16] shadow-[0_18px_40px_-18px_rgba(37,211,102,0.9)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[#20bd5b] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
          aria-label="Open WhatsApp message form"
        >
          <MessageCircle className="h-6 w-6 transition group-hover:scale-105" />
        </button>
      </div>

      <div className="fixed bottom-6 right-5 z-[9996]">
        <button
          type="button"
          onClick={() => {
            setLastMode("chat");
            setMode("chat");
          }}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_42px_-20px_rgba(15,23,42,0.9)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/30"
          aria-label="Open live chat"
        >
          <MessagesSquare className="h-5 w-5 transition group-hover:scale-105" />
        </button>
      </div>

      <ContactLauncherPanel
        initialMode={lastMode}
        isOpen={mode !== null}
        onClose={() => setMode(null)}
      />
    </>
  );
}
