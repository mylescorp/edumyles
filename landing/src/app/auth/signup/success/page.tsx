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
    <main className="flex min-h-screen items-center justify-center bg-[#F3FBF6] px-4 py-10">
      <div className="w-full max-w-3xl rounded-[32px] border border-[#dcebe3] bg-white p-8 shadow-[0_24px_64px_rgba(6,26,18,0.08)] sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F4C2A] text-white">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <p className="mt-6 font-jakarta text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1A7A4A]">
            Application received
          </p>
          <h1 className="mt-3 font-playfair text-[clamp(2rem,4vw,3.25rem)] font-bold leading-[1.1] text-[#061A12]">
            {duplicate ? "Your application is already in review." : "Your application is now under review."}
          </h1>
          <p className="mt-5 font-jakarta text-[16px] leading-8 text-[#5b6b63]">
            {school ? `${school} has been added to the EduMyles onboarding queue.` : "Your organisation has been added to the EduMyles onboarding queue."} Our team is now reviewing your application and will follow up with the next steps for approval and onboarding.
          </p>

          <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e5efe9] bg-[#F9FCFA] p-5">
              <div className="flex items-center gap-2 font-jakarta text-sm font-bold text-[#061A12]">
                <Clock3 className="h-4 w-4 text-[#E8A020]" />
                What happens next
              </div>
              <p className="mt-3 font-jakarta text-[14px] leading-7 text-[#5d6f66]">
                We’ll review your application, assess your onboarding needs, and contact you soon with the next steps. If we need anything clarified, we’ll reach out directly.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e5efe9] bg-[#F9FCFA] p-5">
              <div className="flex items-center gap-2 font-jakarta text-sm font-bold text-[#061A12]">
                <Mail className="h-4 w-4 text-[#E8A020]" />
                Your contact channel
              </div>
              <p className="mt-3 font-jakarta text-[14px] leading-7 text-[#5d6f66]">
                {email ? `We’ll begin with ${email}` : "We’ll begin with the contact details you submitted"} and use your preferred contact route to guide you through approval and onboarding.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-[#0F4C2A] bg-[#061A12] px-6 py-6 text-left text-white">
            <h2 className="font-jakarta text-[15px] font-bold text-[#E8A020]">
              Need to reach us sooner?
            </h2>
            <p className="mt-2 font-jakarta text-[14px] leading-7 text-[#A8E6C3]">
              Our team is happy to help if you want to add context to your application, confirm onboarding timelines, or discuss your school setup before approval.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href="mailto:sales@edumyles.com" className="flex items-center gap-2 text-sm text-white no-underline hover:text-[#E8A020]">
                <Mail className="h-4 w-4" />
                sales@edumyles.com
              </a>
              <a href="mailto:contact@edumyles.com" className="flex items-center gap-2 text-sm text-white no-underline hover:text-[#E8A020]">
                <Mail className="h-4 w-4" />
                contact@edumyles.com
              </a>
              <a href="tel:+254743993715" className="flex items-center gap-2 text-sm text-white no-underline hover:text-[#E8A020]">
                <PhoneCall className="h-4 w-4" />
                +254 743 993 715
              </a>
              <a
                href="https://wa.me/254743993715?text=Hello%20EduMyles%2C%20I%20just%20submitted%20our%20application%20and%20would%20like%20to%20follow%20up."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-white no-underline hover:text-[#E8A020]"
              >
                <MessageSquareText className="h-4 w-4" />
                WhatsApp support
              </a>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-[999px] border border-[#0F4C2A] bg-[#0F4C2A] px-6 py-3 font-jakarta text-sm font-bold text-white no-underline transition-colors hover:bg-[#061A12]"
            >
              Return to landing page
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-[999px] border border-[#d5e7dd] bg-white px-6 py-3 font-jakarta text-sm font-semibold text-[#0F4C2A] no-underline transition-colors hover:border-[#0F4C2A]"
            >
              Contact our team
            </Link>
          </div>

          <p className="mt-5 font-jakarta text-[13px] text-[#6B9E83]">
            Take your time to read through the next steps, then return to the EduMyles landing page whenever you're ready.
          </p>
        </div>
      </div>
    </main>
  );
}

function SignUpSuccessFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F3FBF6] px-4 py-10">
      <div className="w-full max-w-2xl rounded-[32px] border border-[#dcebe3] bg-white p-8 text-center shadow-[0_24px_64px_rgba(6,26,18,0.08)] sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0F4C2A] text-white">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="mt-6 font-jakarta text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1A7A4A]">
          Finalizing
        </p>
        <h1 className="mt-3 font-playfair text-[2rem] font-bold leading-[1.1] text-[#061A12]">
          Preparing your confirmation...
        </h1>
        <p className="mt-5 font-jakarta text-[16px] leading-8 text-[#5b6b63]">
          We’re getting your application confirmation ready.
        </p>
      </div>
    </main>
  );
}
