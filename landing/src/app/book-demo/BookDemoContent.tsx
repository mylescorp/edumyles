"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { buildSubmissionAttribution, storeReferralClickId } from "@/lib/attribution";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";
import CalDemoEmbed from "@/components/booking/CalDemoEmbed";

type FormState = "idle" | "loading" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const demoBenefits = [
  { icon: ShieldCheck, label: "Request stored first" },
  { icon: Clock, label: "30-minute walkthrough" },
  { icon: CalendarCheck2, label: "Calendar sync included" },
];

const expectationItems = [
  {
    icon: CalendarDays,
    title: "Personalized walkthrough",
    body: "We focus on the workflows your school actually runs: fees, grading, communication, reporting, and team access.",
  },
  {
    icon: Users,
    title: "Live implementation Q&A",
    body: "Bring your principal, bursar, ICT lead, or administrator so everyone can pressure-test the fit together.",
  },
  {
    icon: CheckCircle,
    title: "CRM-ready follow-up",
    body: "Your request, attribution, school context, and confirmed calendar details flow into the commercial pipeline.",
  },
];

function InfoRow({ icon: Icon, title, body }: { icon: LucideIcon; title: string; body: string }) {
  return (
    <div className="flex gap-4 rounded-[10px] border border-[#dceee4] bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[8px] bg-[#E8A020]">
        <Icon className="h-5 w-5 text-[#061A12]" />
      </div>
      <div>
        <h4 className="font-jakarta text-[15px] font-bold text-[#061A12]">{title}</h4>
        <p className="mt-1 font-jakarta text-[13px] leading-6 text-[#5a5a5a]">{body}</p>
      </div>
    </div>
  );
}

export default function BookDemoContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");
  const [demoRequestId, setDemoRequestId] = useState("");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: searchParams.get("email") ?? "",
    phone: "",
    schoolName: "",
    schoolType: "",
    jobTitle: "",
    preferredDemoDate: "",
    needs: "",
    country: "Kenya",
    county: "",
    studentCount: "",
    currentSystem: "",
    referralSource: referralCode ? "Friend/Colleague" : "Google Search",
    referralCode: referralCode ?? "",
  });

  const fullName = [fields.firstName, fields.lastName].filter(Boolean).join(" ").trim();
  const canScheduleInline = formState === "success" && !fallbackNotice && Boolean(demoRequestId);

  useEffect(() => {
    if (!referralCode) return;
    fetch("/api/referral/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referralCode,
        source: "book_demo_page",
        landingPage: window.location.pathname,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }),
    })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { clickId?: string };
        if (payload.clickId) storeReferralClickId(payload.clickId);
      })
      .catch(() => {
        // Referral tracking should never block the demo flow.
      });
  }, [referralCode]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");
    setFallbackNotice("");
    setDemoRequestId("");

    if (
      !fields.firstName.trim() ||
      !fields.lastName.trim() ||
      !fields.email.trim() ||
      !fields.phone.trim() ||
      !fields.schoolName.trim() ||
      !fields.schoolType.trim() ||
      !fields.jobTitle.trim()
    ) {
      setError("Please complete the required fields before choosing a demo time.");
      setFormState("error");
      return;
    }

    if (!EMAIL_REGEX.test(fields.email.trim())) {
      setError("Please enter a valid work email address.");
      setFormState("error");
      return;
    }

    try {
      const response = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...fields,
          marketingAttribution: buildSubmissionAttribution(searchParams, window.location.pathname, {
            ctaSource: searchParams.get("cta") ?? undefined,
            ctaLabel: searchParams.get("cta_label") ?? "Book Demo",
          }),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        capturedViaFallback?: boolean;
        demoRequestId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We couldn't submit your demo request right now.");
      }

      if (payload.capturedViaFallback) {
        setFallbackNotice(
          "Your request was captured for manual follow-up. Our team will contact you directly before scheduling."
        );
      }

      trackFormSubmission("demo_request", true);
      trackLeadConversion("demo_request", {
        form_name: "demo_request",
        captured_via_fallback: payload.capturedViaFallback ?? false,
      });
      setDemoRequestId(payload.demoRequestId ?? "");
      setFormState("success");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't submit your demo request right now."
      );
      trackFormSubmission("demo_request", false);
      setFormState("error");
    }
  }

  return (
    <div className="bg-[#F3FBF6] text-[#212121]">
      <section className="relative overflow-hidden bg-[#061A12] px-4 py-16 sm:px-8 lg:py-20">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(0deg, transparent 24%, rgba(232,160,32,0.08) 25%, rgba(232,160,32,0.08) 26%, transparent 27%, transparent 74%, rgba(232,160,32,0.08) 75%, rgba(232,160,32,0.08) 76%, transparent 77%), linear-gradient(90deg, transparent 24%, rgba(232,160,32,0.08) 25%, rgba(232,160,32,0.08) 26%, transparent 27%, transparent 74%, rgba(232,160,32,0.08) 75%, rgba(232,160,32,0.08) 76%, transparent 77%)",
            backgroundSize: "56px 56px",
          }}
        />
        <div className="relative mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <Link
              href="/"
              className="mb-8 inline-flex items-center gap-2 font-jakarta text-[13px] font-semibold text-[#A8E6C3] no-underline transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="mb-5 inline-flex items-center gap-2 rounded-[999px] border border-[#E8A020] bg-[#E8A020]/10 px-4 py-2 font-jakarta text-[13px] font-bold text-[#E8A020]">
              <Sparkles className="h-4 w-4" />
              Live product demo
            </div>
            <h1 className="max-w-[760px] font-display text-[2.35rem] font-bold leading-[1.05] text-white sm:text-[3.6rem] lg:text-[4.2rem]">
              Book a school-ready EduMyles walkthrough
            </h1>
            <p className="mt-6 max-w-[680px] font-jakarta text-[17px] leading-8 text-[#A8E6C3]">
              Tell us about your school, then choose an available time after the request is safely
              stored. The calendar confirmation syncs back into the same record.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {demoBenefits.map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-4 py-3 font-jakarta text-[13px] font-semibold text-white"
                >
                  <item.icon className="h-4 w-4 text-[#E8A020]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[16px] border border-white/10 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
            <div className="rounded-[12px] bg-white p-5">
              <div className="flex items-center justify-between gap-4 border-b border-[#edf4ef] pb-4">
                <div>
                  <p className="font-jakarta text-[12px] font-bold uppercase tracking-[0.18em] text-[#6B9E83]">
                    Scheduling
                  </p>
                  <h2 className="mt-1 font-display text-[24px] font-bold text-[#061A12]">
                    Request to meeting
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#061A12]">
                  <CalendarCheck2 className="h-6 w-6 text-[#E8A020]" />
                </div>
              </div>
              <div className="mt-5 space-y-4">
                {["Lead captured", "Calendar details attached", "Team follow-up ready"].map(
                  (step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-[#F3FBF6] font-jakarta text-[13px] font-bold text-[#0F4C2A]">
                        {index + 1}
                      </div>
                      <div className="h-px flex-1 bg-[#edf4ef]" />
                      <span className="w-[170px] font-jakarta text-[13px] font-semibold text-[#061A12]">
                        {step}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-8 lg:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-8 lg:grid-cols-[0.98fr_1.02fr]">
          <div className="order-2 lg:order-1">
            {formState === "success" ? (
              <div className="rounded-[14px] border border-[#d4eade] bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[10px] bg-[#F3FBF6]">
                    <CheckCircle className="h-6 w-6 text-[#0F4C2A]" />
                  </div>
                  <div>
                    <h2 className="font-display text-[26px] font-bold text-[#061A12]">
                      {fallbackNotice ? "Request captured" : "Details saved"}
                    </h2>
                    <p className="mt-2 font-jakarta text-[14px] leading-7 text-[#5a5a5a]">
                      {fallbackNotice
                        ? fallbackNotice
                        : `We saved ${fields.schoolName || "your school"}. Choose a time and the confirmed meeting will attach to this request.`}
                    </p>
                  </div>
                </div>

                {canScheduleInline ? (
                  <div className="mt-6">
                    <CalDemoEmbed
                      fullName={fullName}
                      email={fields.email}
                      phone={fields.phone}
                      schoolName={fields.schoolName}
                      demoRequestId={demoRequestId}
                    />
                  </div>
                ) : (
                  <div className="mt-6 rounded-[12px] border border-[#F5D48A] bg-[#FFF8E8] p-5">
                    <p className="font-jakarta text-[14px] leading-7 text-[#8C5A00]">
                      Live calendar scheduling is paused for this request because the backend used
                      the manual fallback path. Sales has the request details and will follow up
                      directly.
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <a
                        href="tel:+254743993715"
                        className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#061A12] px-5 py-3 font-jakarta text-[14px] font-bold text-white no-underline"
                      >
                        <Phone className="h-4 w-4" />
                        Call sales
                      </a>
                      <a
                        href="mailto:demo@edumyles.com"
                        className="inline-flex items-center justify-center gap-2 rounded-[8px] border border-[#d4eade] bg-white px-5 py-3 font-jakarta text-[14px] font-bold text-[#061A12] no-underline"
                      >
                        <Mail className="h-4 w-4" />
                        Email demo team
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[14px] border border-[#d4eade] bg-white p-5 shadow-sm sm:p-6">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#edf4ef] pb-5">
                  <div>
                    <p className="font-jakarta text-[12px] font-bold uppercase tracking-[0.18em] text-[#6B9E83]">
                      Step 1 of 2
                    </p>
                    <h2 className="mt-1 font-display text-[28px] font-bold text-[#061A12]">
                      Tell us about your school
                    </h2>
                  </div>
                  <div className="rounded-[999px] bg-[#F3FBF6] px-4 py-2 font-jakarta text-[12px] font-bold text-[#0F4C2A]">
                    Calendar unlocks next
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        First name *
                      </span>
                      <input
                        name="firstName"
                        value={fields.firstName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="John"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Last name *
                      </span>
                      <input
                        name="lastName"
                        value={fields.lastName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="Doe"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Email address *
                      </span>
                      <input
                        name="email"
                        value={fields.email}
                        onChange={handleChange}
                        type="email"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="john@school.ac.ke"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Phone number *
                      </span>
                      <input
                        name="phone"
                        value={fields.phone}
                        onChange={handleChange}
                        type="tel"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="+254 700 000 000"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        School name *
                      </span>
                      <input
                        name="schoolName"
                        value={fields.schoolName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="Nairobi Green Academy"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Job title *
                      </span>
                      <input
                        name="jobTitle"
                        value={fields.jobTitle}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="Principal, Administrator, etc."
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        School type *
                      </span>
                      <select
                        name="schoolType"
                        value={fields.schoolType}
                        onChange={handleChange}
                        required
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                      >
                        <option value="">Select school type</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="mixed">Mixed Primary & Secondary</option>
                        <option value="international">International School</option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Preferred demo date
                      </span>
                      <input
                        name="preferredDemoDate"
                        value={fields.preferredDemoDate}
                        onChange={handleChange}
                        type="date"
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Country
                      </span>
                      <input
                        name="country"
                        value={fields.country}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        County / region
                      </span>
                      <input
                        name="county"
                        value={fields.county}
                        onChange={handleChange}
                        type="text"
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="Nairobi"
                      />
                    </label>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Approx. student count
                      </span>
                      <input
                        name="studentCount"
                        value={fields.studentCount}
                        onChange={handleChange}
                        type="number"
                        min="0"
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                        placeholder="650"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                        Current system
                      </span>
                      <select
                        name="currentSystem"
                        value={fields.currentSystem}
                        onChange={handleChange}
                        className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                      >
                        <option value="">Select current system</option>
                        <option value="Paper records">Paper records</option>
                        <option value="Excel/Spreadsheets">Excel/Spreadsheets</option>
                        <option value="Nothing">Nothing</option>
                        <option value="Another school system">Another school system</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block font-jakarta text-[13px] font-bold text-[#061A12]">
                      Tell us about your school&apos;s needs
                    </span>
                    <textarea
                      name="needs"
                      value={fields.needs}
                      onChange={handleChange}
                      rows={4}
                      className="w-full rounded-[8px] border border-gray-200 px-4 py-3 font-jakarta text-[14px] text-[#212121] outline-none transition-colors focus:border-[#0F4C2A]"
                      style={{ resize: "vertical" }}
                      placeholder="What challenges are you looking to solve? What features interest you most?"
                    />
                  </label>

                  {error ? (
                    <div className="rounded-[10px] border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 font-jakarta text-sm text-[#9A1F2B]">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#061A12] px-8 py-4 font-jakarta text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0F4C2A] disabled:translate-y-0 disabled:opacity-70"
                  >
                    {formState === "loading" ? "Saving your request..." : "Save request and choose time"}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>

          <aside className="order-1 space-y-5 lg:order-2">
            <div className="rounded-[14px] border border-[#d4eade] bg-white p-6 shadow-sm">
              <p className="font-jakarta text-[12px] font-bold uppercase tracking-[0.18em] text-[#6B9E83]">
                What to expect
              </p>
              <h3 className="mt-2 font-display text-[30px] font-bold text-[#061A12]">
                A practical session for school operators
              </h3>
              <div className="mt-6 space-y-4">
                {expectationItems.map((item) => (
                  <InfoRow key={item.title} {...item} />
                ))}
              </div>
            </div>

            <div className="rounded-[14px] bg-[#061A12] p-6 shadow-sm">
              <div className="mb-4 flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="h-5 w-5 text-[#E8A020]" fill="#E8A020" />
                ))}
              </div>
              <p className="font-display text-[18px] italic leading-8 text-white">
                &ldquo;The demo was incredibly helpful. They understood our challenges immediately
                and showed us exactly how EduMyles would solve them.&rdquo;
              </p>
              <p className="mt-4 font-jakarta text-[13px] font-semibold text-[#E8A020]">
                Grace Njeri, Finance Officer - Nairobi Green Academy
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <h3 className="font-display text-[30px] font-bold text-[#061A12]">
            Prefer to talk directly?
          </h3>
          <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5a5a5a]">
            Our team can still help by phone or email if calendar scheduling is not the best fit.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <a
              href="tel:+254743993715"
              className="rounded-[12px] border border-[#d4eade] bg-[#F3FBF6] p-5 text-left no-underline transition-colors hover:bg-white"
            >
              <Phone className="mb-3 h-5 w-5 text-[#0F4C2A]" />
              <h4 className="font-jakarta text-[14px] font-bold text-[#061A12]">Call us</h4>
              <p className="mt-1 font-jakarta text-[13px] text-[#5a5a5a]">+254 743 993 715</p>
            </a>
            <a
              href="mailto:demo@edumyles.com"
              className="rounded-[12px] border border-[#d4eade] bg-[#F3FBF6] p-5 text-left no-underline transition-colors hover:bg-white"
            >
              <Mail className="mb-3 h-5 w-5 text-[#0F4C2A]" />
              <h4 className="font-jakarta text-[14px] font-bold text-[#061A12]">Email us</h4>
              <p className="mt-1 font-jakarta text-[13px] text-[#5a5a5a]">demo@edumyles.com</p>
            </a>
            <div className="rounded-[12px] border border-[#d4eade] bg-[#F3FBF6] p-5 text-left">
              <MapPin className="mb-3 h-5 w-5 text-[#0F4C2A]" />
              <h4 className="font-jakarta text-[14px] font-bold text-[#061A12]">Visit us</h4>
              <p className="mt-1 font-jakarta text-[13px] text-[#5a5a5a]">Nairobi, Kenya</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
