"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Users,
  Hash,
  Send,
  HelpCircle,
  Lightbulb,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AdminBottomBar() {
  const router = useRouter();
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"chats" | "channels" | "contacts">("chats");

  const handleSendMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    router.push(`/admin/communications?compose=${encodeURIComponent(trimmed)}`);
    setChatInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        {/* Left side — Navigation tabs */}
        <div className="flex items-center gap-1">
          <Link href="/admin/communications">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("chats")}
              className={cn(
                "flex items-center gap-2 h-8 px-3",
                activeTab === "chats" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Chats</span>
            </Button>
          </Link>

          <Link href="/admin/communications?tab=channels">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("channels")}
              className={cn(
                "flex items-center gap-2 h-8 px-3",
                activeTab === "channels" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Hash className="h-4 w-4" />
              <span className="text-sm font-medium">Channels</span>
            </Button>
          </Link>

          <Link href="/admin/users">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("contacts")}
              className={cn(
                "flex items-center gap-2 h-8 px-3",
                activeTab === "contacts" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Contacts</span>
            </Button>
          </Link>
        </div>

        {/* Center — Quick message compose */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              <Zap className="h-3 w-3 text-yellow-500" />
              <span className="text-xs text-gray-500">Quick Message</span>
            </div>
            <Input
              type="text"
              placeholder="Compose a message…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="pl-28 pr-10 h-8 text-sm border-gray-300 focus:border-blue-500"
            />
            <Button
              size="sm"
              onClick={handleSendMessage}
              disabled={!chatInput.trim()}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 bg-blue-500 hover:bg-blue-600"
            >
              <Send className="h-3 w-3 text-white" />
            </Button>
          </div>
        </div>

        {/* Right side — Support + Feedback */}
        <div className="flex items-center gap-2">
          <Link href="/admin/tickets">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 px-3 border-gray-300 text-gray-600 hover:text-gray-900"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Need Support?</span>
            </Button>
          </Link>
          <a href="https://feedback.edumyles.com" target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 h-8 px-3 border-gray-300 text-gray-600 hover:text-gray-900"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">Feature Feedback</span>
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
