"use client";

import { useState, useRef, useEffect } from "react";

type Role = "bot" | "user";
interface Message {
  id: number;
  role: Role;
  text: string;
}

const WHATSAPP_URL =
  "https://wa.me/254743993715?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20EduMyles";

let _id = 0;
const uid = () => ++_id;

const BOT_AVATAR = (
  <div
    className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
    style={{ background: "#0F4C2A", color: "#E8A020" }}
  >
    E
  </div>
);

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"name" | "chat">("name");
  const [visitorName, setVisitorName] = useState("");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "bot",
      text: "👋 Hi there! Welcome to EduMyles. What's your name?",
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function addMessage(role: Role, text: string) {
    setMessages((prev) => [...prev, { id: uid(), role, text }]);
  }

  function botReply(text: string, delay = 600) {
    setTimeout(() => addMessage("bot", text), delay);
  }

  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = input.trim();
    if (!name) return;
    setVisitorName(name);
    addMessage("user", name);
    setInput("");
    setStep("chat");
    botReply(
      `Nice to meet you, ${name}! 😊 How can I help you today? You can ask about features, pricing, onboarding — anything.`
    );
  }

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    addMessage("user", text);
    setInput("");
    setLoading(true);

    try {
      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: visitorName, message: text }),
      });
    } catch {
      // silently fail — user still sees the optimistic reply
    }

    setLoading(false);
    setSent(true);
    botReply(
      `Thanks, ${visitorName}! 🙌 Our team has received your message and will get back to you shortly. For a faster response, continue on WhatsApp.`,
      700
    );
  }

  return (
    <>
      {/* Chat toggle button */}
      <button
        aria-label={open ? "Close chat" : "Open live chat"}
        onClick={() => setOpen((v) => !v)}
        className="fixed z-[9998] flex items-center justify-center text-white transition-all duration-300 shadow-lg"
        style={{
          bottom: "5.5rem",
          right: "2rem",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: open ? "#061A12" : "#0F4C2A",
          border: "2px solid #E8A020",
          boxShadow: "0 4px 16px rgba(6,26,18,0.25)",
        }}
        onMouseEnter={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = "#061A12";
        }}
        onMouseLeave={(e) => {
          if (!open) (e.currentTarget as HTMLButtonElement).style.background = "#0F4C2A";
        }}
      >
        {open ? (
          /* X icon */
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          /* Chat bubble icon */
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
            <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2zm-2 10H6v-2h12v2zm0-3H6V7h12v2z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      <div
        role="dialog"
        aria-label="Live chat"
        aria-hidden={!open}
        className="fixed z-[9997] flex flex-col overflow-hidden transition-all duration-300"
        style={{
          bottom: "10rem",
          right: "2rem",
          width: "340px",
          maxHeight: open ? "480px" : "0px",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          borderRadius: "16px",
          boxShadow: "0 8px 40px rgba(6,26,18,0.22)",
          border: "1.5px solid #E8A020",
          background: "#ffffff",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "#061A12" }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
            style={{ background: "#0F4C2A", border: "2px solid #E8A020", color: "#E8A020", fontFamily: "var(--font-playfair)" }}
          >
            E
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-[14px] leading-tight">EduMyles Support</p>
            <p className="text-[11px] leading-tight flex items-center gap-1" style={{ color: "#6B9E83" }}>
              <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
              Online — replies quickly
            </p>
          </div>
          <button
            aria-label="Close chat"
            onClick={() => setOpen(false)}
            className="text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ background: "#F7FBF9" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {msg.role === "bot" && BOT_AVATAR}
              <div
                className="max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed"
                style={
                  msg.role === "bot"
                    ? { background: "#ffffff", color: "#061A12", border: "1px solid #E5E7EB" }
                    : { background: "#061A12", color: "#ffffff" }
                }
              >
                {msg.text}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-2 items-end">
              {BOT_AVATAR}
              <div
                className="flex items-center gap-1 px-3 py-2 rounded-2xl"
                style={{ background: "#ffffff", border: "1px solid #E5E7EB" }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {sent && (
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 no-underline py-2 px-4 rounded-xl text-[13px] font-semibold transition-opacity hover:opacity-90 mt-1"
              style={{ background: "#25D366", color: "#ffffff" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Continue on WhatsApp
            </a>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {!sent && (
          <form
            onSubmit={step === "name" ? handleNameSubmit : handleChatSubmit}
            className="flex items-center gap-2 px-3 py-2 border-t flex-shrink-0"
            style={{ borderColor: "#E5E7EB", background: "#ffffff" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={step === "name" ? "Your name…" : "Type a message…"}
              disabled={loading}
              className="flex-1 min-w-0 text-[13px] outline-none bg-transparent py-1"
              style={{ color: "#061A12" }}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40"
              style={{ background: "#061A12" }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white" aria-hidden="true">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </form>
        )}

        {sent && (
          <div
            className="text-center text-[11px] px-4 py-2 flex-shrink-0 border-t"
            style={{ borderColor: "#E5E7EB", color: "#6B7280" }}
          >
            Powered by EduMyles · <a href="/contact" className="underline hover:text-[#061A12]">Full contact page</a>
          </div>
        )}
      </div>
    </>
  );
}
