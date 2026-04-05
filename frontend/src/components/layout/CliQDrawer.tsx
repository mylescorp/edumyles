"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Search, Plus, Minus, MessageCircle, Hash, Users2, X } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CliQTab = "chats" | "channels" | "contacts";

export interface ChatItem {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  online?: boolean;
  isChannel?: boolean;
  membersCount?: number;
  unread?: number;
}

// ─── Mock data (replace with real Convex queries when chat backend is ready) ──

const DEMO_CHATS: ChatItem[] = [
  {
    id: "taz",
    name: "Taz",
    subtitle: "Hey there! How you doi...",
    initials: "TZ",
    online: true,
    unread: 2,
  },
  {
    id: "announcements",
    name: "#announcements",
    subtitle: "Welcome to #announcements...",
    initials: "#A",
    isChannel: true,
  },
];

const DEMO_CHANNELS: ChatItem[] = [
  {
    id: "announcements",
    name: "#announcements",
    subtitle: "Welcome to #announcements. By...",
    initials: "#A",
    membersCount: 1,
  },
];

const DEMO_CONTACTS: ChatItem[] = [
  {
    id: "taz",
    name: "Taz",
    subtitle: "Happy to help",
    initials: "TZ",
    online: true,
  },
];

// ─── Avatar ───────────────────────────────────────────────────────────────────

function ItemAvatar({ item }: { item: ChatItem }) {
  return (
    <div className="relative shrink-0">
      <div
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center text-[11px] font-bold",
          item.isChannel
            ? "bg-[var(--sidebar-active)] text-[var(--em-sage-muted)]"
            : "bg-[var(--em-forest)] text-[var(--em-gold)]"
        )}
      >
        {item.initials}
      </div>
      {item.online && !item.isChannel && (
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-[#061A12]" />
      )}
    </div>
  );
}

// ─── Single chat/channel/contact row ─────────────────────────────────────────

function ItemRow({
  item,
  onClick,
}: {
  item: ChatItem;
  onClick: (item: ChatItem) => void;
}) {
  return (
    <button
      onClick={() => onClick(item)}
      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/6 transition-colors duration-100 text-left"
    >
      <ItemAvatar item={item} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-white/85 truncate">
            {item.name}
          </span>
          {item.unread && item.unread > 0 ? (
            <span className="ml-1 shrink-0 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--em-gold)] text-[9px] font-bold text-[var(--topnav-bg)] px-1">
              {item.unread}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-white/40 truncate">{item.subtitle}</p>
      </div>
    </button>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────

interface CliQDrawerProps {
  tab: CliQTab;
  onClose: () => void;
  onOpenChat: (item: ChatItem) => void;
  userName: string;
  userStatus?: string;
}

export function CliQDrawer({
  tab,
  onClose,
  onOpenChat,
  userName,
  userStatus = "Available",
}: CliQDrawerProps) {
  const [search, setSearch] = useState("");

  const searchPlaceholder =
    tab === "chats"
      ? "Search Contacts, Chats & Channels"
      : tab === "channels"
      ? "Search Channels"
      : "Search Contacts";

  const rawItems =
    tab === "chats"
      ? DEMO_CHATS
      : tab === "channels"
      ? DEMO_CHANNELS
      : DEMO_CONTACTS;

  const items = search
    ? rawItems.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : rawItems;

  const sectionLabel =
    tab === "chats"
      ? "Recent Chats"
      : tab === "channels"
      ? "Channels"
      : "Contacts";

  return (
    <div
      className="flex flex-col w-[210px] shrink-0 overflow-hidden"
      style={{
        background: "var(--em-forest-deep)",
        borderRight: "1px solid var(--em-gold-10)",
      }}
    >
      {/* Header — user row */}
      <div
        className="flex items-center justify-between px-3 py-2.5 border-b"
        style={{ borderColor: "var(--em-gold-10)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="relative shrink-0">
            <div className="h-7 w-7 rounded-full bg-[var(--em-forest)] flex items-center justify-center text-[10px] font-bold text-[var(--em-gold)]">
              {userName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 border border-[var(--em-forest-deep)]" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-white/85 truncate leading-tight">
              {userName}
            </p>
            <p className="text-[10px] text-emerald-400 leading-tight">
              {userStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          <button className="h-6 w-6 flex items-center justify-center rounded text-white/40 hover:text-[var(--em-gold)] hover:bg-white/8 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="h-6 w-6 flex items-center justify-center rounded text-white/40 hover:text-[var(--em-gold)] hover:bg-white/8 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div
        className="px-2 py-2 border-b"
        style={{ borderColor: "var(--em-gold-10)" }}
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full h-7 pl-7 pr-2 text-[11px] rounded-md bg-white/6 border border-white/8 text-white/80 placeholder:text-white/30 outline-none focus:border-[var(--em-gold-30)] transition-colors"
          />
        </div>
      </div>

      {/* Section label */}
      <div className="px-3 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
          {sectionLabel}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <p className="px-3 py-4 text-[11px] text-white/35 text-center">
            No results
          </p>
        ) : (
          items.map((item) => (
            <ItemRow key={item.id} item={item} onClick={onOpenChat} />
          ))
        )}
      </div>
    </div>
  );
}
