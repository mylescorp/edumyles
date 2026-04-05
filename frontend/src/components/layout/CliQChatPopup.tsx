"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Minus,
  Maximize2,
  X,
  Paperclip,
  Mic,
  Smile,
  ChevronDown,
  Phone,
} from "lucide-react";
import type { ChatItem } from "./CliQDrawer";

// ─── Demo message thread ──────────────────────────────────────────────────────

interface Message {
  id: string;
  text: string;
  fromMe: boolean;
  time: string;
}

const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    fromMe: false,
    time: "07:05 PM",
    text: "1. You could use me as a notepad to scribble down your to-dos, save important notes; and rest assured whatever you write here will be only between the two of us. You can count on me on this 😊\nAs and when you need it, all you need to do is search for it in our chat.\n2. You can also share files, images, links that you'd like to store for future use. I'll keep them safe for you. You can reach out to me whenever you need them.\n3. I'll also be your Notification Centre - by notifying you of anything that requires attention by pushing it to you via our chat.",
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface CliQChatPopupProps {
  chat: ChatItem;
  onClose: () => void;
}

export function CliQChatPopup({ chat, onClose }: CliQChatPopupProps) {
  const [minimized, setMinimized] = useState(false);
  const [message, setMessage] = useState("");
  const [actionsOpen, setActionsOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col rounded-t-lg shadow-2xl overflow-hidden transition-all duration-200",
        minimized ? "h-[40px]" : "h-[360px]"
      )}
      style={{
        width: 240,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderBottom: "none",
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center gap-2 px-2.5 py-2 shrink-0 cursor-pointer select-none"
        style={{
          background: "#f9fafb",
          borderBottom: minimized ? "none" : "1px solid #e5e7eb",
        }}
        onClick={() => setMinimized((v) => !v)}
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="h-6 w-6 rounded-full bg-[var(--em-forest)] flex items-center justify-center text-[9px] font-bold text-[var(--em-gold)]">
            {chat.initials}
          </div>
          {chat.online && (
            <span className="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-emerald-400 border border-[#f9fafb]" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-800 truncate leading-tight">
            {chat.name}
          </p>
          {!minimized && (
            <p className="text-[10px] text-gray-400 leading-tight truncate">
              {chat.subtitle}
            </p>
          )}
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-0.5 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!chat.isChannel && (
            <button
              className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              title="Voice call"
            >
              <Phone className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => setMinimized((v) => !v)}
            className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title={minimized ? "Restore" : "Minimize"}
          >
            <Minus className="h-3 w-3" />
          </button>
          <button
            className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Expand"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
          <button
            onClick={onClose}
            className="h-5 w-5 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {DEMO_MESSAGES.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.fromMe ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[90%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap",
                    msg.fromMe
                      ? "bg-[var(--em-gold)] text-[var(--topnav-bg)] rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  )}
                >
                  {msg.text}
                  <div className="mt-1 text-[9px] text-right opacity-60">
                    {msg.time}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* ── Actions bar ── */}
          <div
            className="shrink-0 flex items-center justify-end px-2 py-1"
            style={{ borderTop: "1px solid #f3f4f6" }}
          >
            <div className="relative">
              <button
                onClick={() => setActionsOpen((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
              >
                Actions
                <ChevronDown className="h-3 w-3" />
              </button>
              {actionsOpen && (
                <div className="absolute bottom-full right-0 mb-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                  {["Remind me", "Star message", "Forward", "Copy link"].map(
                    (action) => (
                      <button
                        key={action}
                        onClick={() => setActionsOpen(false)}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        {action}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Input area ── */}
          <div
            className="shrink-0 flex items-center gap-1.5 px-2 py-2"
            style={{ borderTop: "1px solid #e5e7eb" }}
          >
            <button className="h-6 w-6 shrink-0 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Paperclip className="h-3.5 w-3.5" />
            </button>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  setMessage("");
                }
              }}
              placeholder="Type a message…"
              className="flex-1 text-[11px] bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
            />
            <button className="h-6 w-6 shrink-0 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Mic className="h-3.5 w-3.5" />
            </button>
            <button className="h-6 w-6 shrink-0 flex items-center justify-center rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Smile className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
