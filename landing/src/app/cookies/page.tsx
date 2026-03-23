import type { Metadata } from "next";
import Link from "next/link";
import { Cookie, Settings, BarChart2, Shield, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy — EduMyles",
  description: "EduMyles Cookie Policy. Learn what cookies we use and how to manage your preferences.",
};

const sections = [
  { id: "what",      label: "What Are Cookies" },
  { id: "table",     label: "Cookies We Use" },
  { id: "essential", label: "Essential vs Optional" },
  { id: "third",     label: "Third-Party" },
  { id: "manage",    label: "Manage Preferences" },
];

export default function CookiesPage() {
  return (
    <div style={{ color: "#212121" }}>

      {/* Hero */}
      <section
        className="relative flex items-center overflow-hidden"
        style={{ background: "#061A12", borderTop: "3px solid #E8A020", padding: "5rem 2rem 4rem", minHeight: "320px" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)`,
          backgroundSize: "50px 50px",
        }} />
        <div className="relative max-w-[860px] mx-auto w-full">
          <div className="inline-flex items-center gap-2 font-jakarta font-semibold text-[13px] mb-5 px-4 py-2 rounded-full" style={{ background: "rgba(232,160,32,0.12)", border: "1px solid #E8A020", color: "#E8A020" }}>
            <Cookie className="w-3.5 h-3.5" strokeWidth={2} />
            Cookie Policy
          </div>
          <h1 className="font-playfair font-bold leading-tight mb-4" style={{ fontSize: "clamp(2rem,4vw,3.25rem)", color: "#ffffff" }}>
            We use cookies{" "}<em className="italic" style={{ color: "#E8A020" }}>fairly.</em>
          </h1>
          <p className="font-jakarta text-[15px] mb-6" style={{ color: "#90CAF9" }}>
            Last updated: March 2026 · Effective: 1 January 2025
          </p>
          {/* Quick nav */}
          <div className="flex flex-wrap gap-2">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="font-jakarta font-medium text-[12px] px-4 py-2 rounded-full no-underline transition-colors duration-200" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#A8E6C3" }}>
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-[860px] mx-auto px-6 py-16 flex flex-col gap-14">

        {/* Intro */}
        <div className="rounded-2xl p-6" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
          <p className="font-jakarta text-[14px] leading-[1.9]" style={{ color: "#374151" }}>
            This Cookie Policy explains what cookies are, which cookies EduMyles uses, and how you can control them. We keep our cookie usage to the minimum necessary to run the platform securely and improve your experience. We do <strong>not</strong> use advertising cookies, tracking pixels, or sell cookie data to any third party.
          </p>
        </div>

        {/* 1 — What Are Cookies */}
        <section id="what" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
              <Cookie className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-playfair font-bold text-[22px]" style={{ color: "#061A12" }}>What Are Cookies?</h2>
          </div>
          <div className="flex flex-col gap-4">
            <p className="font-jakarta text-[14px] leading-[1.85]" style={{ color: "#374151" }}>
              Cookies are small text files placed on your device by websites you visit. They are widely used to make websites work, work more efficiently, and to provide information to the site owners.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { type: "Session cookies", detail: "Deleted when you close your browser. Used to keep you logged in during a browsing session." },
                { type: "Persistent cookies", detail: "Remain on your device for a set period. Used to remember your preferences across visits." },
                { type: "Third-party cookies", detail: "Set by services other than EduMyles (e.g. analytics providers). We use only privacy-respecting third parties." },
              ].map((item) => (
                <div key={item.type} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}>
                  <p className="font-jakarta font-bold text-[13px] mb-1.5" style={{ color: "#061A12" }}>{item.type}</p>
                  <p className="font-jakarta text-[12.5px] leading-[1.6]" style={{ color: "#6B9E83" }}>{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(232,160,32,0.06)", border: "1px solid rgba(232,160,32,0.2)" }}>
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: "#E8A020" }} />
              <p className="font-jakarta text-[13px]" style={{ color: "#5a5a5a" }}>
                EduMyles does <strong>not</strong> use tracking cookies, retargeting cookies, advertising cookies, or fingerprinting technologies. We will never use cookies to build profiles for ad targeting.
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 2 — Cookies We Use */}
        <section id="table" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
              <Settings className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-playfair font-bold text-[22px]" style={{ color: "#061A12" }}>Cookies We Use</h2>
          </div>
          <p className="font-jakarta text-[14px] leading-[1.8] mb-5" style={{ color: "#5a5a5a" }}>
            The following table lists every cookie set by EduMyles. We keep this list current — if we add a cookie we update this page.
          </p>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e8f4ec" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "#061A12" }}>
                  <th className="font-jakarta font-bold text-[12px] text-left px-4 py-3" style={{ color: "#E8A020" }}>Cookie Name</th>
                  <th className="font-jakarta font-bold text-[12px] text-left px-4 py-3" style={{ color: "#E8A020" }}>Purpose</th>
                  <th className="font-jakarta font-bold text-[12px] text-left px-4 py-3 hidden sm:table-cell" style={{ color: "#E8A020" }}>Duration</th>
                  <th className="font-jakarta font-bold text-[12px] text-left px-4 py-3" style={{ color: "#E8A020" }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    name: "em_session",
                    purpose: "Maintains your authenticated session while using the platform. Required for login to work.",
                    duration: "Session",
                    type: "Essential",
                    typeColor: "#0F4C2A",
                    typeBg: "rgba(26,122,74,0.1)",
                  },
                  {
                    name: "em_auth_token",
                    purpose: "Stores your WorkOS authentication token so you stay logged in between browser sessions.",
                    duration: "7 days",
                    type: "Essential",
                    typeColor: "#0F4C2A",
                    typeBg: "rgba(26,122,74,0.1)",
                  },
                  {
                    name: "em_pref",
                    purpose: "Saves your UI preferences such as sidebar state, theme selection, and dashboard layout.",
                    duration: "1 year",
                    type: "Preference",
                    typeColor: "#1565C0",
                    typeBg: "rgba(21,101,192,0.1)",
                  },
                  {
                    name: "em_consent",
                    purpose: "Records your cookie consent choice (accepted or rejected optional cookies) to avoid re-showing the banner.",
                    duration: "1 year",
                    type: "Essential",
                    typeColor: "#0F4C2A",
                    typeBg: "rgba(26,122,74,0.1)",
                  },
                  {
                    name: "_vercel_analytics",
                    purpose: "Anonymous, aggregated usage analytics provided by Vercel. No personal data is collected. Used to understand which features are most used.",
                    duration: "30 days",
                    type: "Analytics",
                    typeColor: "#7A4A00",
                    typeBg: "rgba(232,160,32,0.1)",
                  },
                  {
                    name: "_ga",
                    purpose: "Google Analytics aggregate traffic statistics. IP addresses are anonymised. No personal data is associated with this cookie.",
                    duration: "2 years",
                    type: "Analytics",
                    typeColor: "#7A4A00",
                    typeBg: "rgba(232,160,32,0.1)",
                  },
                ].map(({ name, purpose, duration, type, typeColor, typeBg }, i) => (
                  <tr key={name} style={{ background: i % 2 === 0 ? "#ffffff" : "#F9FEFE" }}>
                    <td className="px-4 py-3 align-top">
                      <code className="font-mono text-[12px] font-semibold" style={{ color: "#0F4C2A" }}>{name}</code>
                    </td>
                    <td className="font-jakarta text-[12.5px] leading-[1.6] px-4 py-3 align-top" style={{ color: "#374151" }}>{purpose}</td>
                    <td className="font-jakarta text-[12.5px] px-4 py-3 align-top hidden sm:table-cell" style={{ color: "#6B9E83" }}>{duration}</td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-jakarta font-semibold text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: typeBg, color: typeColor }}>
                        {type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 3 — Essential vs Optional */}
        <section id="essential" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
              <Shield className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-playfair font-bold text-[22px]" style={{ color: "#061A12" }}>Essential vs Optional Cookies</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div className="rounded-xl p-5" style={{ background: "#F3FBF6", border: "2px solid #d4eade" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-jakarta font-bold text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(26,122,74,0.1)", color: "#0F4C2A" }}>Essential</span>
                <span className="font-jakarta text-[11px]" style={{ color: "#6B9E83" }}>Always active</span>
              </div>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#374151" }}>
                Essential cookies are strictly necessary for the platform to function. They enable core features such as authentication, session management, security, and your saved UI preferences. These cannot be disabled without breaking the platform.
              </p>
              <ul className="flex flex-col gap-1.5 mt-3">
                {["em_session", "em_auth_token", "em_pref", "em_consent"].map((c) => (
                  <li key={c} className="flex items-center gap-2 font-jakarta text-[12.5px]" style={{ color: "#5a5a5a", listStyle: "none" }}>
                    <span style={{ color: "#1A7A4A" }}>✓</span>
                    <code className="font-mono text-[12px]">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl p-5" style={{ background: "rgba(232,160,32,0.04)", border: "2px solid rgba(232,160,32,0.2)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="font-jakarta font-bold text-[11px] px-2.5 py-1 rounded-full" style={{ background: "rgba(232,160,32,0.1)", color: "#7A4A00" }}>Analytics</span>
                <span className="font-jakarta text-[11px]" style={{ color: "#6B9E83" }}>Optional — your choice</span>
              </div>
              <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#374151" }}>
                Analytics cookies collect <strong>anonymous, aggregate</strong> data about how users navigate the platform. No personal data is tied to these cookies. Disabling them does not affect your ability to use EduMyles — it only means we receive less information about usage patterns.
              </p>
              <ul className="flex flex-col gap-1.5 mt-3">
                {["_vercel_analytics", "_ga"].map((c) => (
                  <li key={c} className="flex items-center gap-2 font-jakarta text-[12.5px]" style={{ color: "#5a5a5a", listStyle: "none" }}>
                    <span style={{ color: "#E8A020" }}>○</span>
                    <code className="font-mono text-[12px]">{c}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
            If you decline analytics cookies, the platform functions identically. Your school&apos;s data, reports, and communications are entirely unaffected.
          </p>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 4 — Third-Party */}
        <section id="third" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
              <BarChart2 className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-playfair font-bold text-[22px]" style={{ color: "#061A12" }}>Third-Party Cookies</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid #d4eade" }}>
                  <BarChart2 className="w-4 h-4" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
                </div>
                <div>
                  <p className="font-jakarta font-bold text-[13.5px] mb-1" style={{ color: "#061A12" }}>Vercel Analytics</p>
                  <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                    Vercel Analytics collects <strong>fully anonymous</strong> usage data — page views, navigation paths, and performance metrics. No IP address or user identity is stored. Data is aggregated and used only by the EduMyles team to improve the platform. Vercel&apos;s analytics is privacy-first and does not use cross-site tracking.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{ background: "#ffffff", border: "1px solid #e8f4ec" }}>
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-[8px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.08)", border: "1px solid #d4eade" }}>
                  <BarChart2 className="w-4 h-4" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
                </div>
                <div>
                  <p className="font-jakarta font-bold text-[13.5px] mb-1" style={{ color: "#061A12" }}>Google Analytics</p>
                  <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
                    We use Google Analytics with <strong>IP anonymisation enabled</strong> to understand aggregate traffic patterns on the marketing site (edumyles.com). This data is not linked to any individual user, school, or student. We do not enable Google Signals or cross-device tracking. Data is retained in Google Analytics for 14 months.
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "rgba(232,160,32,0.06)", border: "1px solid rgba(232,160,32,0.2)" }}>
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={1.5} style={{ color: "#E8A020" }} />
              <p className="font-jakarta text-[13px]" style={{ color: "#5a5a5a" }}>
                We do <strong>not</strong> use Facebook Pixel, Google Ads remarketing tags, LinkedIn Insight Tag, or any other advertising or retargeting cookies. Zero.
              </p>
            </div>
          </div>
        </section>

        <div style={{ borderTop: "1px solid #f0f0f0" }} />

        {/* 5 — Managing Preferences */}
        <section id="manage" className="scroll-mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(26,122,74,0.1)" }}>
              <Settings className="w-5 h-5" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
            </div>
            <h2 className="font-playfair font-bold text-[22px]" style={{ color: "#061A12" }}>Managing Your Preferences</h2>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Cookie consent banner",
                  detail: "When you first visit EduMyles, a cookie consent banner allows you to accept or reject optional analytics cookies. Your choice is saved for one year in the em_consent cookie.",
                },
                {
                  title: "Re-show the consent banner",
                  detail: "You can revisit your cookie choices at any time by clicking the \"Cookie settings\" link in the footer of the homepage.",
                },
                {
                  title: "Browser settings",
                  detail: "Most browsers let you block or delete all cookies. Note that blocking essential cookies will prevent you from logging into EduMyles.",
                },
                {
                  title: "Opt out of Google Analytics",
                  detail: "You can install the Google Analytics Opt-out Browser Add-on (tools.google.com/dlpage/gaoptout) to prevent data from being sent to Google Analytics across all sites.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl p-5" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
                  <h3 className="font-jakarta font-bold text-[13.5px] mb-1.5" style={{ color: "#0F4C2A" }}>{item.title}</h3>
                  <p className="font-jakarta text-[13px] leading-[1.7]" style={{ color: "#5a5a5a" }}>{item.detail}</p>
                </div>
              ))}
            </div>

            {/* Browser how-to */}
            <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e8f4ec" }}>
              <div className="px-5 py-3" style={{ background: "#061A12" }}>
                <p className="font-jakarta font-bold text-[12px]" style={{ color: "#E8A020" }}>How to manage cookies in your browser</p>
              </div>
              <div className="grid sm:grid-cols-2" style={{ background: "#ffffff" }}>
                {[
                  { browser: "Google Chrome", path: "Settings → Privacy and security → Cookies and other site data" },
                  { browser: "Safari", path: "Preferences → Privacy → Manage Website Data" },
                  { browser: "Firefox", path: "Settings → Privacy & Security → Cookies and Site Data" },
                  { browser: "Microsoft Edge", path: "Settings → Cookies and site permissions → Cookies and site data" },
                ].map((b, i) => (
                  <div key={b.browser} className="px-5 py-3" style={{ borderTop: i >= 2 || (i === 1) ? "1px solid #f0f7f3" : "none", borderLeft: i % 2 === 1 ? "1px solid #f0f7f3" : "none" }}>
                    <p className="font-jakarta font-semibold text-[12.5px]" style={{ color: "#061A12" }}>{b.browser}</p>
                    <p className="font-jakarta text-[12px] mt-0.5" style={{ color: "#6B9E83" }}>{b.path}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="font-jakarta text-[13px] leading-[1.75]" style={{ color: "#5a5a5a" }}>
              For questions about our cookie practices, email <a href="mailto:privacy@edumyles.com" style={{ color: "#1A7A4A" }}>privacy@edumyles.com</a> or visit our full <Link href="/privacy" style={{ color: "#1A7A4A" }}>Privacy Policy</Link>.
            </p>
          </div>
        </section>

        {/* Contact card */}
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e8f4ec" }}>
          <div className="px-6 py-4" style={{ background: "#F3FBF6", borderBottom: "1px solid #d4eade" }}>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4" strokeWidth={1.5} style={{ color: "#1A7A4A" }} />
              <p className="font-jakarta font-bold text-[13.5px]" style={{ color: "#061A12" }}>Privacy &amp; Cookie Enquiries</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-0">
            {[
              { label: "Privacy team", value: "privacy@edumyles.com", href: "mailto:privacy@edumyles.com" },
              { label: "Data Protection Officer", value: "dpo@edumyles.com", href: "mailto:dpo@edumyles.com" },
              { label: "Response time", value: "Within 2 business days", href: null },
            ].map((c, i) => (
              <div key={c.label} className="px-5 py-4" style={{ borderLeft: i > 0 ? "1px solid #e8f4ec" : "none", background: "#ffffff" }}>
                <p className="font-jakarta text-[11px] uppercase tracking-wider mb-1" style={{ color: "#6B9E83" }}>{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="font-jakarta font-semibold text-[13px] no-underline" style={{ color: "#1A7A4A" }}>{c.value}</a>
                ) : (
                  <p className="font-jakarta font-semibold text-[13px]" style={{ color: "#374151" }}>{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="rounded-2xl p-8 text-center" style={{ background: "#061A12" }}>
          <h3 className="font-playfair font-bold text-[20px] text-white mb-2">Questions about cookies?</h3>
          <p className="font-jakarta text-[14px] mb-5" style={{ color: "#A8E6C3" }}>Our privacy team is happy to explain how we use cookies and how to manage your preferences.</p>
          <Link href="/contact" className="inline-flex items-center gap-2 font-jakarta font-bold text-[14px] px-6 py-3 rounded-[50px] no-underline" style={{ background: "#E8A020", color: "#061A12" }}>
            Contact Us
          </Link>
        </div>

      </div>
    </div>
  );
}
