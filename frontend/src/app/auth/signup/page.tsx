"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/shared/Logo";
import {
  ArrowRight,
  CheckCircle,
  School,
  Users,
  GraduationCap,
  UserCog,
  Heart,
} from "lucide-react";

const ROLES = [
  { icon: School, label: "School Admin", desc: "Manage the entire school" },
  { icon: UserCog, label: "Teacher", desc: "Classes, grades & attendance" },
  { icon: GraduationCap, label: "Student", desc: "Your academic portal" },
  { icon: Heart, label: "Parent", desc: "Track your child's progress" },
  { icon: Users, label: "Partner", desc: "Sponsorship & finance access" },
];

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign Up | EduMyles";
  }, []);

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
        className="hidden flex-col justify-between bg-[var(--platform-chrome)] p-12 text-white lg:flex lg:w-[52%] xl:w-[55%] xl:p-16">
        <div>
          <Logo variant="lockup" width={320} height={91} priority appearance="dark" href={null} />
        </div>

        <div className="space-y-10">
          <div className="space-y-4">
            <h1
              className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Every role. One platform.
            </h1>
            <p className="text-white/80">
              Whether you are an administrator, teacher, student or parent — EduMyles has a portal
              built for your exact needs.
            </p>
          </div>

          <div className="space-y-2.5">
            {ROLES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{
                  background: "rgb(255 255 255 / 6%)",
                  border: "1px solid rgb(255 255 255 / 14%)",
                }}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: "rgb(255 255 255 / 14%)" }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {label}
                  </p>
                  <p className="text-white/65">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/65">
          Set up takes less than 5 minutes · No credit card required to start
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="mb-8 lg:hidden">
          <Logo variant="full" width={160} height={44} priority href={null} />
        </div>

        <div className="w-full max-w-md space-y-7">
          <div className="space-y-2">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground">
              Get started today
            </h2>
            <p className="text-muted-foreground">
              Create your EduMyles account and set up your school in minutes.
            </p>
          </div>

          <ul className="space-y-2">
            {[
              "Free to set up — pay only for active modules",
              "Instant access to all core features",
              "Kenya, Uganda, Tanzania & Rwanda supported",
            ].map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-secondary-foreground"
              >
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                {item}
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Work email <span className="font-normal text-muted-foreground">(optional)</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.ac.ke"
                autoComplete="email"
                className="h-[var(--control-touch)] w-full rounded-[var(--radius-control)] border border-input bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              />
              <p className="text-xs text-muted-foreground">
                Pre-fills your email on the next step — you can skip this.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group flex h-[var(--control-touch)] w-full items-center justify-center gap-3 rounded-[var(--radius-control)] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? "Redirecting…" : "Create Account"}
              {!loading && (
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              )}
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Secure sign-up powered by WorkOS</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </form>

          <p className="text-center text-xs leading-relaxed text-muted-foreground">
            By creating an account you agree to our{" "}
            <a href="/terms" className="underline underline-offset-2 hover:text-foreground">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline underline-offset-2 hover:text-foreground">
              Privacy Policy
            </a>
            .
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary underline-offset-2 hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
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
