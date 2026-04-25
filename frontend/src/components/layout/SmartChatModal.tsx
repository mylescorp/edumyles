"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Lightbulb, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatItem } from "./CliQDrawer";

// ─── Demo data (mirrors CliQDrawer, replace with real queries) ────────────────

const DEMO_CHATS: ChatItem[] = [
  { id: "taz", name: "Taz", subtitle: "Taz: Hey there! How you doing?", initials: "TZ", online: true },
  { id: "announcements-chat", name: "#announcements", subtitle: "Welcome to #announcements...", initials: "#A", isChannel: true },
];

const DEMO_CONTACTS: ChatItem[] = [
  { id: "taz", name: "Taz", subtitle: "Happy to help", initials: "TZ", online: true },
];

const DEMO_CHANNELS: ChatItem[] = [
  { id: "announcements", name: "#announcements", subtitle: "Welcome to #announcements. By...", initials: "#A", membersCount: 1 },
];

// ─── Mini avatar ─────────────────────────────────────────────────────────────

function MiniAvatar({ item }: { item: ChatItem }) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center text-[12px] font-bold",
          item.isChannel ? "bg-gray-100 text-gray-500" : "bg-[var(--platform-accent-soft)] text-[var(--platform-accent)]"
        )}
      >
        {item.isChannel ? (
          <Users2 className="h-4 w-4" />
        ) : (
          item.initials
        )}
      </div>
      {item.online && !item.isChannel && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
      )}
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────

function Column({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: ChatItem[];
  onSelect: (item: ChatItem) => void;
}) {
  return (
    <div className="flex-1 min-w-0">
      <button className="text-sm font-semibold text-blue-600 underline underline-offset-2 mb-3 hover:text-blue-800 transition-colors">
        {title}
      </button>
      <div className="space-y-1">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <MiniAvatar item={item} />
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-gray-800 truncate leading-tight">
                {item.name}
              </p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">
                {item.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

interface SmartChatModalProps {
  open: boolean;
  onClose: () => void;
  onSelectChat: (item: ChatItem) => void;
}

export function SmartChatModal({ open, onClose, onSelectChat }: SmartChatModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const filter = (items: ChatItem[]) =>
    query
      ? items.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
      : items;

  const handleSelect = (item: ChatItem) => {
    onSelectChat(item);
    onClose();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.45)" }}
      onClick={onClose}
    >
      {/* Modal panel */}
      <div
        className="relative w-full max-w-[800px] mx-4 rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b border-gray-100"
        >
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Start a group chat by @name and #topic. Eg @Brian @James #Paris trip"
            className="flex-1 text-[14px] text-gray-800 placeholder:text-gray-400 outline-none bg-transparent"
          />
          <Lightbulb className="h-5 w-5 text-amber-400 shrink-0" />
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Three columns */}
        <div className="flex gap-8 px-8 py-6 min-h-[300px]">
          <Column
            title="Chats"
            items={filter(DEMO_CHATS)}
            onSelect={handleSelect}
          />
          <div className="w-px bg-gray-100 self-stretch" />
          <Column
            title="Contacts"
            items={filter(DEMO_CONTACTS)}
            onSelect={handleSelect}
          />
          <div className="w-px bg-gray-100 self-stretch" />
          <Column
            title="Channels"
            items={filter(DEMO_CHANNELS)}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
