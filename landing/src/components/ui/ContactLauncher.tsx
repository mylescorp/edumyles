"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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
    "fixed inset-x-4 bottom-24 z-[9997] mx-auto max-w-[460px] overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_24px_70px_-28px_rgba(15,23,42,0.55)] md:mx-0",
    mode === "whatsapp" ? "md:left-8 md:right-auto" : "md:left-auto md:right-8",
  ].join(" ");
}

export default function ContactLauncher() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ContactMode>("chat");
  const [profile, setProfile] = useState<ContactProfile>(EMPTY_CONTACT_PROFILE);
  const [topicId, setTopicId] = useState<ContactTopicId>(CONTACT_TOPICS[0].id);
  const [message, setMessage] = useState<string>(CONTACT_TOPICS[0].prompt);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [resultId, setResultId] = useState<string | null>(null);
  const [visitorToken, setVisitorToken] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [reply, setReply] = useState("");
  const transcriptRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("edumyles_contact_profile");
      if (saved) setProfile({ ...EMPTY_CONTACT_PROFILE, ...JSON.parse(saved) });
    } catch {
      // Local storage is optional.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("edumyles_contact_profile", JSON.stringify(profile));
    } catch {
      // Local storage is optional.
    }
  }, [profile]);

  useEffect(() => {
    if (!resultId || !visitorToken || mode !== "chat" || !open) return;

    let cancelled = false;
    async function loadThread() {
      try {
        const response = await fetch(
          `/api/chat/thread?engagementId=${encodeURIComponent(resultId!)}&visitorToken=${encodeURIComponent(visitorToken!)}`
        );
        const result = await response.json().catch(() => ({}));
        if (!cancelled && response.ok && result.thread) {
          setThread(result.thread);
        }
      } catch {
        // Polling should stay quiet for visitors.
      }
    }

    loadThread();
    const interval = window.setInterval(loadThread, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [resultId, visitorToken, mode, open]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [thread?.messages.length, status]);

  const selectedTopic = useMemo(() => getContactTopic(topicId), [topicId]);
  const pagePath = typeof window !== "undefined" ? window.location.pathname : undefined;
  const composedMessage = buildContactMessage({ profile, topicId, message, pagePath });
  const whatsappUrl = buildWhatsAppUrl(composedMessage);
  const hasActiveChat = mode === "chat" && Boolean(resultId && visitorToken);

  function openPanel(nextMode: ContactMode) {
    setMode(nextMode);
    setOpen(true);
    setStatus("idle");
    if (nextMode === "whatsapp") {
      setResultId(null);
      setVisitorToken(null);
      setThread(null);
    }
  }

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
    setThread((current) => ({
      chatStatus: current?.chatStatus ?? "waiting",
      agentName: current?.agentName,
      messages: [
        ...(current?.messages ?? []),
        { sender: "visitor", body, authorName: profile.name, createdAt: Date.now() },
      ],
    }));

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
      <div className="fixed bottom-6 left-5 z-[9996]">
        <button
          type="button"
          onClick={() => openPanel("whatsapp")}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_40px_-18px_rgba(37,211,102,0.9)] ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[#20bd5b] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
          aria-label="Open WhatsApp message form"
        >
          <MessageCircle className="h-6 w-6 transition group-hover:scale-105" />
        </button>
      </div>

      <div className="fixed bottom-6 right-5 z-[9996]">
        <button
          type="button"
          onClick={() => openPanel("chat")}
          className="group flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-[0_18px_42px_-20px_rgba(15,23,42,0.9)] ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/30"
          aria-label="Open live chat"
        >
          <MessagesSquare className="h-5 w-5 transition group-hover:scale-105" />
        </button>
      </div>

      {open && (
        <div className={launcherClass(mode)}>
          <div className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
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
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
                aria-label="Close contact form"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white/70">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Your contact details are used only so our team can respond accurately.
            </div>
          </div>

          {hasActiveChat ? (
            <div className="bg-slate-50">
              <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {thread?.chatStatus === "active" ? `${thread.agentName ?? "EduMyles"} joined` : "Waiting for a specialist"}
                  </p>
                  <p className="text-xs text-slate-500">Reference: {resultId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResultId(null);
                    setVisitorToken(null);
                    setThread(null);
                    setStatus("idle");
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-950"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  New chat
                </button>
              </div>
              <div ref={transcriptRef} className="max-h-[360px] space-y-3 overflow-y-auto px-5 py-4">
                {(thread?.messages ?? []).map((item, index) => (
                  <div
                    key={`${item.createdAt}-${index}`}
                    className={[
                      "flex",
                      item.sender === "visitor" ? "justify-end" : item.sender === "system" ? "justify-center" : "justify-start",
                    ].join(" ")}
                  >
                    {item.sender === "system" ? (
                      <p className="max-w-[90%] rounded-full bg-white px-3 py-1.5 text-center text-xs text-slate-500 ring-1 ring-slate-200">
                        {item.body}
                      </p>
                    ) : (
                      <div
                        className={[
                          "max-w-[82%] rounded-xl px-3.5 py-2 text-sm leading-6 shadow-sm",
                          item.sender === "visitor"
                            ? "rounded-br-sm bg-emerald-700 text-white"
                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-800",
                        ].join(" ")}
                      >
                        {item.sender === "agent" && <p className="mb-1 text-[11px] font-semibold text-emerald-700">{item.authorName ?? "EduMyles"}</p>}
                        <p className="whitespace-pre-wrap">{item.body}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={sendReply} className="border-t border-slate-200 bg-white p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    rows={2}
                    className="min-h-11 flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-5 outline-none focus:border-emerald-600"
                    placeholder="Type your reply..."
                  />
                  <button
                    type="submit"
                    disabled={!reply.trim()}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-700 text-white transition hover:bg-emerald-800 disabled:bg-slate-300"
                    aria-label="Send chat reply"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          ) : status === "sent" ? (
            <div className="p-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                {mode === "whatsapp" ? "WhatsApp message prepared" : "Message received"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "whatsapp"
                  ? "WhatsApp should open with your full message prefilled. The EduMyles team will follow up from there."
                  : "Your live chat is open. Keep this window here for replies from the EduMyles team."}
              </p>
              {resultId && <p className="mt-3 text-xs text-slate-500">Reference: {resultId}</p>}
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="max-h-[72vh] space-y-4 overflow-y-auto bg-white p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["name", "Name", "Your name", true],
                  ["phone", "Phone", "+254...", false],
                  ["email", "Email", "name@school.com", false],
                  ["country", "Country", "Kenya", false],
                  ["schoolName", "School", "School name", false],
                  ["role", "Role", "Director, principal...", false],
                ].map(([field, label, placeholder, required]) => (
                  <label key={field as string} className="text-xs font-semibold text-slate-700">
                    {label}
                    <input
                      required={Boolean(required)}
                      type={field === "email" ? "email" : "text"}
                      value={profile[field as keyof ContactProfile]}
                      onChange={(event) => updateProfile(field as keyof ContactProfile, event.target.value)}
                      className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 text-sm outline-none transition focus:border-emerald-600 focus:bg-white"
                      placeholder={placeholder as string}
                    />
                  </label>
                ))}
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold text-slate-700">What do you need?</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONTACT_TOPICS.map((topic) => (
                    <button
                      type="button"
                      key={topic.id}
                      onClick={() => updateTopic(topic.id)}
                      className={[
                        "rounded-lg border px-3 py-2 text-left text-xs font-semibold transition",
                        topicId === topic.id
                          ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                      ].join(" ")}
                    >
                      {topic.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm leading-6 outline-none transition focus:border-emerald-600 focus:bg-white"
                />
              </label>

              {mode === "whatsapp" && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-900">
                  <Sparkles className="mr-1 inline h-3.5 w-3.5" />
                  WhatsApp will open with your profile and message already filled in.
                </div>
              )}

              {status === "error" && (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  We could not send this right now. Please try again.
                </p>
              )}

              <button
                type="submit"
                disabled={disabled}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {status === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "whatsapp" ? "Open WhatsApp with message" : "Start live chat"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
