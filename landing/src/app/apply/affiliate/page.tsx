"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  FileText,
  Briefcase,
  Target,
  TrendingUp,
  Handshake,
  Share2,
  Link2,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";

type FormState = "idle" | "loading" | "error" | "success";

const COUNTRY_OPTIONS = [
  "Kenya",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Zambia",
  "South Sudan",
  "Ethiopia",
  "Other",
];

const REFERRAL_CHANNELS = [
  "Social Media (Facebook, Twitter, LinkedIn)",
  "WhatsApp Groups",
  "Email Marketing",
  "Content Marketing (Blog, YouTube)",
  "Personal Network",
  "School Communities",
  "Educational Forums",
  "Professional Networks",
  "Community Events",
  "Digital Advertising",
  "Print Media",
  "Other",
];

const AFFILIATE_BENEFITS = [
  "Earn 10% commission on all school subscriptions",
  "30-day cookie tracking for referred schools",
  "Real-time commission dashboard",
  "Marketing materials and referral links",
  "Monthly payout reports",
  "Dedicated affiliate support",
];

const inputClass =
  "w-full rounded-xl border border-[#dbe9e0] bg-white px-4 py-3.5 font-jakarta text-[15px] text-[#061A12] outline-none transition-colors duration-200 focus:border-[#0F4C2A]";

function AffiliateApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);

  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "Kenya",
    address: "",
    website: "",
    socialMedia: "",
    experience: "",
    targetAudience: "",
    referralChannels: [] as string[],
    promotionStrategy: "",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleChannelToggle(channel: string) {
    setSelectedChannels((current) =>
      current.includes(channel) ? current.filter((c) => c !== channel) : [...current, channel]
    );

    setFields((current) => ({
      ...current,
      referralChannels: selectedChannels.includes(channel)
        ? current.referralChannels.filter((c) => c !== channel)
        : [...current.referralChannels, channel],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");

    try {
      const response = await fetch("/api/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        applicationId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We couldn't submit your application right now.");
      }

      setFormState("success");
      trackFormSubmission("affiliate_application", true);
      trackLeadConversion("affiliate_application", { application_id: payload.applicationId });
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/apply/affiliate/success?id=${payload.applicationId}`);
      }, 2000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't submit your application right now."
      );
      trackFormSubmission("affiliate_application", false);
      setFormState("error");
    }
  }

  if (formState === "success") {
    return (
      <main className="min-h-screen bg-[#EEF6F1] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#0F4C2A] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-3xl font-bold text-[#061A12] mb-4">
            Application Submitted!
          </h1>
          <p className="font-jakarta text-[#5d6f66] mb-6">
            Your affiliate application has been submitted successfully. We&apos;ll review it and get
            back to you within 3-5 business days.
          </p>
          <div className="animate-spin w-6 h-6 border-2 border-[#0F4C2A] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EEF6F1]">
      <div className="grid min-h-screen xl:grid-cols-[minmax(0,1.7fr)_minmax(540px,0.95fr)]">
        {/* Left Panel - Information */}
        <section className="flex h-full flex-col bg-[linear-gradient(180deg,#072015_0%,#0A2A1C_55%,#0C301F_100%)] px-8 py-10 text-white sm:px-12 lg:px-16 xl:px-16 xl:py-14">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Logo size="md" />
            <Link
              href="/"
              className="font-jakarta text-sm font-semibold text-[#A8E6C3] no-underline transition-colors hover:text-[#E8A020]"
            >
              Back to site
            </Link>
          </div>

          <div className="max-w-3xl pt-8 xl:pt-20">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8A020] bg-[rgba(232,160,32,0.12)] px-4 py-2 font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#E8A020]">
              <Share2 className="h-4 w-4" />
              Affiliate Program
            </div>
            <h1 className="font-display text-[clamp(2.4rem,5vw,5rem)] font-bold leading-[0.98] text-white">
              Earn by Sharing
              <br />
              EduMyles
            </h1>
            <p className="mt-6 max-w-2xl font-jakarta text-[18px] leading-8 text-[#A8E6C3]">
              Join our affiliate program and earn 10% commission by referring schools to EduMyles.
              No sales experience required - just share your referral link and earn when schools
              subscribe.
            </p>
          </div>

          <div className="mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "10% Commission",
                body: "Earn 10% commission on every school subscription that comes through your referral link.",
              },
              {
                icon: Link2,
                title: "30-Day Tracking",
                body: "Get credit for schools that sign up within 30 days of clicking your referral link.",
              },
              {
                icon: ShieldCheck,
                title: "Trusted Platform",
                body: "Promote a proven school management system that schools actually need and love.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-[rgba(168,230,195,0.16)] bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-sm"
              >
                <item.icon className="h-6 w-6 text-[#E8A020]" />
                <h2 className="mt-3 font-jakarta text-[15px] font-bold text-white">{item.title}</h2>
                <p className="mt-2 font-jakarta text-[13px] leading-6 text-[#A8E6C3]">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[28px] border border-[rgba(168,230,195,0.14)] bg-[rgba(255,255,255,0.04)] p-6 xl:p-8">
            <h2 className="font-display text-[28px] font-bold text-white">Affiliate Benefits</h2>
            <div className="mt-6 space-y-3">
              {AFFILIATE_BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 w-4 h-4 text-[#E8A020] flex-shrink-0" />
                  <p className="font-jakarta text-[14px] text-[#D7F3E2]">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[20px] border border-[rgba(232,160,32,0.18)] bg-[rgba(232,160,32,0.08)] p-5">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8A020]" />
                <div>
                  <h3 className="font-jakarta text-[15px] font-bold text-[#F7C867]">
                    How It Works
                  </h3>
                  <ol className="mt-2 font-jakarta text-[14px] leading-7 text-[#E8F5EE] space-y-1">
                    <li>1. Sign up for the affiliate program</li>
                    <li>2. Get your unique referral link</li>
                    <li>3. Share EduMyles with schools</li>
                    <li>4. Earn 10% when they subscribe</li>
                    <li>5. Get paid monthly via M-Pesa or Bank</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Panel - Application Form */}
        <section className="flex w-full items-start bg-[#F7FBF8] px-6 py-10 sm:px-10 lg:px-12 xl:px-14 xl:py-14">
          <div className="mx-auto w-full max-w-[620px]">
            <div className="mb-8 pb-6">
              <p className="font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1A7A4A]">
                Affiliate Application
              </p>
              <h2 className="mt-2 font-display text-[clamp(2rem,3vw,2.7rem)] font-bold text-[#061A12]">
                Your Information
              </h2>
              <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
                Tell us about yourself and how you plan to share EduMyles with schools.
              </p>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit} noValidate>
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Personal Information
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      required
                      value={fields.firstName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      required
                      value={fields.lastName}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={fields.email}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="john.doe@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                      <input
                        id="phone"
                        name="phone"
                        value={fields.phone}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="+254 7..."
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="country"
                      className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                    >
                      Country
                    </label>
                    <div className="relative">
                      <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                      <select
                        id="country"
                        name="country"
                        value={fields.country}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                      >
                        {COUNTRY_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Address (Optional)
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={fields.address}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[80px] resize-y`}
                    placeholder="123 Street, City, Country"
                  />
                </div>
              </div>

              {/* Online Presence */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Online Presence
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Website or Blog (Optional)
                  </label>
                  <input
                    id="website"
                    name="website"
                    type="url"
                    value={fields.website}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="socialMedia"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Social Media Profiles (Optional)
                  </label>
                  <textarea
                    id="socialMedia"
                    name="socialMedia"
                    rows={3}
                    value={fields.socialMedia}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="LinkedIn: https://linkedin.com/in/yourname&#10;Twitter: @yourhandle&#10;Facebook: https://facebook.com/yourpage"
                  />
                </div>
              </div>

              {/* Promotion Strategy */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Promotion Strategy
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="targetAudience"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Target Audience
                  </label>
                  <textarea
                    id="targetAudience"
                    name="targetAudience"
                    rows={3}
                    value={fields.targetAudience}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Who do you plan to reach? (e.g., school administrators, teachers, parents, education professionals, specific regions)..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="experience"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Relevant Experience
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    rows={3}
                    value={fields.experience}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Share any experience with education, marketing, affiliate programs, or school communities..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="promotionStrategy"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Promotion Strategy
                  </label>
                  <textarea
                    id="promotionStrategy"
                    name="promotionStrategy"
                    rows={3}
                    value={fields.promotionStrategy}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="How do you plan to promote EduMyles? (e.g., social media posts, blog reviews, email newsletters, community sharing)..."
                  />
                </div>
              </div>

              {/* Referral Channels */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Referral Channels
                  </h3>
                </div>

                <p className="font-jakarta text-[13px] text-[#5d6f66]">
                  Select all channels you plan to use for referrals:
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {REFERRAL_CHANNELS.map((channel) => (
                    <label
                      key={channel}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#dbe9e0] bg-white cursor-pointer hover:border-[#0F4C2A] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannels.includes(channel)}
                        onChange={() => handleChannelToggle(channel)}
                        className="w-4 h-4 text-[#0F4C2A] rounded focus:ring-[#0F4C2A]"
                      />
                      <span className="font-jakarta text-[14px] text-[#061A12]">{channel}</span>
                    </label>
                  ))}
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 font-jakarta text-sm text-[#9A1F2B]">
                  {error}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={formState === "loading"}
                className="inline-flex w-full items-center justify-center rounded-[999px] border border-[#0F4C2A] bg-[#0F4C2A] px-6 py-4 font-jakarta text-[15px] font-bold text-white transition-all duration-200 hover:border-[#061A12] hover:bg-[#061A12] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {formState === "loading"
                  ? "Submitting Application..."
                  : "Submit Affiliate Application"}
              </button>

              <div className="rounded-[20px] border border-[#e3ece6] bg-white px-5 py-4">
                <p className="font-jakarta text-[13px] leading-6 text-[#6B9E83]">
                  By submitting this application, you agree to our affiliate terms and conditions.
                  We&apos;ll review your application and contact you within 3-5 business days.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AffiliateApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AffiliateApplicationContent />
    </Suspense>
  );
}
