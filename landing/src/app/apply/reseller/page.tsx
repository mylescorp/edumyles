"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import Logo from "@/components/shared/Logo";

type FormState = "idle" | "loading" | "error" | "success";

const BUSINESS_TYPES = [
  { value: "reseller", label: "Reseller", description: "Sell EduMyles licenses to schools" },
  { value: "affiliate", label: "Affiliate", description: "Refer schools and earn commissions" },
] as const;

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

const MARKETING_CHANNELS = [
  "Social Media Marketing",
  "Email Marketing", 
  "Content Marketing",
  "Direct Sales",
  "Events & Conferences",
  "Partnerships",
  "Cold Calling",
  "Referral Network",
  "Digital Advertising",
  "Print Media",
  "Radio/TV",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-[#dbe9e0] bg-white px-4 py-3.5 font-jakarta text-[15px] text-[#061A12] outline-none transition-colors duration-200 focus:border-[#0F4C2A]";

export default function ResellerApplicationPage() {
  const router = useRouter();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  
  const [fields, setFields] = useState({
    businessName: "",
    businessType: "reseller" as "reseller" | "affiliate",
    businessDescription: "",
    website: "",
    contactPhone: "",
    contactAddress: "",
    country: "Kenya",
    targetMarket: "",
    experience: "",
    marketingChannels: [] as string[],
    expectedVolume: "",
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
      current.includes(channel) 
        ? current.filter(c => c !== channel)
        : [...current, channel]
    );
    
    setFields((current) => ({
      ...current,
      marketingChannels: selectedChannels.includes(channel) 
        ? current.marketingChannels.filter(c => c !== channel)
        : [...current.marketingChannels, channel],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");

    try {
      const response = await fetch("/api/reseller/apply", {
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
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`/apply/reseller/success?id=${payload.applicationId}`);
      }, 2000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't submit your application right now."
      );
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
          <h1 className="font-playfair text-3xl font-bold text-[#061A12] mb-4">
            Application Submitted!
          </h1>
          <p className="font-jakarta text-[#5d6f66] mb-6">
            Your reseller application has been submitted successfully. We&apos;ll review it and get back to you within 3-5 business days.
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
              <Handshake className="h-4 w-4" />
              Reseller Program
            </div>
            <h1 className="font-playfair text-[clamp(2.4rem,5vw,5rem)] font-bold leading-[0.98] text-white">
              Partner with EduMyles
              <br />
              to Transform Education
            </h1>
            <p className="mt-6 max-w-2xl font-jakarta text-[18px] leading-8 text-[#A8E6C3]">
              Join our network of resellers and affiliates helping schools across East Africa adopt modern management systems. Earn competitive commissions while making a real impact.
            </p>
          </div>

          <div className="mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Competitive Commissions",
                body: "Earn up to 30% commission on school subscriptions with transparent tracking and timely payouts.",
              },
              {
                icon: Target,
                title: "Targeted Support",
                body: "Get marketing materials, training, and dedicated support to help you succeed in your market.",
              },
              {
                icon: ShieldCheck,
                title: "Trusted Platform",
                body: "Represent a proven school management system trusted by 50+ schools across East Africa.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] border border-[rgba(168,230,195,0.16)] bg-[rgba(255,255,255,0.04)] p-6 backdrop-blur-sm"
              >
                <item.icon className="h-6 w-6 text-[#E8A020]" />
                <h2 className="mt-3 font-jakarta text-[15px] font-bold text-white">{item.title}</h2>
                <p className="mt-2 font-jakarta text-[13px] leading-6 text-[#A8E6C3]">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-[28px] border border-[rgba(168,230,195,0.14)] bg-[rgba(255,255,255,0.04)] p-6 xl:p-8">
            <h2 className="font-playfair text-[28px] font-bold text-white">
              Reseller Tiers
            </h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  tier: "Starter",
                  description: "Perfect for individuals and small teams",
                  commission: "15-20%",
                  features: ["Up to 5 schools", "Basic marketing materials", "Email support"],
                },
                {
                  tier: "Silver", 
                  description: "For growing resellers",
                  commission: "20-25%",
                  features: ["Up to 15 schools", "Advanced marketing kit", "Priority support", "Training portal"],
                },
                {
                  tier: "Gold",
                  description: "For established resellers",
                  commission: "25-30%",
                  features: ["Up to 30 schools", "White-label options", "Dedicated account manager", "Custom commissions"],
                },
                {
                  tier: "Platinum",
                  description: "For enterprise partners",
                  commission: "30%+",
                  features: ["Unlimited schools", "Full white-label", "Custom integrations", "Revenue sharing"],
                },
              ].map((tier) => (
                <div key={tier.tier} className="border-l-2 border-[#E8A020] pl-4">
                  <div className="flex items-center gap-3">
                    <h3 className="font-jakarta text-[16px] font-bold text-[#E8A020]">{tier.tier}</h3>
                    <span className="bg-[rgba(232,160,32,0.2)] text-[#E8A020] px-2 py-1 rounded text-xs font-bold">
                      {tier.commission}
                    </span>
                  </div>
                  <p className="font-jakarta text-[13px] text-[#A8E6C3] mt-1">{tier.description}</p>
                  <ul className="mt-2 space-y-1">
                    {tier.features.map((feature) => (
                      <li key={feature} className="font-jakarta text-[12px] text-[#D7F3E2] flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Panel - Application Form */}
        <section className="flex w-full items-start bg-[#F7FBF8] px-6 py-10 sm:px-10 lg:px-12 xl:px-14 xl:py-14">
          <div className="mx-auto w-full max-w-[620px]">
            <div className="mb-8 pb-6">
              <p className="font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1A7A4A]">
                Reseller Application
              </p>
              <h2 className="mt-2 font-playfair text-[clamp(2rem,3vw,2.7rem)] font-bold text-[#061A12]">
                Partner Information
              </h2>
              <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
                Tell us about your business and how you plan to help schools discover EduMyles.
              </p>
            </div>

            <form className="space-y-7" onSubmit={handleSubmit} noValidate>
              {/* Business Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Business Information
                  </h3>
                </div>
                
                <div>
                  <label htmlFor="businessName" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Business or Organization Name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    required
                    value={fields.businessName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="EduTech Solutions Ltd"
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Partnership Type
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={fields.businessType}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {BUSINESS_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="businessDescription" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Business Description
                  </label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    rows={4}
                    value={fields.businessDescription}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[120px] resize-y`}
                    placeholder="Describe your business and experience in the education sector..."
                  />
                </div>

                <div>
                  <label htmlFor="website" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Website (Optional)
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
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserRound className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Contact Information
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contactPhone" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                      <input
                        id="contactPhone"
                        name="contactPhone"
                        required
                        value={fields.contactPhone}
                        onChange={handleChange}
                        className={`${inputClass} pl-10`}
                        placeholder="+254 7..."
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
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
                  <label htmlFor="contactAddress" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Business Address
                  </label>
                  <textarea
                    id="contactAddress"
                    name="contactAddress"
                    rows={3}
                    value={fields.contactAddress}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="123 Business Street, City, Country"
                  />
                </div>
              </div>

              {/* Market & Experience */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Target Market & Experience
                  </h3>
                </div>

                <div>
                  <label htmlFor="targetMarket" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Target Market
                  </label>
                  <textarea
                    id="targetMarket"
                    name="targetMarket"
                    rows={3}
                    value={fields.targetMarket}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Describe the types of schools you plan to target (e.g., primary schools, secondary schools, private schools, specific regions)..."
                  />
                </div>

                <div>
                  <label htmlFor="experience" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Relevant Experience
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    rows={3}
                    value={fields.experience}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[100px] resize-y`}
                    placeholder="Share your experience in education sales, school management systems, or B2B sales..."
                  />
                </div>

                <div>
                  <label htmlFor="expectedVolume" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Expected Sales Volume
                  </label>
                  <select
                    id="expectedVolume"
                    name="expectedVolume"
                    value={fields.expectedVolume}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select expected volume</option>
                    <option value="1-5 schools per quarter">1-5 schools per quarter</option>
                    <option value="6-15 schools per quarter">6-15 schools per quarter</option>
                    <option value="16-30 schools per quarter">16-30 schools per quarter</option>
                    <option value="30+ schools per quarter">30+ schools per quarter</option>
                  </select>
                </div>
              </div>

              {/* Marketing Channels */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Marketing Channels
                  </h3>
                </div>

                <p className="font-jakarta text-[13px] text-[#5d6f66]">
                  Select all marketing channels you plan to use:
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {MARKETING_CHANNELS.map((channel) => (
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
                {formState === "loading" ? "Submitting Application..." : "Submit Reseller Application"}
              </button>

              <div className="rounded-[20px] border border-[#e3ece6] bg-white px-5 py-4">
                <p className="font-jakarta text-[13px] leading-6 text-[#6B9E83]">
                  By submitting this application, you agree to our reseller terms and conditions. We&apos;ll review your application and contact you within 3-5 business days.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
