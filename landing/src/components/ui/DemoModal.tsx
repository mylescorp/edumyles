"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface DemoModalProps {
  open: boolean;
  onClose: () => void;
}

export default function DemoModal({ open, onClose }: DemoModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Product demo video"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-navy rounded-2xl overflow-hidden w-full max-w-4xl shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close demo video"
        >
          <X size={20} />
        </button>
        <div className="aspect-video bg-navy-dark flex items-center justify-center">
          <div className="text-center text-white/50 p-8">
            <div className="text-6xl mb-4">🎬</div>
            <p className="font-jakarta font-semibold text-xl text-white mb-2">EduMyles Product Demo</p>
            <p className="font-inter text-sm">Full demo video coming soon. Book a live personalised demo instead.</p>
            <a
              href="/book-demo"
              className="inline-block mt-6 bg-gold hover:bg-gold-dark text-white font-inter font-semibold px-6 py-3 rounded-full transition-colors"
            >
              Book Live Demo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
