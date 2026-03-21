"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { getMarketingSitePath } from "@/lib/marketingSite";

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter — KES 2,500/mo",
  growth: "Growth — KES 6,500/mo",
  pro: "Pro — KES 15,000/mo",
  enterprise: "Enterprise — Custom pricing",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_configured: "Sign-up service is not configured yet. Contact your administrator.",
};

function SignupForm() {
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "";
  const errorKey = searchParams.get("error");
  const errorMsg = errorKey ? (ERROR_MESSAGES[errorKey] ?? "An error occurred. Please try again.") : null;

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const termsUrl = getMarketingSitePath("/terms");
  const privacyUrl = getMarketingSitePath("/terms#privacy");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);

    // Navigate directly to the API route which builds the WorkOS sign-up URL
    const params = new URLSearchParams({ email });
    if (plan) params.set("plan", plan);
    window.location.href = `/auth/signup/api?${params.toString()}`;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-badge">Free 14-day trial · No credit card required</div>
          <h1 className="auth-title">Get started free</h1>
          <p className="auth-subtitle">
            {plan && PLAN_LABELS[plan]
              ? <>You selected the <strong>{PLAN_LABELS[plan]}</strong> plan</>
              : "Transform how your school operates"}
          </p>
        </div>

        {(errorMsg || formError) && (
          <div className="auth-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{formError || errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="email" className="auth-label">School or work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@yourschool.ac.ke"
              className="auth-input"
              required
              autoComplete="email"
              autoFocus
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading
              ? <span className="auth-btn-spinner" aria-label="Creating account…" />
              : "Create free account →"
            }
          </button>
        </form>

        <ul className="auth-trust-list">
          <li>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            Up and running in under 5 minutes
          </li>
          <li>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            All 11 modules included during trial
          </li>
          <li>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
            Cancel anytime — no lock-in
          </li>
        </ul>

        <p className="auth-footer-text">
          Already have an account?{" "}
          <Link href="/auth/login/api" className="auth-link">Sign in →</Link>
        </p>
      </div>

      <p className="auth-legal">
        By creating an account you agree to our{" "}
        <a href={termsUrl} className="auth-link">Terms</a>{" "}and{" "}
        <a href={privacyUrl} className="auth-link">Privacy Policy</a>.
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card auth-loading" /></div>}>
      <SignupForm />
    </Suspense>
  );
}
