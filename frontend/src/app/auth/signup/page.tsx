"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, School, Users, GraduationCap, UserCog, Heart } from "lucide-react";

const ROLES = [
  { icon: School,        label: "School Admin",  desc: "Manage the entire school" },
  { icon: UserCog,       label: "Teacher",        desc: "Classes, grades & attendance" },
  { icon: GraduationCap, label: "Student",        desc: "Your academic portal" },
  { icon: Heart,         label: "Parent",         desc: "Track your child's progress" },
  { icon: Users,         label: "Partner",        desc: "Sponsorship & finance access" },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const qs = new URLSearchParams();
    if (email.trim()) qs.set("email", email.trim());
    router.push(`/auth/signup/api?${qs.toString()}`);
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 xl:p-16"
        style={{ background: "linear-gradient(160deg, #0C3020 0%, #061A12 100%)" }}
      >
        <div>
          <Image src="/logo-full.svg" alt="EduMyles" width={180} height={48} priority />
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1
              className="text-4xl xl:text-5xl font-bold leading-tight"
              style={{ color: "#F3FBF6", fontFamily: "var(--font-playfair)" }}
            >
              Every role. One platform.
            </h1>
            <p className="text-lg" style={{ color: "#A8E6C3" }}>
              Whether you are an administrator, teacher, student or parent —
              EduMyles has a portal built for your exact needs.
            </p>
          </div>

          <div className="space-y-2.5">
            {ROLES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(168,230,195,0.15)" }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgba(232,160,32,0.15)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#E8A020" }} />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#F3FBF6" }}>{label}</p>
                  <p className="text-xs" style={{ color: "#6B9E83" }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "#6B9E83" }}>
          Set up takes less than 5 minutes · No credit card required to start
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <Image src="/logo-full.svg" alt="EduMyles" width={160} height={44} priority />
        </div>

        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <h2
              className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Get started today
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Create your EduMyles account and set up your school in minutes.
            </p>
          </div>

          <ul className="space-y-2">
            {[
              "Free to set up — pay only for active modules",
              "Instant access to all core features",
              "Kenya, Uganda, Tanzania & Rwanda supported",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "#26A65B" }} />
                {item}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Work email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.ac.ke"
                autoComplete="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-green-700 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-400">
                Pre-fills your email on the next step — you can skip this.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
              style={{ background: "linear-gradient(135deg, #0F4C2A 0%, #1A7A4A 100%)" }}
            >
              {loading ? "Redirecting…" : "Create Account"}
              {!loading && (
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              )}
            </button>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span>Secure sign-up powered by WorkOS</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
          </form>

          <p className="text-xs text-gray-400 dark:text-gray-600 text-center leading-relaxed">
            By creating an account you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-gray-600">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-gray-600">Privacy Policy</a>.
          </p>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "#0F4C2A" }}
            >
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-gray-400 dark:text-gray-600">
            Need help?{" "}
            <a href="mailto:support@edumyles.com" className="hover:underline underline-offset-2">
              support@edumyles.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
