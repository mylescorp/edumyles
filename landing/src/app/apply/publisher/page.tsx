"use client";

import React, { useState, Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Code2,
  Globe2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
  Users,
  Briefcase,
  Zap,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import { trackFormSubmission, trackLeadConversion } from "@/lib/analytics";

type FormState = "idle" | "loading" | "error" | "success";

const BUSINESS_TYPES = [
  {
    value: "individual",
    label: "Individual Developer",
    description: "Solo developer or small team",
  },
  { value: "company", label: "Company", description: "Registered business entity" },
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

const POPULAR_MODULES = [
  "Student Information System",
  "Admissions",
  "Finance and Fees",
  "Timetable",
  "Academics",
  "HR and Staff",
  "Library",
  "Transport",
  "Communications",
  "User Management",
  "Support Tickets",
  "eWallet",
  "School Shop",
];

const inputClass =
  "w-full rounded-xl border border-[#dbe9e0] bg-white px-4 py-3.5 font-jakarta text-[15px] text-[#061A12] outline-none transition-colors duration-200 focus:border-[#0F4C2A]";

function PublisherApplicationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const isDeveloperRoute = pathname.startsWith("/apply/developer");
  const applicationBasePath = isDeveloperRoute ? "/apply/developer" : "/apply/publisher";
  const programLabel = isDeveloperRoute ? "developer" : "publisher";
  const programTitle = isDeveloperRoute ? "Developer" : "Publisher";
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const [fields, setFields] = useState({
    businessName: "",
    email: "",
    businessType: "individual" as "individual" | "company",
    businessDescription: "",
    website: "",
    contactPhone: "",
    contactAddress: "",
    country: "Kenya",
    experience: "",
    modules: [] as string[],
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  function handleModuleToggle(module: string) {
    setSelectedModules((current) =>
      current.includes(module) ? current.filter((m) => m !== module) : [...current, module]
    );

    setFields((current) => ({
      ...current,
      modules: selectedModules.includes(module)
        ? current.modules.filter((m) => m !== module)
        : [...current.modules, module],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");

    try {
      const response = await fetch(
        isDeveloperRoute ? "/api/developer/apply" : "/api/publisher/apply",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fields),
        }
      );

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        applicationId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We couldn't submit your application right now.");
      }

      setFormState("success");
      const conversionName = isDeveloperRoute
        ? "developer_application"
        : "publisher_application";
      trackFormSubmission(conversionName, true);
      trackLeadConversion(conversionName, { application_id: payload.applicationId });
      // Redirect to success page after a short delay
      setTimeout(() => {
        router.push(`${applicationBasePath}/success?id=${payload.applicationId}`);
      }, 2000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't submit your application right now."
      );
      trackFormSubmission(isDeveloperRoute ? "developer_application" : "publisher_application", false);
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
            Your {programLabel} application has been submitted successfully. We&apos;ll review it
            and get back to you within 3-5 business days.
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
              <Code2 className="h-4 w-4" />
              Developer Program
            </div>
            <h1 className="font-display text-[clamp(2.4rem,5vw,5rem)] font-bold leading-[0.98] text-white">
              Become an EduMyles
              <br />
              Module Developer
            </h1>
            <p className="mt-6 max-w-2xl font-jakarta text-[18px] leading-8 text-[#A8E6C3]">
              Build and sell modules for the EduMyles platform. Reach thousands of schools across
              East Africa and earn recurring revenue from your innovations.
            </p>
          </div>

          <div className="mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
            {[
              {
                icon: Zap,
                title: "Recurring Revenue",
                body: "Earn monthly income from every school that uses your modules with our transparent revenue sharing.",
              },
              {
                icon: Users,
                title: "Massive Market",
                body: "Access thousands of schools across Kenya, Uganda, Tanzania, Rwanda, and other East African markets.",
              },
              {
                icon: ShieldCheck,
                title: "Platform Support",
                body: "We handle hosting, payments, support, and marketing while you focus on building great modules.",
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
            <h2 className="font-display text-[28px] font-bold text-white">
              {programTitle} Tiers
            </h2>
            <div className="mt-6 space-y-4">
              {[
                {
                  tier: "Indie",
                  description: "Perfect for individual developers",
                  features: ["Up to 5 modules", "Basic analytics", "Community support"],
                },
                {
                  tier: "Verified",
                  description: "For established developers",
                  features: [
                    "Up to 20 modules",
                    "Advanced analytics",
                    "Priority support",
                    "Marketing tools",
                  ],
                },
                {
                  tier: "Enterprise",
                  description: "For large development teams",
                  features: [
                    "Unlimited modules",
                    "White-label options",
                    "Dedicated support",
                    "Custom integrations",
                  ],
                },
              ].map((tier) => (
                <div key={tier.tier} className="border-l-2 border-[#E8A020] pl-4">
                  <h3 className="font-jakarta text-[16px] font-bold text-[#E8A020]">{tier.tier}</h3>
                  <p className="font-jakarta text-[13px] text-[#A8E6C3] mt-1">{tier.description}</p>
                  <ul className="mt-2 space-y-1">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="font-jakarta text-[12px] text-[#D7F3E2] flex items-center gap-2"
                      >
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
                Developer Application
              </p>
              <h2 className="mt-2 font-display text-[clamp(2rem,3vw,2.7rem)] font-bold text-[#061A12]">
                Developer Information
              </h2>
              <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
                Tell us about your development experience and the modules you&apos;d like to build
                for schools.
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
                  <label
                    htmlFor="businessName"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Business or Developer Name
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    required
                    value={fields.businessName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Tech Solutions Ltd"
                  />
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
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="businessType"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Business Type
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
                  <label
                    htmlFor="businessDescription"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Business Description
                  </label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    rows={4}
                    value={fields.businessDescription}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[120px] resize-y`}
                    placeholder="Describe your development experience and expertise..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="website"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
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
                    <label
                      htmlFor="contactPhone"
                      className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                    >
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
                    htmlFor="contactAddress"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
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

              {/* Development Experience */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Development Experience
                  </h3>
                </div>

                <div>
                  <label
                    htmlFor="experience"
                    className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]"
                  >
                    Tell us about your development experience
                  </label>
                  <textarea
                    id="experience"
                    name="experience"
                    rows={4}
                    value={fields.experience}
                    onChange={handleChange}
                    className={`${inputClass} min-h-[120px] resize-y`}
                    placeholder="Share your experience with educational software, school management systems, or relevant technologies..."
                  />
                </div>
              </div>

              {/* Module Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[#1A7A4A]" />
                  <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Modules You Want to Build
                  </h3>
                </div>

                <p className="font-jakarta text-[13px] text-[#5d6f66]">
                  Select all modules you&apos;re interested in developing for the EduMyles platform:
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {POPULAR_MODULES.map((module) => (
                    <label
                      key={module}
                      className="flex items-center gap-3 p-3 rounded-lg border border-[#dbe9e0] bg-white cursor-pointer hover:border-[#0F4C2A] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(module)}
                        onChange={() => handleModuleToggle(module)}
                        className="w-4 h-4 text-[#0F4C2A] rounded focus:ring-[#0F4C2A]"
                      />
                      <span className="font-jakarta text-[14px] text-[#061A12]">{module}</span>
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
                  : `Submit ${programTitle} Application`}
              </button>

              <div className="rounded-[20px] border border-[#e3ece6] bg-white px-5 py-4">
                <p className="font-jakarta text-[13px] leading-6 text-[#6B9E83]">
                  By submitting this application, you agree to our {programLabel} terms and
                  conditions. We&apos;ll review your application and contact you within 3-5 business
                  days.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function PublisherApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PublisherApplicationContent />
    </Suspense>
  );
}
