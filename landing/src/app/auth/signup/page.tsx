"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Building2,
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

const inputClass =
  "w-full rounded-xl border border-[#dbe9e0] bg-white px-4 py-3.5 font-jakarta text-[15px] text-[#061A12] outline-none transition-colors duration-200 focus:border-[#0F4C2A]";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formState, setFormState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState({
    firstName: "",
    lastName: "",
    email: searchParams.get("email") ?? "",
    phone: "",
    schoolName: "",
    requestedRole: "school_admin",
    message: "",
  });

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
    <main className="min-h-screen bg-[#F3FBF6] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-stretch">
        <section className="flex-1 rounded-[28px] bg-[#061A12] px-6 py-8 text-white shadow-[0_24px_64px_rgba(6,26,18,0.18)] sm:px-8 sm:py-10 lg:px-10">
          <div className="mb-10 flex items-center justify-between gap-4">
            <Logo size="md" />
            <Link
              href="/"
              className="font-jakarta text-sm font-semibold text-[#A8E6C3] no-underline transition-colors hover:text-[#E8A020]"
            >
              Back to site
            </Link>
          </div>

          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8A020] bg-[rgba(232,160,32,0.12)] px-4 py-2 font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#E8A020]">
              <Sparkles className="h-4 w-4" />
              Client Application
            </div>
            <h1 className="font-playfair text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.05] text-white">
              Start your EduMyles onboarding the right way.
            </h1>
            <p className="mt-5 max-w-lg font-jakarta text-[16px] leading-8 text-[#A8E6C3]">
              Submit your school application and our master admin team will review it personally.
              We vet each request to keep onboarding structured, secure, and fast for every institution.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Reviewed by our team",
                body: "Every request is checked by EduMyles platform leadership before activation.",
              },
              {
                icon: Building2,
                title: "Tailored onboarding",
                body: "We set up your school, align the right modules, and guide your rollout plan.",
              },
              {
                icon: MessageSquareText,
                title: "Fast follow-up",
                body: "You’ll hear from us with next steps, timeline, and the best contact channel to continue.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[rgba(168,230,195,0.16)] bg-[rgba(255,255,255,0.04)] p-5"
              >
                <item.icon className="h-6 w-6 text-[#E8A020]" />
                <h2 className="mt-3 font-jakarta text-[15px] font-bold text-white">{item.title}</h2>
                <p className="mt-2 font-jakarta text-[13px] leading-6 text-[#A8E6C3]">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-[rgba(232,160,32,0.22)] bg-[rgba(232,160,32,0.08)] p-5">
            <h2 className="font-jakarta text-[15px] font-bold text-[#E8A020]">Need to speak with us before approval?</h2>
            <div className="mt-4 grid gap-3 text-sm text-[#F3FBF6] sm:grid-cols-2">
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
        </section>

        <section className="w-full rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_64px_rgba(6,26,18,0.08)] sm:px-8 sm:py-10 lg:max-w-[520px]">
          <div className="mb-8">
            <p className="font-jakarta text-[12px] font-semibold uppercase tracking-[0.18em] text-[#1A7A4A]">
              Apply for access
            </p>
            <h2 className="mt-2 font-playfair text-[2rem] font-bold text-[#061A12]">
              Tell us about your school
            </h2>
            <p className="mt-3 font-jakarta text-[15px] leading-7 text-[#5d6f66]">
              Once submitted, your application is added to the EduMyles waitlist and routed to our master admin for immediate review.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
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

            <div className="grid gap-5 sm:grid-cols-2">
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

            <p className="text-center font-jakarta text-[13px] leading-6 text-[#6B9E83]">
              By applying, you’re asking our onboarding team to review your school for activation.
              We’ll reach out with next steps after review.
            </p>
          </form>
        </section>
      </div>
    </main>
  );
}
