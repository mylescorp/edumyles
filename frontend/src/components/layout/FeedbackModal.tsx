"use client";

import { useState } from "react";
import { X, Star, Send, CheckCircle2 } from "lucide-react";

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setRating(0);
      setSubject("");
      setMessage("");
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-[15px] font-semibold text-gray-900">
              EduMyles Feature Feedback
            </h2>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Help us improve the platform
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-[14px] font-medium text-gray-800">
              Thank you for your feedback!
            </p>
            <p className="text-[12px] text-gray-400">
              We&apos;ll review it and get back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Star rating */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Overall rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className="h-6 w-6 transition-colors"
                      fill={(hovered || rating) >= star ? "var(--platform-highlight)" : "none"}
                      stroke={(hovered || rating) >= star ? "var(--platform-highlight)" : "#d1d5db"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Suggestion for the dashboard"
                className="w-full h-9 rounded-lg border border-gray-200 px-3 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-[var(--platform-accent)] focus:ring-1 focus:ring-[var(--platform-accent-soft)]"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-[12px] font-medium text-gray-600 mb-1.5">
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what you think or suggest a feature…"
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] outline-none transition-all placeholder:text-gray-400 focus:border-[var(--platform-accent)] focus:ring-1 focus:ring-[var(--platform-accent-soft)]"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!subject.trim() || !message.trim()}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--platform-accent)] text-[13px] font-medium text-white transition-colors hover:bg-[var(--platform-accent-hover)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send Feedback
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
