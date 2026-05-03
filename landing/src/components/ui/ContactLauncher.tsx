"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, MessageCircle, Send, X } from "lucide-react";
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

export default function ContactLauncher() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ContactMode>("chat");
  const [profile, setProfile] = useState<ContactProfile>(EMPTY_CONTACT_PROFILE);
  const [topicId, setTopicId] = useState<ContactTopicId>(CONTACT_TOPICS[0].id);
  const [message, setMessage] = useState<string>(CONTACT_TOPICS[0].prompt);
  const [status, setStatus] = useState<SubmitState>("idle");
  const [resultId, setResultId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("edumyles_contact_profile");
      if (saved) setProfile({ ...EMPTY_CONTACT_PROFILE, ...JSON.parse(saved) });
    } catch {
      // Ignore invalid local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem("edumyles_contact_profile", JSON.stringify(profile));
    } catch {
      // Storage is optional.
    }
  }, [profile]);

  const selectedTopic = useMemo(() => getContactTopic(topicId), [topicId]);
  const pagePath = typeof window !== "undefined" ? window.location.pathname : undefined;
  const composedMessage = buildContactMessage({ profile, topicId, message, pagePath });
  const whatsappUrl = buildWhatsAppUrl(composedMessage);

  function openPanel(nextMode: ContactMode) {
    setMode(nextMode);
    setOpen(true);
    setStatus("idle");
    setResultId(null);
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
          body: JSON.stringify({
            ...payload,
            composedWhatsAppMessage: composedMessage,
            whatsappUrl,
          }),
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
      setStatus("sent");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  const disabled = status === "sending" || !profile.name.trim() || !message.trim();

  return (
    <>
      <div className="fixed bottom-6 left-5 z-[9996]">
        <button
          type="button"
          onClick={() => openPanel("whatsapp")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:bg-[#20bd5b] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30"
          aria-label="Open WhatsApp message form"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>

      <div className="fixed bottom-6 right-5 z-[9996]">
        <button
          type="button"
          onClick={() => openPanel("chat")}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-white shadow-xl ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-400/30"
          aria-label="Open live chat form"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>

      {open && (
        <div
          className={[
            "fixed inset-x-4 bottom-24 z-[9997] mx-auto max-w-[440px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl md:mx-0",
            mode === "whatsapp" ? "md:left-8 md:right-auto" : "md:left-auto md:right-8",
          ].join(" ")}
        >
          <div className="flex items-start justify-between border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
            <div>
              <p className="text-sm font-semibold">
                {mode === "whatsapp" ? "WhatsApp EduMyles" : "Live chat"}
              </p>
              <p className="mt-1 text-xs text-white/65">
                Your details are sent with the message so our team can follow up properly.
              </p>
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

          {status === "sent" ? (
            <div className="p-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              <h2 className="mt-4 text-lg font-semibold text-slate-950">
                {mode === "whatsapp" ? "WhatsApp message prepared" : "Message received"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {mode === "whatsapp"
                  ? "WhatsApp should open with your full message prefilled. The EduMyles team will follow up from there."
                  : "Your live-chat request has been received. The EduMyles team will follow up shortly."}
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
            <form onSubmit={submit} className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-700">
                  Name
                  <input
                    required
                    value={profile.name}
                    onChange={(event) => updateProfile("name", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="Your name"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Phone
                  <input
                    value={profile.phone}
                    onChange={(event) => updateProfile("phone", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="+254..."
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Email
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(event) => updateProfile("email", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="name@school.com"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Country
                  <input
                    value={profile.country}
                    onChange={(event) => updateProfile("country", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="Kenya"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  School
                  <input
                    value={profile.schoolName}
                    onChange={(event) => updateProfile("schoolName", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="School name"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-700">
                  Role
                  <input
                    value={profile.role}
                    onChange={(event) => updateProfile("role", event.target.value)}
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                    placeholder="Director, principal..."
                  />
                </label>
              </div>

              <label className="block text-xs font-semibold text-slate-700">
                What do you need?
                <select
                  value={topicId}
                  onChange={(event) => updateTopic(event.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-600"
                >
                  {CONTACT_TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-semibold text-slate-700">
                Message
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={5}
                  className="mt-1 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm leading-6 outline-none focus:border-emerald-600"
                />
              </label>

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
                {mode === "whatsapp" ? "Open WhatsApp with message" : "Send live chat message"}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
