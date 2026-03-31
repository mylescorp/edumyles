"use client";

/**
 * /auth/pending
 *
 * Shown to users who completed WorkOS sign-up but are not yet provisioned
 * in the EduMyles database.  The page polls the waitlist status every 30 s
 * so the user is automatically forwarded once the master admin approves them.
 */

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";

type ApplicationStatus = "pending" | "approved" | "rejected" | null;

function StatusIcon({ status }: { status: ApplicationStatus }) {
  if (status === "approved") {
    return (
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    );
  }
  // pending / loading
  return (
    <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
      <svg className="w-10 h-10 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

export default function AuthPendingPage() {
  const router = useRouter();
  const convex = useConvex();

  const [workosUserId, setWorkosUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<ApplicationStatus>(null);
  const [reviewNotes, setReviewNotes] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  // Extract workos user id — prefer URL param, fall back to cookie via API
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const wid = params.get("wid");
    if (wid) {
      setWorkosUserId(wid);
    } else {
      // Attempt to read from the httpOnly cookie via a lightweight API call
      fetch("/api/auth/wid")
        .then((r) => r.json())
        .then((d) => d.workosUserId && setWorkosUserId(d.workosUserId))
        .catch(() => {/* ignore */});
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (!workosUserId) return;
    try {
      const app = await convex.query(api.waitlist.getApplicationByWorkosUserId, {
        workosUserId,
      });
      if (!app) {
        setStatus("pending");
        return;
      }
      setStatus(app.status as ApplicationStatus);
      setReviewNotes(app.reviewNotes ?? null);
      setEmail(app.email);

      if (app.status === "approved") {
        // User now has a record in the DB — send them to login so a proper session is created
        setTimeout(() => router.push("/auth/login/api"), 2500);
      }
    } catch {
      // Convex unavailable — keep polling
    }
  }, [workosUserId, convex, router]);

  // Initial check + polling every 30 s
  useEffect(() => {
    checkStatus();
    const id = setInterval(checkStatus, 30_000);
    return () => clearInterval(id);
  }, [checkStatus]);

  const headings: Record<NonNullable<ApplicationStatus>, string> = {
    pending: "Application under review",
    approved: "Application approved!",
    rejected: "Application not approved",
  };

  const bodies: Record<NonNullable<ApplicationStatus>, string> = {
    pending:
      "Your account has been received and is awaiting approval by the platform administrator. " +
      "This page refreshes automatically — you will be redirected as soon as you are approved.",
    approved:
      "Great news! Your account has been approved. Redirecting you to sign in…",
    rejected:
      "Unfortunately your application was not approved at this time. " +
      "If you believe this is a mistake please contact support.",
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-lg w-full text-center space-y-8">

        {/* Logo / brand */}
        <div className="space-y-1">
          <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground">
            EduMyles
          </p>
          <h1 className="text-3xl font-bold text-foreground">
            {status ? headings[status] : "Checking your application…"}
          </h1>
        </div>

        <StatusIcon status={status} />

        {/* Status message */}
        <div className="space-y-3">
          {status && (
            <p className="text-muted-foreground leading-relaxed">
              {bodies[status]}
            </p>
          )}
          {email && (
            <p className="text-sm text-muted-foreground">
              Account: <span className="font-medium text-foreground">{email}</span>
            </p>
          )}
          {reviewNotes && status === "rejected" && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-left">
              <p className="text-sm font-medium text-destructive mb-1">Review note</p>
              <p className="text-sm text-muted-foreground">{reviewNotes}</p>
            </div>
          )}
        </div>

        {/* Steps */}
        {status === "pending" && (
          <div className="rounded-xl border bg-card p-6 text-left space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              What happens next?
            </h2>
            <ol className="space-y-3">
              {[
                "Your registration has been received and logged.",
                "The platform administrator will review your application.",
                "You will be notified by email once a decision is made.",
                "On approval, simply click the link in your email to sign in.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {status === "rejected" && (
            <a
              href="mailto:support@edumyles.com"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Contact support
            </a>
          )}
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Back to home
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Page auto-refreshes every 30 seconds.{" "}
          <button
            onClick={checkStatus}
            className="underline underline-offset-2 hover:text-muted-foreground transition-colors"
          >
            Refresh now
          </button>
        </p>
      </div>
    </div>
  );
}
