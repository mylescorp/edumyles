import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Settings, BarChart2, Shield, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy — EduMyles",
  description:
    "EduMyles Cookie Policy. Learn what cookies we use and how to manage your preferences.",
};

const sections = [
  { id: "what", label: "What Are Cookies" },
  { id: "table", label: "Cookies We Use" },
  { id: "essential", label: "Essential vs Optional" },
  { id: "third", label: "Third-Party" },
  { id: "manage", label: "Manage Preferences" },
];

export default function CookiesPage() {
  return (
    <div style={{ color: "var(--color-text-default)" }}>
      {/* Hero */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "var(--color-surface-default)",
          borderTop: "3px solid var(--color-action-primary)",
          padding: "5rem 2rem 4rem",
          minHeight: "320px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(0deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 25%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 26%,transparent 27%,transparent 74%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 75%,color-mix(in srgb, var(--color-action-primary) 4%, transparent) 76%,transparent 77%)`,
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[860px] mx-auto w-full">
          <div
            className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-5 px-4 py-2 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--color-action-primary) 12%, transparent)",
              border: "1px solid var(--color-text-on-primary-subtle)",
              color: "var(--color-text-on-primary-subtle)",
            }}
          >
            <Cookie className="w-3.5 h-3.5" strokeWidth={2} />
            Cookie Policy
          </div>
          <h1
            className="font-display font-bold leading-tight mb-4"
            style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "var(--color-text-default)" }}
          >
            We use cookies{" "}
            <em className="italic" style={{ color: "var(--color-text-on-primary-subtle)" }}>
              fairly.
            </em>
          </h1>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "var(--color-text-muted)" }}>
            Last updated: March 2026 · Effective: 1 January 2025
          </p>
          {/* Quick nav */}
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="font-jakarta font-medium text-[12px] px-4 py-2 rounded-full no-underline transition-colors duration-200"
                style={{
                  background: "color-mix(in srgb, var(--color-surface-default) 7%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--color-surface-default) 12%, transparent)",
                  color: "var(--color-text-muted)",
                }}
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[860px] mx-auto px-6 py-16 flex flex-col gap-14">
        {/* Intro */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
        >
          <p className="font-jakarta text-[14px] leading-[1.9]" style={{ color: "var(--color-text-muted)" }}>
            This Cookie Policy explains what cookies are, which cookies EduMyles uses, and how you
            can control them. We keep our cookie usage to the minimum necessary to run the platform
            securely and improve your experience. We do <strong>not</strong> use advertising
            cookies, tracking pixels, or sell cookie data to any third party.
          </p>
        </div>

        {/* 1 — What Are Cookies */}
        <section id="what" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Cookie className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              What Are Cookies?
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-jakarta text-[14px] leading-[1.85]" style={{ color: "var(--color-text-muted)" }}>
              Cookies are small text files placed on your device by websites you visit. They are
              widely used to make websites work, work more efficiently, and to provide information
              to the site owners.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                {
                  type: "Session cookies",
                  detail:
                    "Deleted when you close your browser. Used to keep you logged in during a browsing session.",
                },
                {
                  type: "Persistent cookies",
                  detail:
                    "Remain on your device for a set period. Used to remember your preferences across visits.",
                },
                {
                  type: "Third-party cookies",
                  detail:
                    "Set by services other than EduMyles (e.g. analytics providers). We use only privacy-respecting third parties.",
                },
              ].map((item) => (
                <div
                  key={item.type}
                  className="rounded-xl p-4"
                  style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
                >
                  <p
                    className="font-jakarta font-bold text-[13px] mb-1.5"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    {item.type}
                  </p>
                  <p
                    className="font-jakarta text-[12.5px] leading-[1.6]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "color-mix(in srgb, var(--color-action-primary) 6%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
              }}
            >
              <Shield
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
                style={{ color: "var(--color-text-on-primary-subtle)" }}
              />
              <p className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                EduMyles does <strong>not</strong> use tracking cookies, retargeting cookies,
                advertising cookies, or fingerprinting technologies. We will never use cookies to
                build profiles for ad targeting.
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 2 — Cookies We Use */}
        <section id="table" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Settings className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Cookies We Use
            </h2>
          </div>
          <p className="font-jakarta text-[14px] leading-[1.8] mb-5" style={{ color: "var(--color-text-muted)" }}>
            The following table lists every cookie set by EduMyles. We keep this list current — if
            we add a cookie we update this page.
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border-default)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--color-surface-default)" }}>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-4 py-3"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Cookie Name
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-4 py-3"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Purpose
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-4 py-3 hidden sm:table-cell"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Duration
                  </th>
                  <th
                    className="font-jakarta font-bold text-[12px] text-left px-4 py-3"
                    style={{ color: "var(--color-text-on-primary-subtle)" }}
                  >
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "em_session",
                    purpose:
                      "Maintains your authenticated session while using the platform. Required for login to work.",
                    duration: "Session",
                    type: "Essential",
                    typeColor: "var(--color-action-primary)",
                    typeBg: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                  },
                  {
                    name: "em_auth_token",
                    purpose:
                      "Stores your authentication token so you stay logged in between browser sessions.",
                    duration: "7 days",
                    type: "Essential",
                    typeColor: "var(--color-action-primary)",
                    typeBg: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                  },
                  {
                    name: "em_pref",
                    purpose:
                      "Saves your UI preferences such as sidebar state, theme selection, and dashboard layout.",
                    duration: "1 year",
                    type: "Preference",
                    typeColor: "var(--color-action-primary-text)",
                    typeBg: "color-mix(in srgb, var(--color-action-primary-text) 10%, transparent)",
                  },
                  {
                    name: "em_consent",
                    purpose:
                      "Records your cookie consent choice (accepted or rejected optional cookies) to avoid re-showing the banner.",
                    duration: "1 year",
                    type: "Essential",
                    typeColor: "var(--color-action-primary)",
                    typeBg: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)",
                  },
                  {
                    name: "_analytics",
                    purpose:
                      "Anonymous, aggregated usage analytics. No personal data is collected. Used to understand which features are most used.",
                    duration: "30 days",
                    type: "Analytics",
                    typeColor: "var(--color-status-warning-on-subtle)",
                    typeBg: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
                  },
                  {
                    name: "_ga",
                    purpose:
                      "Google Analytics aggregate traffic statistics. IP addresses are anonymised. No personal data is associated with this cookie.",
                    duration: "2 years",
                    type: "Analytics",
                    typeColor: "var(--color-status-warning-on-subtle)",
                    typeBg: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)",
                  },
                ].map(({ name, purpose, duration, type, typeColor, typeBg }, i) => (
                  <tr key={name} style={{ background: i % 2 === 0 ? "var(--color-surface-default)" : "var(--color-surface-sunken)" }}>
                    <td className="px-4 py-3 align-top">
                      <code
                        className="font-mono text-[12px] font-semibold"
                        style={{ color: "var(--color-action-primary)" }}
                      >
                        {name}
                      </code>
                    </td>
                    <td
                      className="font-jakarta text-[12.5px] leading-[1.6] px-4 py-3 align-top"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {purpose}
                    </td>
                    <td
                      className="font-jakarta text-[12.5px] px-4 py-3 align-top hidden sm:table-cell"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {duration}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className="font-jakarta font-semibold text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap"
                        style={{ background: typeBg, color: typeColor }}
                      >
                        {type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 3 — Essential vs Optional */}
        <section id="essential" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Shield className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Essential vs Optional Cookies
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--color-surface-page)", border: "2px solid var(--color-border-default)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-jakarta font-bold text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)", color: "var(--color-action-primary)" }}
                >
                  Essential
                </span>
                <span className="font-jakarta text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Always active
                </span>
              </div>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
                Essential cookies are strictly necessary for the platform to function. They enable
                core features such as authentication, session management, security, and your saved
                UI preferences. These cannot be disabled without breaking the platform.
              </p>
              <ul className="flex flex-col gap-1.5 mt-3">
                {["em_session", "em_auth_token", "em_pref", "em_consent"].map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-2 font-jakarta text-[12.5px]"
                    style={{ color: "var(--color-text-muted)", listStyle: "none" }}
                  >
                    <span style={{ color: "var(--color-action-primary)" }}>✓</span>
                    <code className="font-mono text-[12px]">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div
              className="rounded-xl p-5"
              style={{
                background: "color-mix(in_srgb,_var(--color-action-primary)_4%,_transparent)",
                border: "2px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="font-jakarta font-bold text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "color-mix(in srgb, var(--color-action-primary) 10%, transparent)", color: "var(--color-status-warning-on-subtle)" }}
                >
                  Analytics
                </span>
                <span className="font-jakarta text-[11px]" style={{ color: "var(--color-text-muted)" }}>
                  Optional — your choice
                </span>
              </div>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
                Analytics cookies collect <strong>anonymous, aggregate</strong> data about how users
                navigate the platform. No personal data is tied to these cookies. Disabling them
                does not affect your ability to use EduMyles — it only means we receive less
                information about usage patterns.
              </p>
              <ul className="flex flex-col gap-1.5 mt-3">
                {["_analytics", "_ga"].map((c) => (
                  <li
                    key={c}
                    className="flex items-center gap-2 font-jakarta text-[12.5px]"
                    style={{ color: "var(--color-text-muted)", listStyle: "none" }}
                  >
                    <span style={{ color: "var(--color-text-on-primary-subtle)" }}>○</span>
                    <code className="font-mono text-[12px]">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
            If you decline analytics cookies, the platform functions identically. Your school&apos;s
            data, reports, and communications are entirely unaffected.
          </p>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 4 — Third-Party */}
        <section id="third" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <BarChart2 className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Third-Party Cookies
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 8%, transparent)", border: "1px solid var(--color-border-default)" }}
                >
                  <BarChart2 className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
                </div>
                <div>
                  <p
                    className="font-jakarta font-bold text-[13.5px] mb-1"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    Analytics Cookies
                  </p>
                  <p
                    className="font-jakarta text-[13px] leading-[1.75]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Analytics cookies collect <strong>fully anonymous</strong> usage data — page
                    views, navigation paths, and performance metrics. No IP address or user identity
                    is stored. Data is aggregated and used only by the EduMyles team to improve the
                    platform. Our analytics configuration does not use cross-site tracking.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ background: "var(--color-surface-default)", border: "1px solid var(--color-border-default)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0"
                  style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 8%, transparent)", border: "1px solid var(--color-border-default)" }}
                >
                  <BarChart2 className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
                </div>
                <div>
                  <p
                    className="font-jakarta font-bold text-[13.5px] mb-1"
                    style={{ color: "var(--color-text-default)" }}
                  >
                    Google Analytics
                  </p>
                  <p
                    className="font-jakarta text-[13px] leading-[1.75]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    We use Google Analytics with <strong>IP anonymisation enabled</strong> to
                    understand aggregate traffic patterns on the marketing site (edumyles.com). This
                    data is not linked to any individual user, school, or student. We do not enable
                    Google Signals or cross-device tracking. Data is retained in Google Analytics
                    for 14 months.
                  </p>
                </div>
              </div>
            </div>
            <div
              className="rounded-xl p-4 flex items-start gap-3"
              style={{
                background: "color-mix(in srgb, var(--color-action-primary) 6%, transparent)",
                border: "1px solid color-mix(in srgb, var(--color-action-primary) 20%, transparent)",
              }}
            >
              <Shield
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                strokeWidth={1.5}
                style={{ color: "var(--color-text-on-primary-subtle)" }}
              />
              <p className="font-jakarta text-[13px]" style={{ color: "var(--color-text-muted)" }}>
                We do <strong>not</strong> use Facebook Pixel, Google Ads remarketing tags, LinkedIn
                Insight Tag, or any other advertising or retargeting cookies. Zero.
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid var(--color-surface-sunken)" }} />

        {/* 5 — Managing Preferences */}
        <section id="manage" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: "color-mix(in srgb, var(--color-status-success-solid) 10%, transparent)" }}
            >
              <Settings className="w-5 h-5" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
            </div>
            <h2 className="font-display font-bold text-[22px]" style={{ color: "var(--color-text-default)" }}>
              Managing Your Preferences
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Cookie consent banner",
                  detail:
                    "When you first visit EduMyles, a cookie consent banner allows you to accept or reject optional analytics cookies. Your choice is saved for one year in the em_consent cookie.",
                },
                {
                  title: "Re-show the consent banner",
                  detail:
                    'You can revisit your cookie choices at any time by clicking the "Cookie settings" link in the footer of the homepage.',
                },
                {
                  title: "Browser settings",
                  detail:
                    "Most browsers let you block or delete all cookies. Note that blocking essential cookies will prevent you from logging into EduMyles.",
                },
                {
                  title: "Opt out of Google Analytics",
                  detail:
                    "You can install the Google Analytics Opt-out Browser Add-on (tools.google.com/dlpage/gaoptout) to prevent data from being sent to Google Analytics across all sites.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-5"
                  style={{ background: "var(--color-surface-page)", border: "1px solid var(--color-border-default)" }}
                >
                  <h3
                    className="font-jakarta font-bold text-[13.5px] mb-1.5"
                    style={{ color: "var(--color-action-primary)" }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-jakarta text-[13px] leading-[1.7]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            {/* Browser how-to */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border-default)" }}>
              <div className="px-5 py-3" style={{ background: "var(--color-surface-default)" }}>
                <p className="font-jakarta font-bold text-[12px]" style={{ color: "var(--color-text-on-primary-subtle)" }}>
                  How to manage cookies in your browser
                </p>
              </div>
              <div className="grid sm:grid-cols-2" style={{ background: "var(--color-surface-default)" }}>
                {[
                  {
                    browser: "Google Chrome",
                    path: "Settings → Privacy and security → Cookies and other site data",
                  },
                  { browser: "Safari", path: "Preferences → Privacy → Manage Website Data" },
                  {
                    browser: "Firefox",
                    path: "Settings → Privacy & Security → Cookies and Site Data",
                  },
                  {
                    browser: "Microsoft Edge",
                    path: "Settings → Cookies and site permissions → Cookies and site data",
                  },
                ].map((b, i) => (
                  <div
                    key={b.browser}
                    className="px-5 py-3"
                    style={{
                      borderTop: i >= 2 || i === 1 ? "1px solid var(--color-surface-page)" : "none",
                      borderLeft: i % 2 === 1 ? "1px solid var(--color-surface-page)" : "none",
                    }}
                  >
                    <p
                      className="font-jakarta font-semibold text-[12.5px]"
                      style={{ color: "var(--color-text-default)" }}
                    >
                      {b.browser}
                    </p>
                    <p className="font-jakarta text-[12px] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {b.path}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
              For questions about our cookie practices, email{" "}
              <a href="mailto:privacy@edumyles.com" style={{ color: "var(--color-action-primary)" }}>
                privacy@edumyles.com
              </a>{" "}
              or visit our full{" "}
              <Link href="/privacy" style={{ color: "var(--color-action-primary)" }}>
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </section>

        {/* Contact card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--color-border-default)" }}>
          <div
            className="px-6 py-4"
            style={{ background: "var(--color-surface-page)", borderBottom: "1px solid var(--color-border-default)" }}
          >
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-action-primary)" }} />
              <p className="font-jakarta font-bold text-[13.5px]" style={{ color: "var(--color-text-default)" }}>
                Privacy &amp; Cookie Enquiries
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-0">
            {[
              {
                label: "Privacy team",
                value: "privacy@edumyles.com",
                href: "mailto:privacy@edumyles.com",
              },
              {
                label: "Data Protection Officer",
                value: "dpo@edumyles.com",
                href: "mailto:dpo@edumyles.com",
              },
              { label: "Response time", value: "Within 2 business days", href: null },
            ].map((c, i) => (
              <div
                key={c.label}
                className="px-5 py-4"
                style={{ borderLeft: i > 0 ? "1px solid var(--color-border-default)" : "none", background: "var(--color-surface-default)" }}
              >
                <p
                  className="font-jakarta text-[11px] uppercase tracking-wider mb-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {c.label}
                </p>
                {c.href ? (
                  <a
                    href={c.href}
                    className="font-jakarta font-semibold text-[13px] no-underline"
                    style={{ color: "var(--color-action-primary)" }}
                  >
                    {c.value}
                  </a>
                ) : (
                  <p
                    className="font-jakarta font-semibold text-[13px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {c.value}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "var(--color-surface-default)" }}>
          <h3 className="font-display font-bold text-[20px] text-foreground mb-2">
            Questions about cookies?
          </h3>
          <p className="font-jakarta text-[14px] mb-5" style={{ color: "var(--color-text-muted)" }}>
            Our privacy team is happy to explain how we use cookies and how to manage your
            preferences.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline"
            style={{ background: "var(--color-action-primary)", color: "var(--color-text-on-primary)" }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
