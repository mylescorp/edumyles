"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  MapPinned,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Logo from "@/components/shared/Logo";

type FormState = "idle" | "loading" | "error";

const ROLE_OPTIONS = [
  { value: "school_admin", label: "School Owner / Director" },
  { value: "principal", label: "Principal / Head Teacher" },
  { value: "bursar", label: "Bursar / Finance Lead" },
  { value: "hr_manager", label: "HR / Operations Lead" },
  { value: "teacher", label: "Teacher / Academic Lead" },
  { value: "partner", label: "Partner / Institution Representative" },
];

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

const COUNTY_OPTIONS: Record<string, string[]> = {
  Kenya: [
    "Mombasa",
    "Kwale",
    "Kilifi",
    "Tana River",
    "Lamu",
    "Taita-Taveta",
    "Garissa",
    "Wajir",
    "Mandera",
    "Marsabit",
    "Isiolo",
    "Meru",
    "Tharaka-Nithi",
    "Embu",
    "Kitui",
    "Machakos",
    "Makueni",
    "Nyandarua",
    "Nyeri",
    "Kirinyaga",
    "Murang'a",
    "Kiambu",
    "Turkana",
    "West Pokot",
    "Samburu",
    "Trans Nzoia",
    "Uasin Gishu",
    "Elgeyo-Marakwet",
    "Nandi",
    "Baringo",
    "Laikipia",
    "Nakuru",
    "Narok",
    "Kajiado",
    "Kericho",
    "Bomet",
    "Kakamega",
    "Vihiga",
    "Bungoma",
    "Busia",
    "Siaya",
    "Kisumu",
    "Homa Bay",
    "Migori",
    "Kisii",
    "Nyamira",
    "Nairobi",
  ],
  Uganda: ["Kampala", "Wakiso", "Mukono", "Gulu", "Mbarara", "Jinja", "Mbale", "Other"],
  Tanzania: ["Dar es Salaam", "Arusha", "Mwanza", "Dodoma", "Mbeya", "Morogoro", "Other"],
  Rwanda: ["Kigali", "Northern Province", "Southern Province", "Eastern Province", "Western Province"],
  Zambia: ["Lusaka", "Copperbelt", "Central", "Southern", "Eastern", "Northern", "Other"],
  "South Sudan": ["Juba", "Central Equatoria", "Western Bahr el Ghazal", "Jonglei", "Other"],
  Ethiopia: ["Addis Ababa", "Oromia", "Amhara", "Tigray", "Sidama", "Other"],
  Other: ["Other"],
};

const inputClass =
  "w-full rounded-xl border border-[#dbe9e0] bg-white px-4 py-3.5 font-jakarta text-[15px] text-[#061A12] outline-none transition-colors duration-200 focus:border-[#0F4C2A]";

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpPageFallback />}>
      <SignUpPageContent />
    </Suspense>
  );
}

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: searchParams.get("email") ?? "",
    phone: "",
    country: "Kenya",
    county: "Nairobi",
    schoolName: "",
    requestedRole: "school_admin",
    message: "",
  });

  const countyOptions = COUNTY_OPTIONS[fields.country] ?? ["Other"];

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    if (event.target.name === "country") {
      const nextCountry = event.target.value;
      setFields((current) => ({
        ...current,
        country: nextCountry,
        county: COUNTY_OPTIONS[nextCountry]?.[0] ?? "",
      }));
      return;
    }

    setFields((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState("loading");
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        alreadyExists?: boolean;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "We couldn't submit your application right now.");
      }

      const query = new URLSearchParams({
        email: fields.email,
        school: fields.schoolName,
      });
      if (payload.alreadyExists) query.set("duplicate", "1");

      router.push(`/auth/signup/success?${query.toString()}`);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't submit your application right now."
      );
      setFormState("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF6F1]">
      <div className="grid min-h-screen xl:grid-cols-[minmax(0,1.7fr)_minmax(540px,0.95fr)]">
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
              <Sparkles className="h-4 w-4" />
              Client Application
            </div>
            <h1 className="font-playfair text-[clamp(2.4rem,5vw,5rem)] font-bold leading-[0.98] text-white">
              Launch your
              <br />
              EduMyles onboarding
              <br />
              with confidence.
            </h1>
            <p className="mt-6 max-w-2xl font-jakarta text-[18px] leading-8 text-[#A8E6C3]">
              Share your institution details once, and we will route your application into a guided approval workflow. Our onboarding team reviews every request, confirms the right rollout path, and reaches out with tailored next steps.
            </p>
          </div>

          <div className="mt-12 grid max-w-5xl gap-4 lg:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Reviewed with care",
                body: "Every application is assessed carefully before access is activated so onboarding stays structured and secure.",
              },
              {
                icon: Building2,
                title: "Tailored setup plan",
                body: "We align your onboarding around your school structure, rollout priority, and preferred modules.",
              },
              {
                icon: MessageSquareText,
                title: "Fast, human follow-up",
                body: "You’ll hear from us with next steps, expected timeline, and the best channel to continue onboarding.",
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

          <div className="mt-12 grid max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-[rgba(168,230,195,0.14)] bg-[rgba(255,255,255,0.04)] p-6 xl:p-8">
              <h2 className="font-playfair text-[28px] font-bold text-white">
                What to expect after you apply
              </h2>
              <div className="mt-6 space-y-4">
                {[
                  "Your application is added to the EduMyles approval queue instantly.",
                  "Our onboarding team reviews your institution profile and contact details.",
                  "We reach out to confirm rollout needs, modules, and onboarding timeline.",
                  "Once approved, we guide you through activation and setup."
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(232,160,32,0.16)] font-jakarta text-xs font-bold text-[#E8A020]">
                      {index + 1}
                    </div>
                    <p className="font-jakarta text-[14px] leading-7 text-[#D7F3E2]">{step}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[20px] border border-[rgba(232,160,32,0.18)] bg-[rgba(232,160,32,0.08)] p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#E8A020]" />
                  <div>
                    <h3 className="font-jakarta text-[15px] font-bold text-[#F7C867]">
                      Recommended for school leaders
                    </h3>
                    <p className="mt-2 font-jakarta text-[14px] leading-7 text-[#E8F5EE]">
                      Include your institution name, operating location, and your current priority areas so our team can prepare a sharper onboarding conversation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(232,160,32,0.22)] bg-[rgba(232,160,32,0.08)] p-6 xl:p-8">
              <h2 className="font-jakarta text-[15px] font-bold text-[#E8A020]">
                Need to speak with us before approval?
              </h2>
              <p className="mt-2 font-jakarta text-[14px] leading-7 text-[#D7F3E2]">
                Reach our onboarding or commercial team if you want to discuss timelines, partnerships, or a guided demo before your application is reviewed.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-[#F3FBF6] sm:grid-cols-2 xl:grid-cols-1">
                <a href="mailto:sales@edumyles.com" className="flex items-center gap-2 text-inherit no-underline hover:text-[#E8A020]">
                  <Mail className="h-4 w-4" />
                  sales@edumyles.com
                </a>
                <a href="mailto:contact@edumyles.com" className="flex items-center gap-2 text-inherit no-underline hover:text-[#E8A020]">
                  <Mail className="h-4 w-4" />
                  contact@edumyles.com
                </a>
                <a href="tel:+254743993715" className="flex items-center gap-2 text-inherit no-underline hover:text-[#E8A020]">
                  <Phone className="h-4 w-4" />
                  +254 743 993 715
                </a>
                <a
                  href="https://wa.me/254743993715?text=Hello%20EduMyles%2C%20I%20just%20submitted%20our%20school%20application%20and%20would%20love%20to%20connect."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-inherit no-underline hover:text-[#E8A020]"
                >
                  <MessageSquareText className="h-4 w-4" />
                  WhatsApp our team
                </a>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(168,230,195,0.15)] bg-[rgba(255,255,255,0.04)] px-4 py-2 font-jakarta text-[12px] font-semibold tracking-[0.08em] text-[#A8E6C3]">
              <ArrowRight className="h-4 w-4 text-[#E8A020]" />
              Trusted onboarding for schools across East Africa
            </div>
          </div>
        </section>

        <section className="flex w-full items-start bg-[#F7FBF8] px-6 py-10 sm:px-10 lg:px-12 xl:px-14 xl:py-14">
          <div className="mx-auto w-full max-w-[620px]">
          <div className="mb-8 pb-6">
            <p className="font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1A7A4A]">
              Apply for access
            </p>
            <h2 className="mt-2 font-playfair text-[clamp(2rem,3vw,2.7rem)] font-bold text-[#061A12]">
              Applicant details
            </h2>
            <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
              Complete your profile with the details our onboarding team needs to assess your institution and contact you quickly.
            </p>
          </div>

          <form className="space-y-7" onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-[#1A7A4A]" />
                <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                  Primary contact
                </h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    First name
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                    <input
                      id="firstName"
                      name="firstName"
                      required
                      value={fields.firstName}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                      placeholder="Mary"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="lastName" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    Last name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    required
                    value={fields.lastName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Kamau"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                  Work email
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
                    placeholder="you@school.ac.ke"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                  Phone number
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
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[#1A7A4A]" />
                <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                  Institution location
                </h3>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
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
                <div>
                  <label htmlFor="county" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    County / State / Region
                  </label>
                  <div className="relative">
                    <MapPinned className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                    <select
                      id="county"
                      name="county"
                      value={fields.county}
                      onChange={handleChange}
                      className={`${inputClass} pl-10`}
                    >
                      {countyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#1A7A4A]" />
                <h3 className="font-jakarta text-[13px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                  Institution profile
                </h3>
              </div>
              <div>
                <label htmlFor="schoolName" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                  School or institution name
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B9E83]" />
                  <input
                    id="schoolName"
                    name="schoolName"
                    required
                    value={fields.schoolName}
                    onChange={handleChange}
                    className={`${inputClass} pl-10`}
                    placeholder="Green Valley Academy"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="requestedRole" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                    You’re applying as
                  </label>
                  <select
                    id="requestedRole"
                    name="requestedRole"
                    value={fields.requestedRole}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="rounded-[18px] border border-[#e5efe9] bg-white px-4 py-3">
                  <p className="font-jakarta text-[11px] font-bold uppercase tracking-[0.14em] text-[#1A7A4A]">
                    Application quality tip
                  </p>
                  <p className="mt-2 font-jakarta text-[13px] leading-6 text-[#5d6f66]">
                    Mention your immediate priorities such as admissions, fees, academics, HR, or parent engagement.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block font-jakarta text-sm font-semibold text-[#061A12]">
                Tell us what you need most
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                value={fields.message}
                onChange={handleChange}
                className={`${inputClass} min-h-[140px] resize-y`}
                placeholder="Example: We want to streamline admissions, fees, and parent communication across two campuses."
              />
              <p className="mt-2 font-jakarta text-[12px] leading-5 text-[#7b8f85]">
                This helps us prepare a more relevant onboarding conversation before we contact you.
              </p>
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
              {formState === "loading" ? "Submitting your application..." : "Submit application"}
            </button>

            <div className="rounded-[20px] border border-[#e3ece6] bg-white px-5 py-4">
              <p className="font-jakarta text-[13px] leading-6 text-[#6B9E83]">
                By applying, you’re requesting onboarding review for your institution. We’ll contact you with next steps, onboarding guidance, and any clarification we may need before activation.
              </p>
            </div>
          </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function SignUpPageFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF6F1] px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-xl rounded-[28px] bg-white px-8 py-12 text-center shadow-[0_24px_64px_rgba(6,26,18,0.08)]">
        <p className="font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1A7A4A]">
          Preparing application
        </p>
        <h1 className="mt-3 font-playfair text-[2rem] font-bold text-[#061A12]">
          Loading your signup form...
        </h1>
        <p className="mt-4 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
          Please hold for a moment while we prepare your onboarding application.
        </p>
      </div>
    </main>
  );
}
