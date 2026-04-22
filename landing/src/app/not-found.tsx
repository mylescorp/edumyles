import type { Metadata } from "next";
import Link from "next/link";
import { Home, Zap, Tag, BookOpen, Mail, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "404 — Page Not Found | EduMyles",
};

const quickLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Features", href: "/features", icon: Zap },
  { label: "Pricing", href: "/pricing", icon: Tag },
  { label: "Blog", href: "/blog", icon: BookOpen },
  { label: "Contact", href: "/contact", icon: Mail },
  { label: "Case Studies", href: "/case-studies", icon: FileText },
];

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden"
      style={{ background: "#061A12", borderTop: "3px solid #E8A020" }}
    >
      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.03) 25%,rgba(232,160,32,0.03) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.03) 75%,rgba(232,160,32,0.03) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.03) 25%,rgba(232,160,32,0.03) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.03) 75%,rgba(232,160,32,0.03) 76%,transparent 77%)`,
          backgroundSize: "50px 50px",
        }}
      />

      {/* Giant 404 watermark */}
      <div
        className="absolute select-none pointer-events-none font-display font-bold"
        style={{
          fontSize: "clamp(150px, 30vw, 280px)",
          color: "rgba(232,160,32,0.07)",
          lineHeight: 1,
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          whiteSpace: "nowrap",
        }}
        aria-hidden="true"
      >
        404
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[640px] w-full text-center">
        {/* Logo */}
        <Link
          href="/"
          className="inline-flex items-center gap-3 mb-10 no-underline"
          aria-label="EduMyles home"
        >
          <div
            className="w-12 h-12 flex items-center justify-center rounded-[14px] font-display font-bold text-2xl"
            style={{
              background: "linear-gradient(135deg,#0F4C2A,#1A7A4A)",
              border: "2px solid #E8A020",
              color: "#E8A020",
            }}
          >
            E
          </div>
          <span className="font-display font-bold text-[20px] text-white">EduMyles</span>
        </Link>

        <h1
          className="font-display font-bold text-white mb-4"
          style={{ fontSize: "clamp(2rem,5vw,3rem)" }}
        >
          Page not found
        </h1>
        <p
          className="font-jakarta text-[16px] leading-[1.8] mb-10"
          style={{ color: "#90CAF9", maxWidth: 480, margin: "0 auto 2.5rem" }}
        >
          The page you&apos;re looking for has moved, been removed, or doesn&apos;t exist.
          Let&apos;s get you back on track.
        </p>

        {/* Quick links */}
        <p
          className="font-jakarta font-semibold text-[12px] uppercase tracking-[2px] mb-5"
          style={{ color: "#6B9E83" }}
        >
          Where would you like to go?
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 no-underline transition-all duration-200 group"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="w-8 h-8 rounded-[8px] flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(232,160,32,0.1)" }}
              >
                <Icon className="w-4 h-4" strokeWidth={1.5} style={{ color: "#E8A020" }} />
              </div>
              <span className="font-jakarta font-medium text-[13px] text-white">{label}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-8 py-4 rounded-[50px] no-underline"
          style={{ background: "#E8A020", color: "#061A12" }}
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
