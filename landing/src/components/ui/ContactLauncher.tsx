"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useQuery as useConvexQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { LandingConvexProvider } from "@/components/providers/LandingConvexProvider";
import {
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MessageCircle,
  MessagesSquare,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  CONTACT_TOPICS,
  EMPTY_CONTACT_PROFILE,
  buildContactMessage,
  buildWhatsAppUrl,
  getContactTopic,
  type ContactProfile,
  type ContactTopicId,
} from "@/lib/contactIntake";

type ContactMode = "chat" | "whatsapp";
type SubmitState = "idle" | "sending" | "sent" | "error";
type ChatMessage = {
  sender: "visitor" | "agent" | "system";
  body: string;
  authorName?: string;
  createdAt: number;
};
type ChatThread = {
  chatStatus: "waiting" | "active" | "ended";
  agentName?: string;
  messages: ChatMessage[];
};

const convexEnabled = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

function useVisitorChatThread(args: Parameters<typeof useConvexQuery>[1]) {
  if (typeof window === "undefined" || !convexEnabled) return undefined;
  // The widget is client-only; during server prerender there is no Convex provider.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useConvexQuery(api.publicEngagements.getVisitorChatThread, args);
}

function readAttribution() {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
  };
}

function launcherClass(mode: ContactMode) {
  return [
    "fixed inset-x-4 bottom-24 z-[9997] mx-auto max-w-[460px] overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] md:mx-0",
    mode === "whatsapp" ? "md:left-8 md:right-auto" : "md:left-auto md:right-8",
  ].join(" ");
}

function readSavedContactProfile(): ContactProfile {
  if (typeof window === "undefined") return EMPTY_CONTACT_PROFILE;

  try {
    const saved = window.localStorage.getItem("edumyles_contact_profile");
    return saved ? { ...EMPTY_CONTACT_PROFILE, ...JSON.parse(saved) } : EMPTY_CONTACT_PROFILE;
  } catch {
    return EMPTY_CONTACT_PROFILE;
  }
}

export default function ContactLauncher({
  initialMode,
  onClose,
}: {
  initialMode: ContactMode;
  onClose: () => void;
}) {
  return (
    <LandingConvexProvider>
      <ContactLauncherPanel initialMode={initialMode} onClose={onClose} />
    </LandingConvexProvider>
  );
}

function ContactLauncherPanel({
  initialMode,
  onClose,
}: {
  initialMode: ContactMode;
  onClose: () => void;
}) {
  const [mode] = useState<ContactMode>(initialMode);
  const [profile, setProfile] = useState<ContactProfile>(readSavedContactProfile);
  const [topicId, setTopicId] = useState<ContactTopicId>(CONTACT_TOPICS[0].id);
  const [message, setMessage] = useState<string>(CONTACT_TOPICS[0].prompt);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [resultId, setResultId] = useState<string | null>(null);
  const [visitorToken, setVisitorToken] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [reply, setReply] = useState("");
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const realtimeThread = useVisitorChatThread(
    resultId && visitorToken && mode === "chat"
      ? { engagementId: resultId as Id<"landingEngagements">, visitorToken }
      : "skip"
  );
  const activeThread =
    realtimeThread && thread && thread.messages.length > realtimeThread.messages.length
      ? thread
      : realtimeThread ?? thread;

  useEffect(() => {
    try {
      window.localStorage.setItem("edumyles_contact_profile", JSON.stringify(profile));
    } catch {
      // Local storage is optional.
    }
  }, [profile]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [activeThread?.messages.length, status]);

  const selectedTopic = useMemo(() => getContactTopic(topicId), [topicId]);
  const pagePath = typeof window !== "undefined" ? window.location.pathname : undefined;
  const composedMessage = buildContactMessage({ profile, topicId, message, pagePath });
  const whatsappUrl = buildWhatsAppUrl(composedMessage);
  const hasActiveChat = mode === "chat" && Boolean(resultId && visitorToken);

  function updateProfile(field: keyof ContactProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function updateTopic(nextTopicId: string) {
    setTopicId(nextTopicId as ContactTopicId);
    setMessage(getContactTopic(nextTopicId).prompt);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const payload = {
      ...profile,
      topic: selectedTopic.label,
      message,
      pagePath: window.location.pathname,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
      marketingAttribution: readAttribution(),
    };

    try {
      if (mode === "whatsapp") {
        const response = await fetch("/api/whatsapp/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, composedWhatsAppMessage: composedMessage, whatsappUrl }),
        });
        const result = await response.json().catch(() => ({}));
        if (result?.engagementId) setResultId(result.engagementId);
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        setStatus("sent");
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error ?? "Unable to send message");
      if (result?.engagementId) setResultId(result.engagementId);
      if (result?.visitorToken) setVisitorToken(result.visitorToken);
      setThread({
        chatStatus: "waiting",
        messages: [
          { sender: "visitor", body: message, authorName: profile.name, createdAt: Date.now() },
          {
            sender: "system",
            body: "Thanks. Your chat is open and an EduMyles specialist can join shortly.",
            authorName: "EduMyles",
            createdAt: Date.now() + 1,
          },
        ],
      });
      setStatus("sent");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reply.trim() || !resultId || !visitorToken) return;
    const body = reply.trim();
    setReply("");
    setThread({
      chatStatus: activeThread?.chatStatus ?? "waiting",
      agentName: activeThread?.agentName,
      messages: [
        ...(activeThread?.messages ?? []),
        { sender: "visitor", body, authorName: profile.name, createdAt: Date.now() },
      ],
    });

    try {
      await fetch("/api/chat/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engagementId: resultId, visitorToken, message: body }),
      });
    } catch {
      setThread((current) => ({
        chatStatus: current?.chatStatus ?? "waiting",
        agentName: current?.agentName,
        messages: [
          ...(current?.messages ?? []),
          {
            sender: "system",
            body: "We could not send that message. Please try again.",
            authorName: "EduMyles",
            createdAt: Date.now(),
          },
        ],
      }));
    }
  }

  const disabled = status === "sending" || !profile.name.trim() || !message.trim();

  return (
    <>
        <div className={launcherClass(mode)}>
          <div className="border-b border-border px-5 py-4 text-white" style={{ background: "var(--platform-chrome)" }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-card/10">
                    {mode === "whatsapp" ? <MessageCircle className="h-4 w-4" /> : <MessagesSquare className="h-4 w-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{mode === "whatsapp" ? "WhatsApp EduMyles" : "EduMyles live chat"}</p>
                    <p className="text-xs text-white/55">
                      {mode === "whatsapp" ? "Send a complete prefilled message." : hasActiveChat ? "Stay here for replies." : "Start a secure visitor chat."}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-1 text-white/70 hover:bg-card/10 hover:text-white"
                aria-label="Close contact form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-card/[0.06] px-3 py-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Your contact details are used only so our team can respond accurately.
            </div>
          </div>

          {hasActiveChat ? (
            <div className="bg-background">
              <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {activeThread?.chatStatus === "active" ? `${activeThread.agentName ?? "EduMyles"} joined` : "Waiting for a specialist"}
                  </p>
                  <p className="text-xs text-muted-foreground">Reference: {resultId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResultId(null);
                    setVisitorToken(null);
                    setThread(null);
                    setStatus("idle");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  New chat
                </button>
              </div>
              <div ref={transcriptRef} className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-4">
                {(activeThread?.messages ?? []).map((item, index) => (
                  <div
                    key={`${item.createdAt}-${index}`}
                    className={[
                      "flex",
                      item.sender === "visitor" ? "justify-end" : item.sender === "system" ? "justify-center" : "justify-start",
                    ].join(" ")}
                  >
                    {item.sender === "system" ? (
                      <p className="max-w-[90%] rounded-full bg-card px-3 py-1.5 text-center text-xs text-muted-foreground ring-1 ring-border">
                        {item.body}
                      </p>
                    ) : (
                      <div
                        className={[
                          "max-w-[82%] rounded-xl px-3.5 py-2 text-sm leading-6 shadow-sm",
                          item.sender === "visitor"
                            ? "rounded-br-sm bg-emerald-700 text-white"
                            : "rounded-bl-sm border border-border bg-card text-card-foreground",
                        ].join(" ")}
                      >
                        {item.sender === "agent" && <p className="mb-1 text-[11px] font-semibold text-primary">{item.authorName ?? "EduMyles"}</p>}
                        <p className="whitespace-pre-wrap">{item.body}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="border-t border-border bg-card p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-5 text-foreground outline-none focus:border-primary"
                    placeholder="Type your reply..."
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:bg-muted disabled:text-muted-foreground"
                    aria-label="Send chat reply"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : status === "sent" ? (
            <div className="p-6">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {mode === "whatsapp" ? "WhatsApp message prepared" : "Message received"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {mode === "whatsapp"
                  ? "WhatsApp should open with your full message prefilled. The EduMyles team will follow up from there."
                  : "Your live chat is open. Keep this window here for replies from the EduMyles team."}
              </p>
              {resultId && <p className="mt-3 text-xs text-muted-foreground">Reference: {resultId}</p>}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="max-h-[72vh] space-y-4 overflow-y-auto bg-card p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["name", "Name", "Your name", true],
                  ["phone", "Phone", "+254...", false],
                  ["email", "Email", "name@school.com", false],
                  ["country", "Country", "Kenya", false],
                  ["schoolName", "School", "School name", false],
                  ["role", "Role", "Director, principal...", false],
                ].map(([field, label, placeholder, required]) => (
                  <label key={field as string} className="text-xs font-semibold text-foreground">
                    {label}
                    <input
                      required={Boolean(required)}
                      type={field === "email" ? "email" : "text"}
                      value={profile[field as keyof ContactProfile]}
                      onChange={(event) => updateProfile(field as keyof ContactProfile, event.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:bg-card"
                      placeholder={placeholder as string}
                    />
                  </label>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-foreground">What do you need?</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONTACT_TOPICS.map((topic) => (
                    <button
                      type="button"
                      key={topic.id}
                      onClick={() => updateTopic(topic.id)}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition",
                        topicId === topic.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:border-primary",
                      ].join(" ")}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-semibold text-foreground">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-primary focus:bg-card"
                />
              </label>

              {mode === "whatsapp" && (
                <div className="rounded-lg border border-border bg-muted px-3 py-2 text-xs leading-5 text-foreground">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  WhatsApp will open with your profile and message already filled in.
                </div>
              )}

              {status === "error" && (
                <p className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground">
                  We could not send this right now. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={disabled}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
              >
                {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "whatsapp" ? "Open WhatsApp with message" : "Start live chat"}
              </button>
            </form>
          )}
        </div>
    </>
  );
}
