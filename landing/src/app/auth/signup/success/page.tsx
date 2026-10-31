"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Clock3, Mail, MessageSquareText, PhoneCall, ShieldCheck } from "lucide-react";

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={<SignUpSuccessFallback />}>
      <SignUpSuccessContent />
    </Suspense>
  );
}

function SignUpSuccessContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const school = searchParams.get("school");
  const duplicate = searchParams.get("duplicate") === "1";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-[#dcebe3] bg-card p-8 shadow-[0_24px_64px_rgba(6,26,18,0.08)] sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="mt-6 font-jakarta text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">
            Waitlist confirmed
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] text-foreground">
            {duplicate
              ? "Your existing waitlist entry was updated."
              : "Your school is now on the waitlist."}
          </h1>
          <p className="mt-5 font-jakarta text-[16px] leading-8 text-[#5b6b63]">
            {duplicate
              ? school
                ? `${school} was already on the EduMyles waitlist, so we updated the existing record for the submitted contact details.`
                : "Your organisation was already on the EduMyles waitlist, so we updated the existing record for the submitted contact details."
              : school
                ? `${school} has been added to the EduMyles waitlist.`
                : "Your organisation has been added to the EduMyles waitlist."}{" "}
            Our team will review your school profile and follow up with the next steps for
            onboarding and rollout timing.
          </p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e5efe9] bg-[#F9FCFA] p-5">
              <div className="flex items-center gap-2 font-jakarta text-sm font-bold text-foreground">
                <Clock3 className="h-4 w-4 text-[var(--accent-foreground)]" />
                {duplicate ? "What changed" : "What happens next"}
              </div>
              <p className="mt-3 font-jakarta text-[14px] leading-7 text-[var(--muted-foreground)]">
                {duplicate
                  ? "We refreshed your existing waitlist record with the latest details from this submission. On the platform side, your team should look for the same school or contact email rather than expecting a second duplicate row."
                  : "We’ll review your waitlist entry, assess your onboarding needs, and contact you soon with the next steps. If we need anything clarified, we’ll reach out directly."}
              </p>
            </div>
            <div className="rounded-2xl border border-[#e5efe9] bg-[#F9FCFA] p-5">
              <div className="flex items-center gap-2 font-jakarta text-sm font-bold text-foreground">
                <Mail className="h-4 w-4 text-[var(--accent-foreground)]" />
                Your contact channel
              </div>
              <p className="mt-3 font-jakarta text-[14px] leading-7 text-[var(--muted-foreground)]">
                {email
                  ? `We’ll begin with ${email}`
                  : "We’ll begin with the contact details you submitted"}{" "}
                and use your preferred contact route to guide you through waitlist follow-up and
                onboarding.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-primary bg-primary px-6 py-6 text-left text-primary-foreground">
            <h2 className="font-jakarta text-[15px] font-bold text-[var(--accent-foreground)]">
              Need to reach us sooner?
            </h2>
            <p className="mt-2 font-jakarta text-[14px] leading-7 text-[#A8E6C3]">
              Our team is happy to help if you want to add context to your waitlist entry, confirm
              onboarding timelines, or discuss your school setup before activation.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a
                href="mailto:sales@edumyles.com"
                className="flex items-center gap-2 text-sm text-white no-underline hover:text-[var(--accent-foreground)]"
              >
                <Mail className="h-4 w-4" />
                sales@edumyles.com
              </a>
              <a
                href="mailto:contact@edumyles.com"
                className="flex items-center gap-2 text-sm text-white no-underline hover:text-[var(--accent-foreground)]"
              >
                <Mail className="h-4 w-4" />
                contact@edumyles.com
              </a>
              <a
                href="tel:+254743993715"
                className="flex items-center gap-2 text-sm text-white no-underline hover:text-[var(--accent-foreground)]"
              >
                <PhoneCall className="h-4 w-4" />
                +254 743 993 715
              </a>
              <a
                href="https://wa.me/254743993715?text=Hello%20EduMyles%2C%20I%20just%20joined%20the%20waitlist%20and%20would%20like%20to%20follow%20up."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white no-underline hover:text-[var(--accent-foreground)]"
              >
                <MessageSquareText className="h-4 w-4" />
                WhatsApp support
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[999px] border border-primary bg-primary px-6 py-3 font-jakarta text-sm font-bold text-primary-foreground no-underline transition-colors hover:bg-primary"
            >
              Return to landing page
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[999px] border border-[#d5e7dd] bg-card px-6 py-3 font-jakarta text-sm font-semibold text-primary no-underline transition-colors hover:border-primary"
            >
              Contact our team
            </Link>
          </div>

          <p className="mt-5 font-jakarta text-[13px] text-[var(--muted-foreground)]">
            Take your time to read through the next steps, then return to the EduMyles landing page
            whenever you&apos;re ready.
          </p>
        </div>
      </div>
    </main>
  );
}

function SignUpSuccessFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10">
      <div className="w-full max-w-2xl rounded-[32px] border border-[#dcebe3] bg-card p-8 text-center shadow-[0_24px_64px_rgba(6,26,18,0.08)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="mt-6 font-jakarta text-[12px] font-semibold uppercase tracking-[0.2em] text-primary">
          Finalizing
        </p>
        <h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.1] text-foreground">
          Preparing your confirmation...
        </h1>
        <p className="mt-5 font-jakarta text-[16px] leading-8 text-[#5b6b63]">
          We’re getting your waitlist confirmation ready.
        </p>
      </div>
    </main>
  );
}
