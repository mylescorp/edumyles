"use client";

import { useEffect } from "react";
import Link from "next/link";
import ArtDashboard from "@/components/sections/ArtDashboard";

export default function Hero() {
  useEffect(() => {
    const referralCode = new URLSearchParams(window.location.search).get("ref");
    if (!referralCode) return;
    fetch("/api/referral/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode,
        source: "landing_page",
        landingPage: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }),
    }).catch(() => undefined);
  }, []);

  return (
    <section id="hero" className="handoff-home-hero" aria-label="Hero section">
      <div className="handoff-home-hero-inner">
        <div className="handoff-home-copy">
          <span className="handoff-home-chip">East Africa&apos;s school management platform</span>
          <h1>Run your whole school on <em>one platform.</em></h1>
          <p>
            Admissions, fees, academics, HR and parent communication in one place, with M-Pesa built
            in and designed for schools like yours.
          </p>
          <div className="handoff-home-actions">
            <Link href="/waitlist" className="handoff-primary-button">Start Free Trial</Link>
            <Link href="/book-demo" className="handoff-secondary-button">Book a Demo</Link>
          </div>
        </div>
        <div className="handoff-home-art">
          <ArtDashboard />
          <div className="handoff-payment-note" aria-hidden="true">
            <span>✓</span><div><b>M-Pesa payment confirmed</b><small>Receipt sent to parent</small></div>
          </div>
        </div>
      </div>
      <div className="handoff-home-stats" aria-label="Platform highlights">
        {[
          ["50+", "Schools onboarded"],
          ["Multi-campus", "Ready from day one"],
          ["5", "Countries"],
          ["Automated", "Fee payments"],
        ].map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div>
      <div className="handoff-home-integrations" aria-label="Supported integrations">
        {["M-Pesa", "Airtel Money", "SMS", "Card payments", "Google SSO", "Microsoft SSO", "WhatsApp Business"].map((label) => <span key={label}>{label}</span>)}
      </div>
    </section>
  );
}
