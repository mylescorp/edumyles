"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const NAV_COLUMNS = [
  {
    heading: "PRODUCT",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/pricing" },
      { label: "Changelog", href: "/changelog" },
      { label: "System Status", href: "/status" },
      { label: "Book a Demo", href: "#demo" },
    ],
  },
  {
    heading: "SOLUTIONS",
    links: [
      { label: "Primary Schools", href: "/solutions/primary-schools" },
      { label: "Secondary Schools", href: "/solutions/secondary-schools" },
      { label: "International Schools", href: "/solutions/international-schools" },
      { label: "School Groups", href: "/solutions/school-groups" },
      { label: "Parent Portal", href: "/portal/parent" },
    ],
  },
  {
    heading: "RESOURCES",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Partner Programme", href: "/partners" },
      { label: "Security", href: "/security" },
      { label: "Help Centre", href: "#" },
    ],
  },
  {
    heading: "COMPANY",
    links: [
      { label: "About", href: "/about" },
      { label: "Our Team", href: "/team" },
      { label: "Careers", href: "/team#careers" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy Policy", href: "/terms#privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

const TRUST_BADGES = [
  { icon: "🔒", label: "SOC 2 Type I" },
  { icon: "🇰🇪", label: "Kenya DPA Compliant" },
  { icon: "🔐", label: "256-bit Encrypted" },
  { icon: "⬆", label: "99.9% Uptime" },
];

// ─── SVG Social Icons ────────────────────────────────────────────────────────

function IconLinkedIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IconYouTube() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { label: "LinkedIn", Icon: IconLinkedIn, href: "https://linkedin.com/company/edumyles" },
  { label: "Twitter / X", Icon: IconTwitterX, href: "https://twitter.com/edumyles" },
  { label: "Facebook", Icon: IconFacebook, href: "#" },
  { label: "YouTube", Icon: IconYouTube, href: "#" },
];

// ─── Newsletter Strip ─────────────────────────────────────────────────────────

function NewsletterStrip() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
    }
  };

  return (
    <div
      style={{
        background: "#0F4C2A",
        borderTop: "1px solid rgba(232,160,32,0.15)",
        borderBottom: "1px solid rgba(232,160,32,0.15)",
      }}
    >
      <div
        className="max-w-[1200px] mx-auto px-6 lg:px-16 py-7 flex flex-col sm:flex-row items-start sm:items-center gap-6"
      >
        {/* Left: copy */}
        <div className="flex-1 min-w-0">
          <p
            className="font-jakarta font-bold text-[15px] text-white mb-1"
          >
            📬 Get the School Admin Newsletter
          </p>
          <p
            className="font-jakarta text-[13px] leading-[1.7]"
            style={{ color: "#6B9E83" }}
          >
            Monthly tips, product updates &amp; education insights for East African school leaders.
          </p>
        </div>

        {/* Right: form or confirmation */}
        {subscribed ? (
          <p
            className="font-jakarta font-semibold text-[14px] flex-shrink-0"
            style={{ color: "#E8A020" }}
          >
            ✓ You&apos;re subscribed!
          </p>
        ) : (
          <form
            onSubmit={handleSubscribe}
            className="flex gap-2 flex-shrink-0 w-full sm:w-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your school email"
              className="font-jakarta text-[13px] px-4 py-2.5 rounded-[8px] outline-none flex-1 sm:w-[220px]"
              style={{
                background: "transparent",
                border: "1px solid rgba(232,160,32,0.30)",
                color: "#ffffff",
              }}
            />
            <button
              type="submit"
              className="font-jakarta font-bold text-[13px] px-5 py-2.5 rounded-[8px] flex-shrink-0 transition-colors duration-200"
              style={{
                background: "#E8A020",
                color: "#061A12",
                border: "none",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#F5C453"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#E8A020"; }}
            >
              Subscribe →
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Footer Nav Column ────────────────────────────────────────────────────────

function FooterNavColumn({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4
        className="font-jakarta font-bold uppercase tracking-[2px] text-[10px] mb-4"
        style={{ color: "#E8A020" }}
      >
        {heading}
      </h4>
      <ul className="list-none p-0 m-0 flex flex-col gap-[10px]">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="font-jakarta font-medium text-[13px] no-underline transition-colors duration-200"
              style={{ color: "#6B9E83" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#E8A020"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83"; }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Footer Export ───────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer
      role="contentinfo"
      className="font-jakarta"
      style={{ background: "#061A12" }}
    >
      {/* 1. Newsletter strip */}
      <NewsletterStrip />

      {/* 2. Main footer body */}
      <div style={{ borderTop: "3px solid #E8A020" }}>
        <div className="max-w-[1200px] mx-auto px-6 lg:px-16 pt-16 pb-10">

          {/* 5-column grid: brand spans 2 cols on lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">

            {/* ── Column 1: Brand (spans 2 of 5 on lg) ── */}
            <div className="sm:col-span-2 lg:col-span-2">

              {/* Logo lockup */}
              <Link href="/" className="inline-flex items-center gap-3 mb-5 no-underline" aria-label="EduMyles — home">
                <div
                  className="w-10 h-10 flex items-center justify-center rounded-[10px] font-playfair font-bold text-xl flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg,#0F4C2A,#0C3020)",
                    border: "2px solid #E8A020",
                    color: "#E8A020",
                  }}
                >
                  E
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span
                    className="font-playfair font-bold text-[18px] text-white"
                  >
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

              {/* Tagline */}
              <p
                className="font-playfair italic text-[14px] mb-3"
                style={{ color: "#E8A020" }}
              >
                Empowering Schools. Elevating Learning.
              </p>

              {/* Description */}
              <p
                className="font-jakarta text-[12px] leading-[1.9] mb-5"
                style={{ color: "#6B9E83", maxWidth: "280px" }}
              >
                Transforming school administration across Kenya, Uganda, Tanzania, Rwanda, and Zambia. Built for African schools, by people who understand African education.
              </p>

              {/* Contact block */}
              <div
                className="font-jakarta text-[12px] leading-[1.9] flex flex-col gap-0.5"
                style={{ color: "#6B9E83" }}
              >
                <span>📞 +254 743 993 715</span>
                <span>✉ contact@edumyles.com</span>
                <span>📍 Nairobi, Kenya · WesternHeights</span>
              </div>

              {/* Social icons */}
              <div className="flex gap-2 mt-4">
                {SOCIAL_LINKS.map(({ label, Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`EduMyles on ${label}`}
                    className="w-8 h-8 rounded-[6px] flex items-center justify-center no-underline transition-colors duration-200"
                    style={{
                      background: "rgba(232,160,32,0.08)",
                      border: "1px solid rgba(232,160,32,0.15)",
                      color: "#6B9E83",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "rgba(232,160,32,0.20)";
                      el.style.color = "#E8A020";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = "rgba(232,160,32,0.08)";
                      el.style.color = "#6B9E83";
                    }}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* ── Columns 2–5: Nav ── */}
            {NAV_COLUMNS.map((col) => (
              <FooterNavColumn key={col.heading} heading={col.heading} links={col.links} />
            ))}
          </div>
        </div>
      </div>

      {/* 3. Divider */}
      <div
        className="max-w-[1200px] mx-auto px-6 lg:px-16"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      />

      {/* 4. Trust / certifications bar */}
      <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-5 flex flex-wrap justify-center gap-2">
        {TRUST_BADGES.map(({ icon, label }) => (
          <span
            key={label}
            className="font-jakarta text-[11px] px-[10px] py-[4px] rounded-full"
            style={{
              background: "rgba(232,160,32,0.06)",
              border: "1px solid rgba(232,160,32,0.12)",
              color: "#6B9E83",
            }}
          >
            {icon} {label}
          </span>
        ))}
      </div>

      {/* 5. Bottom bar */}
      <div
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-16 py-5 flex flex-col lg:flex-row items-center justify-between gap-3 text-center lg:text-left">

          {/* Left: tagline */}
          <p
            className="font-playfair italic text-[13px] order-1"
            style={{ color: "#E8A020" }}
          >
            &ldquo;School Management, Simplified&rdquo;
          </p>

          {/* Center: copyright */}
          <p
            className="font-jakarta text-[11px] order-3 lg:order-2"
            style={{ color: "#6B9E83" }}
          >
            © 2026 EduMyles · A MylesCorp Technologies Ltd Product · All Rights Reserved
          </p>

          {/* Right: legal links */}
          <div className="font-jakarta text-[11px] flex gap-4 order-2 lg:order-3" style={{ color: "#6B9E83" }}>
            {[
              { label: "Privacy", href: "/terms#privacy" },
              { label: "Terms", href: "/terms" },
              { label: "Contact", href: "/contact" },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="no-underline transition-colors duration-200"
                style={{ color: "#6B9E83" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#E8A020"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#6B9E83"; }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
