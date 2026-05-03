"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Users,
  CheckCircle,
  Star,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import {
  buildSubmissionAttribution,
  storeReferralClickId,
} from "@/lib/attribution";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";

type FormState = "idle" | "loading" | "success" | "error";

export default function BookDemoContent() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");
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
        if (payload.clickId) {
          storeReferralClickId(payload.clickId);
        }
      })
      .catch(() => {
        // keep the booking flow moving even if tracking fails
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

  const calendarHref = useMemo(() => {
    const url = new URL("https://cal.com/edumyles/demo");
    const fullName = [fields.firstName, fields.lastName].filter(Boolean).join(" ").trim();
    if (fullName) url.searchParams.set("name", fullName);
    if (fields.email) url.searchParams.set("email", fields.email);
    if (fields.schoolName) url.searchParams.set("guests", "");
    return url.toString();
  }, [fields.email, fields.firstName, fields.lastName, fields.schoolName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");
    setFallbackNotice("");

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
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We couldn't submit your demo request right now.");
      }

      if (payload.capturedViaFallback) {
        setFallbackNotice(
          "We captured your request and notified our team, but scheduling may take a little longer than usual."
        );
      }

      trackFormSubmission("demo_request", true);
      trackLeadConversion("demo_request", {
        form_name: "demo_request",
        captured_via_fallback: payload.capturedViaFallback ?? false,
      });
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
    <div style={{ color: "#212121" }}>
      <section
        className="relative flex items-center overflow-hidden"
        style={{
          background: "#061A12",
          borderTop: "3px solid #E8A020",
          padding: "6rem 2rem 5rem",
          minHeight: "500px",
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(0deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%),linear-gradient(90deg,transparent 24%,rgba(232,160,32,0.04) 25%,rgba(232,160,32,0.04) 26%,transparent 27%,transparent 74%,rgba(232,160,32,0.04) 75%,rgba(232,160,32,0.04) 76%,transparent 77%)",
            backgroundSize: "50px 50px",
          }}
        />
        <div className="relative max-w-[1200px] mx-auto w-full">
          <div className="max-w-[680px]">
            <Link
              href="/"
              className="inline-flex items-center gap-2 font-jakarta text-[13px] mb-6 no-underline"
              style={{ color: "#6B9E83" }}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              Back to Home
            </Link>
            <div
              className="inline-block font-jakarta font-semibold text-[13px] mb-5 px-5 py-2 rounded-[50px]"
              style={{
                background: "rgba(232,160,32,0.12)",
                border: "1px solid #E8A020",
                color: "#E8A020",
              }}
            >
              Schedule a Demo
            </div>
            <h1
              className="font-display font-bold leading-tight mb-6"
              style={{ fontSize: "clamp(2rem,4vw,3.5rem)", color: "#ffffff" }}
            >
              See EduMyles in Action
            </h1>
            <p className="font-jakarta text-[18px] leading-[1.7] mb-8" style={{ color: "#A8E6C3" }}>
              Get a personalized 30-minute demo tailored to your school&apos;s needs. We now save
              every request directly into our commercial pipeline before scheduling so nothing gets
              lost.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  Request stored instantly
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  30-minute sessions
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" style={{ color: "#E8A020" }} />
                <span className="font-jakarta text-[14px]" style={{ color: "#ffffff" }}>
                  CRM-ready records
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4" style={{ background: "#F3FBF6" }}>
        <div className="max-w-[1200px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2
                className="font-display font-bold mb-4"
                style={{ fontSize: "clamp(1.8rem,3vw,2.5rem)", color: "#061A12" }}
              >
                Schedule Your Demo
              </h2>
              <p className="font-jakarta text-[16px] mb-8" style={{ color: "#5a5a5a" }}>
                Fill in your details and we&apos;ll save your request immediately, then help you
                lock in a live walkthrough.
              </p>

              {formState === "success" ? (
                <div className="rounded-2xl border border-[#d4eade] bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-[#0F4C2A]" />
                    <h3 className="font-jakarta font-bold text-[18px]" style={{ color: "#061A12" }}>
                      Demo request received
                    </h3>
                  </div>
                  <p className="mt-4 font-jakarta text-[14px] leading-7 text-[#5a5a5a]">
                    We saved your request for {fields.schoolName || "your school"} and pushed it
                    into our backend pipeline for follow-up.
                  </p>
                  {fallbackNotice ? (
                    <p className="mt-3 rounded-xl bg-[#FFF8E8] px-4 py-3 font-jakarta text-[13px] leading-6 text-[#8C5A00]">
                      {fallbackNotice}
                    </p>
                  ) : null}
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={calendarHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-jakarta font-bold text-[15px] no-underline text-center px-6 py-3 rounded-[10px]"
                      style={{ background: "#061A12", color: "#ffffff" }}
                    >
                      Continue to Calendar
                    </a>
                    <Link
                      href="/"
                      className="font-jakarta font-semibold text-[15px] no-underline text-center px-6 py-3 rounded-[10px]"
                      style={{ background: "#ffffff", color: "#061A12", border: "1px solid #d4eade" }}
                    >
                      Back to Home
                    </Link>
                  </div>
                </div>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit} noValidate>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        First Name *
                      </label>
                      <input
                        name="firstName"
                        value={fields.firstName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Last Name *
                      </label>
                      <input
                        name="lastName"
                        value={fields.lastName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Email Address *
                      </label>
                      <input
                        name="email"
                        value={fields.email}
                        onChange={handleChange}
                        type="email"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="john@school.ac.ke"
                      />
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Phone Number *
                      </label>
                      <input
                        name="phone"
                        value={fields.phone}
                        onChange={handleChange}
                        type="tel"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        School Name *
                      </label>
                      <input
                        name="schoolName"
                        value={fields.schoolName}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="Nairobi Green Academy"
                      />
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Job Title *
                      </label>
                      <input
                        name="jobTitle"
                        value={fields.jobTitle}
                        onChange={handleChange}
                        type="text"
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="Principal, Administrator, etc."
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        School Type *
                      </label>
                      <select
                        name="schoolType"
                        value={fields.schoolType}
                        onChange={handleChange}
                        required
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                      >
                        <option value="">Select school type</option>
                        <option value="primary">Primary School</option>
                        <option value="secondary">Secondary School</option>
                        <option value="mixed">Mixed Primary & Secondary</option>
                        <option value="international">International School</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Preferred Demo Date
                      </label>
                      <input
                        name="preferredDemoDate"
                        value={fields.preferredDemoDate}
                        onChange={handleChange}
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Country
                      </label>
                      <input
                        name="country"
                        value={fields.country}
                        onChange={handleChange}
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                      />
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        County / Region
                      </label>
                      <input
                        name="county"
                        value={fields.county}
                        onChange={handleChange}
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="Nairobi"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Approx. Student Count
                      </label>
                      <input
                        name="studentCount"
                        value={fields.studentCount}
                        onChange={handleChange}
                        type="number"
                        min="0"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                        placeholder="650"
                      />
                    </div>
                    <div>
                      <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                        Current System
                      </label>
                      <select
                        name="currentSystem"
                        value={fields.currentSystem}
                        onChange={handleChange}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                        style={{ color: "#212121" }}
                      >
                        <option value="">Select current system</option>
                        <option value="Paper records">Paper records</option>
                        <option value="Excel/Spreadsheets">Excel/Spreadsheets</option>
                        <option value="Nothing">Nothing</option>
                        <option value="Another school system">Another school system</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-jakarta font-semibold text-[14px] mb-2" style={{ color: "#061A12" }}>
                      Tell us about your school&apos;s needs
                    </label>
                    <textarea
                      name="needs"
                      value={fields.needs}
                      onChange={handleChange}
                      rows={4}
                      className="w-full border border-gray-200 rounded-lg px-4 py-3 font-jakarta text-[14px] outline-none focus:border-[#0F4C2A]"
                      style={{ color: "#212121", resize: "vertical" }}
                      placeholder="What challenges are you looking to solve? What features interest you most?"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-xl border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 font-jakarta text-sm text-[#9A1F2B]">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={formState === "loading"}
                    className="w-full font-jakarta font-bold text-[16px] px-8 py-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-70"
                    style={{
                      background: "#061A12",
                      color: "#ffffff",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {formState === "loading" ? "Saving your demo request..." : "Request Demo"}
                  </button>
                </form>
              )}
            </div>

            <div>
              <h3
                className="font-display font-bold mb-6"
                style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
              >
                What to Expect
              </h3>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <CalendarDays className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      Personalized Walkthrough
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      We&apos;ll show you exactly how EduMyles addresses your specific challenges
                      and workflows.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <Users className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      Live Q&A Session
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      Get answers to your specific questions from our education technology experts.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "#E8A020" }}
                  >
                    <CheckCircle className="w-6 h-6" style={{ color: "#061A12" }} />
                  </div>
                  <div>
                    <h4 className="font-jakarta font-bold text-[16px] mb-2" style={{ color: "#061A12" }}>
                      Stored for Follow-Up
                    </h4>
                    <p className="font-jakarta text-[14px] leading-[1.6]" style={{ color: "#5a5a5a" }}>
                      Your request, ad attribution, and school context are stored in our backend so
                      the team can follow up quickly and accurately.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="mt-10 p-6 rounded-2xl"
                style={{ background: "#061A12", borderLeft: "4px solid #E8A020" }}
              >
                <div className="flex mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5"
                      style={{ color: "#E8A020" }}
                      fill="#E8A020"
                    />
                  ))}
                </div>
                <p className="font-display italic text-[16px] leading-[1.7] text-white mb-4">
                  &ldquo;The demo was incredibly helpful. They understood our challenges
                  immediately and showed us exactly how EduMyles would solve them.&rdquo;
                </p>
                <p className="font-jakarta font-semibold text-[13px]" style={{ color: "#E8A020" }}>
                  Grace Njeri, Finance Officer - Nairobi Green Academy
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 px-4" style={{ background: "#ffffff" }}>
        <div className="max-w-[800px] mx-auto text-center">
          <h3
            className="font-display font-bold mb-4"
            style={{ fontSize: "clamp(1.5rem,2.5vw,2rem)", color: "#061A12" }}
          >
            Prefer to Talk Directly?
          </h3>
          <p className="font-jakarta text-[16px] mb-8" style={{ color: "#5a5a5a" }}>
            Our team is ready to answer your questions and help you get started.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <Phone className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Call Us
              </h4>
              <a
                href="tel:+254743993715"
                className="font-jakarta text-[14px] no-underline hover:underline"
                style={{ color: "#5a5a5a" }}
              >
                +254 743 993 715
              </a>
            </div>

            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <Mail className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Email Us
              </h4>
              <p className="font-jakarta text-[14px]" style={{ color: "#5a5a5a" }}>
                demo@edumyles.com
              </p>
            </div>

            <div className="p-6 rounded-xl" style={{ background: "#F3FBF6", border: "1px solid #d4eade" }}>
              <MapPin className="w-6 h-6 mb-3" style={{ color: "#0F4C2A" }} />
              <h4 className="font-jakarta font-bold text-[15px] mb-2" style={{ color: "#061A12" }}>
                Visit Us
              </h4>
              <p className="font-jakarta text-[14px]" style={{ color: "#5a5a5a" }}>
                Nairobi, Kenya
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
