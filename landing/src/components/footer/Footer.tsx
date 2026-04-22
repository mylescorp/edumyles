"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ShieldCheck,
  Lock,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Product column (with subtitles, like MylesCorp layout)

const PRODUCT_LINKS = [
  { label: "Student Information", sub: "Admissions & Profiles" },
  { label: "Fee & Finance", sub: "M-Pesa, billing, receipts" },
  { label: "Timetabling & HR", sub: "Staff, payroll & scheduling" },
  { label: "Exams & Reporting", sub: "KCSE, CBC, custom reports" },
  { label: "Parent Portal", sub: "Live updates & fee alerts" },
  { label: "Integrations", sub: "Connect your favourite tools" },
  { label: "Roadmap", sub: "What we're building next" },
];

const PRODUCT_HREFS = [
  "/features",
  "/features#fees",
  "/features#hr",
  "/features#exams",
  "/portal/parent",
  "/integrations",
  "/roadmap",
];

// Solutions column

const SOLUTIONS_LINKS = [
  { label: "Primary Schools", href: "/solutions/primary-schools" },
  { label: "Secondary Schools", href: "/solutions/secondary-schools" },
  { label: "International Schools", href: "/solutions/international-schools" },
  { label: "School Groups", href: "/solutions/school-groups" },
  { label: "Case Studies", href: "/case-studies" },
];

// Partners column

const PARTNERS_LINKS = [
  { label: "Developers", href: "/apply/developer" },
  { label: "Affiliates", href: "/apply/affiliate" },
  { label: "Resellers", href: "/apply/reseller" },
  { label: "Partner Portal", href: "/portal" },
];

// Company column

const COMPANY_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Our Team", href: "/team" },
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" },
];

// Trust badges

type TrustBadge =
  | { icon: LucideIcon; emoji?: never; label: string }
  | { icon?: never; emoji: string; label: string };

const TRUST_BADGES: TrustBadge[] = [
  { icon: ShieldCheck, label: "SOC 2 Type I" },
  { emoji: "??", label: "Kenya DPA Compliant" },
  { icon: Lock, label: "256-bit Encrypted" },
  { icon: TrendingUp, label: "99.9% Uptime" },
];

// Social SVG icons

function IconLinkedIn() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function IconTwitterX() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconInstagram() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function IconTikTok() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    Icon: IconLinkedIn,
    href: "https://www.linkedin.com/company/mylescorptech/",
    color: "#0077B5",
  },
  {
    label: "Facebook",
    Icon: IconFacebook,
    href: "https://www.facebook.com/mylescorptech",
    color: "#1877F2",
  },
  {
    label: "Instagram",
    Icon: IconInstagram,
    href: "https://www.instagram.com/mylescorptech/",
    color: "#E1306C",
  },
  {
    label: "Twitter / X",
    Icon: IconTwitterX,
    href: "https://x.com/mylescorptech",
    color: "#ffffff",
  },
  {
    label: "YouTube",
    Icon: IconYouTube,
    href: "https://www.youtube.com/@mylescorptech",
    color: "#FF0000",
  },
  {
    label: "TikTok",
    Icon: IconTikTok,
    href: "https://www.tiktok.com/@edumyles_",
    color: "#ffffff",
  },
];

// Scroll-to-top button

function ScrollToTop() {
  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0 transition-all duration-200"
      style={{
        background: "rgba(232,160,32,0.12)",
        border: "1px solid rgba(232,160,32,0.25)",
        color: "#E8A020",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "#E8A020";
        el.style.color = "#061A12";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.background = "rgba(232,160,32,0.12)";
        el.style.color = "#E8A020";
      }}
    >
      <ChevronUp className="w-4 h-4" strokeWidth={2.5} />
    </button>
  );
}

// Newsletter strip

function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
    }, 900);
  };

  return (
    <div
      className="max-w-[1200px] mx-auto px-6 lg:px-16 py-10"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
        {/* Left: heading + description */}
        <div className="flex-1 min-w-0">
          <h3 className="font-jakarta font-bold text-[20px] text-white mb-1.5">Stay Connected</h3>
          <p className="font-jakarta text-[13px] leading-[1.8]" style={{ color: "#6B9E83" }}>
            Get the latest product updates, school management insights and education tips delivered
            to your inbox.{" "}
            <span className="font-semibold" style={{ color: "#E8A020" }}>
              No spam, ever.
            </span>
          </p>
        </div>

        {/* Right: form or success + social icons */}
        <div className="flex flex-col gap-5 w-full lg:w-auto">
          {/* Email form */}
          {subscribed ? (
            <div className="flex items-center gap-3">
              <CheckCircle2
                className="w-6 h-6 flex-shrink-0"
                strokeWidth={2}
                style={{ color: "#26A65B" }}
              />
              <div>
                <p className="font-jakarta font-bold text-[14px] text-white">
                  You&apos;re subscribed!
                </p>
                <p className="font-jakarta text-[12px]" style={{ color: "#6B9E83" }}>
                  First issue lands next month.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2 w-full lg:w-auto">
              <div
                className="relative flex-1 lg:w-[260px]"
                style={{
                  borderRadius: "8px",
                  boxShadow: focused ? "0 0 0 3px rgba(232,160,32,0.25)" : "none",
                  transition: "box-shadow 0.2s",
                }}
              >
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  strokeWidth={1.5}
                  style={{ color: focused ? "#E8A020" : "#6B9E83", transition: "color 0.2s" }}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="your@email.com"
                  className="w-full font-jakarta text-[13px] pl-9 pr-4 py-[11px] rounded-[8px] outline-none"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${focused ? "rgba(232,160,32,0.5)" : "rgba(255,255,255,0.10)"}`,
                    color: "#ffffff",
                    transition: "border-color 0.2s",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="group font-jakarta font-bold text-[13px] px-5 py-[11px] rounded-[8px] flex items-center gap-2 flex-shrink-0 transition-all duration-200"
                style={{
                  background: loading ? "rgba(232,160,32,0.6)" : "#E8A020",
                  color: "#061A12",
                  border: "none",
                  cursor: loading ? "wait" : "pointer",
                  minWidth: "100px",
                  justifyContent: "center",
                }}
                onMouseEnter={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#F5C453";
                }}
                onMouseLeave={(e) => {
                  if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#E8A020";
                }}
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-[#061A12] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight
                      className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1"
                      strokeWidth={2.5}
                    />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social icons row */}
          <div className="flex flex-col gap-2.5">
            <span
              className="font-jakarta font-bold uppercase tracking-[2px] text-[10px]"
              style={{ color: "#6B9E83" }}
            >
              Follow Us On Social Media
            </span>
            <div className="flex gap-2">
              {SOCIAL_LINKS.map(({ label, Icon, href, color }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`EduMyles on ${label}`}
                  title={label}
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center no-underline transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.09)",
                    color: "#6B9E83",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = `${color}20`;
                    el.style.borderColor = `${color}55`;
                    el.style.color = color;
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.background = "rgba(255,255,255,0.05)";
                    el.style.borderColor = "rgba(255,255,255,0.09)";
                    el.style.color = "#6B9E83";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Footer

export default function Footer() {
  return (
    <footer role="contentinfo" className="font-jakarta" style={{ background: "#061A12" }}>
      {/* Gold top accent */}
      <div
        style={{
          height: "3px",
          background: "linear-gradient(90deg, #1A7A4A 0%, #E8A020 50%, #1A7A4A 100%)",
        }}
      />

      {/* Main body: 5-column grid */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 pt-14 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Column 1: Brand */}
          <div>
            {/* Logo lockup */}
            <Link
              href="/"
              className="inline-flex items-center gap-3 mb-5 no-underline group"
              aria-label="EduMyles home"
            >
              <Image
                src="/logo-icon.svg"
                alt="EduMyles"
                width={44}
                height={44}
                className="flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
              />
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-display font-bold text-[18px]" style={{ color: "#D4AF37" }}>
                  EduMyles
                </span>
                <span
                  className="font-jakarta uppercase tracking-[2px] text-[8px] font-semibold"
                  style={{ color: "#E8A020" }}
                >
                  School Management
                </span>
              </div>
            </Link>

            {/* Description */}
            <p
              className="font-jakarta text-[12.5px] leading-[1.9] mb-5"
              style={{ color: "#6B9E83", maxWidth: "260px" }}
            >
              East Africa&apos;s leading school management platform &mdash; built for African
              schools, by people who understand African education.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2.5" style={{ color: "#6B9E83" }}>
              {[
                { Icon: Mail, text: "contact@edumyles.com" },
                { Icon: Phone, text: "+254 743 993 715" },
                { Icon: MapPin, text: "Nairobi, Kenya &middot; WesternHeights" },
                { Icon: Globe, text: "www.edumyles.com", href: "https://edumyles.com" },
              ].map(({ Icon, text, href }) =>
                href ? (
                  <a
                    key={text}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-jakarta text-[12.5px] no-underline transition-colors duration-200"
                    style={{ color: "#6B9E83" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83";
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      strokeWidth={1.5}
                      style={{ color: "#E8A020" }}
                    />
                    {text}
                  </a>
                ) : (
                  <span key={text} className="flex items-center gap-2 font-jakarta text-[12.5px]">
                    <Icon
                      className="w-3.5 h-3.5 flex-shrink-0"
                      strokeWidth={1.5}
                      style={{ color: "#E8A020" }}
                    />
                    {text}
                  </span>
                )
              )}
            </div>
          </div>

          {/* Column 2: Products */}
          <div>
            <h4
              className="font-jakarta font-bold uppercase tracking-[2.5px] text-[10px] mb-5"
              style={{ color: "#E8A020" }}
            >
              Products
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-3">
              {PRODUCT_LINKS.map((item, i) => (
                <li key={item.label}>
                  <Link
                    href={PRODUCT_HREFS[i] ?? "/"}
                    className="group no-underline flex flex-col gap-0.5"
                  >
                    <span
                      className="font-jakarta font-semibold text-[13px] transition-colors duration-200"
                      style={{ color: "#c8ddd4" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLSpanElement).style.color = "#E8A020";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLSpanElement).style.color = "#c8ddd4";
                      }}
                    >
                      {item.label}
                    </span>
                    <span className="font-jakarta text-[11px]" style={{ color: "#4a6b58" }}>
                      {item.sub}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Solutions */}
          <div>
            <h4
              className="font-jakarta font-bold uppercase tracking-[2.5px] text-[10px] mb-5"
              style={{ color: "#E8A020" }}
            >
              Solutions
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
              {SOLUTIONS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-jakarta text-[13px] no-underline inline-flex items-center gap-1.5 group transition-colors duration-200"
                    style={{ color: "#6B9E83" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83";
                    }}
                  >
                    <span
                      className="inline-block w-0 h-px transition-all duration-200 group-hover:w-3"
                      style={{ background: "#E8A020" }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Partners column */}
          <div>
            <h4
              className="font-jakarta font-bold uppercase tracking-[2.5px] text-[10px] mb-5"
              style={{ color: "#E8A020" }}
            >
              Partners
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
              {PARTNERS_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-jakarta text-[13px] no-underline inline-flex items-center gap-1.5 group transition-colors duration-200"
                    style={{ color: "#6B9E83" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83";
                    }}
                  >
                    <span
                      className="inline-block w-0 h-px transition-all duration-200 group-hover:w-3"
                      style={{ background: "#E8A020" }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company column */}
          <div>
            <h4
              className="font-jakarta font-bold uppercase tracking-[2.5px] text-[10px] mb-5"
              style={{ color: "#E8A020" }}
            >
              Company
            </h4>
            <ul className="list-none p-0 m-0 flex flex-col gap-[11px]">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="font-jakarta text-[13px] no-underline inline-flex items-center gap-1.5 group transition-colors duration-200"
                    style={{ color: "#6B9E83" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83";
                    }}
                  >
                    <span
                      className="inline-block w-0 h-px transition-all duration-200 group-hover:w-3"
                      style={{ background: "#E8A020" }}
                    />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16">
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />
      </div>

      {/* Newsletter + Social strip */}
      <NewsletterStrip />

      {/* Trust bar */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-4 flex flex-wrap justify-center gap-3">
        {TRUST_BADGES.map((badge) => (
          <span
            key={badge.label}
            className="font-jakarta text-[11px] px-3 py-[5px] rounded-full inline-flex items-center gap-1.5 transition-all duration-200"
            style={{
              background: "rgba(232,160,32,0.06)",
              border: "1px solid rgba(232,160,32,0.12)",
              color: "#6B9E83",
              cursor: "default",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLSpanElement;
              el.style.background = "rgba(232,160,32,0.12)";
              el.style.borderColor = "rgba(232,160,32,0.28)";
              el.style.color = "#E8A020";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLSpanElement;
              el.style.background = "rgba(232,160,32,0.06)";
              el.style.borderColor = "rgba(232,160,32,0.12)";
              el.style.color = "#6B9E83";
            }}
          >
            {badge.icon ? (
              <badge.icon className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.5} />
            ) : (
              <span>{badge.emoji}</span>
            )}
            {badge.label}
          </span>
        ))}
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Copyright */}
          <p className="font-jakarta text-[11.5px] order-2 sm:order-1" style={{ color: "#4a6b58" }}>
            &copy; 2026{" "}
            <a
              href="https://mylesoft.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{ color: "#6B9E83", textDecoration: "none" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#E8A020";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83";
              }}
            >
              MylesCorp Technologies Ltd
            </a>{" "}
            · All rights reserved.
          </p>

          {/* Legal links */}
          <div className="font-jakarta text-[11.5px] flex flex-wrap justify-center gap-5 order-1 sm:order-2">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Cookie Policy", href: "/cookies" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="no-underline transition-colors duration-200"
                style={{ color: "#4a6b58" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#E8A020";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#4a6b58";
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Scroll to top */}
          <div className="order-3 flex-shrink-0">
            <ScrollToTop />
          </div>
        </div>
      </div>
    </footer>
  );
}
