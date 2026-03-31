import Link from "next/link";
import Image from "next/image";
import { ArrowRight, GraduationCap, DollarSign, Users, Calendar, Shield, BarChart3 } from "lucide-react";

const FEATURES = [
  { icon: GraduationCap, text: "Student & class management" },
  { icon: DollarSign,    text: "Fees, invoices & eWallet" },
  { icon: Users,         text: "HR, staff & payroll" },
  { icon: Calendar,      text: "Timetable & attendance" },
  { icon: BarChart3,     text: "Reports & analytics" },
  { icon: Shield,        text: "Role-based access control" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; error?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  if (params.returnTo) qs.set("returnTo", params.returnTo);
  const loginHref = `/auth/login/api${qs.toString() ? `?${qs.toString()}` : ""}`;

  return (
    <div className="flex min-h-screen">
      {/* ── Left brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-12 xl:p-16"
        style={{ background: "linear-gradient(160deg, #0C3020 0%, #061A12 100%)" }}
      >
        {/* Logo */}
        <div>
          <Image src="/logo-full.svg" alt="EduMyles" width={180} height={48} priority />
        </div>

        {/* Hero copy */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h1
              className="text-4xl xl:text-5xl font-bold leading-tight"
              style={{ color: "#F3FBF6", fontFamily: "var(--font-playfair)" }}
            >
              The all-in-one platform for East African schools.
            </h1>
            <p className="text-lg" style={{ color: "#A8E6C3" }}>
              Replace disconnected spreadsheets and WhatsApp groups with one
              unified system — from admissions to graduation.
            </p>
          </div>

          {/* Feature list */}
          <ul className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: "rgba(232,160,32,0.15)" }}
                >
                  <Icon className="h-4 w-4" style={{ color: "#E8A020" }} />
                </span>
                <span className="text-sm" style={{ color: "#A8E6C3" }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer trust signal */}
        <p className="text-xs" style={{ color: "#6B9E83" }}>
          Trusted by schools across Kenya, Uganda, Tanzania &amp; Rwanda
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo-full.svg" alt="EduMyles" width={160} height={44} priority />
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Heading */}
          <div className="space-y-2">
            <h2
              className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
              style={{ fontFamily: "var(--font-playfair)" }}
            >
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Sign in to your EduMyles account to continue.
            </p>
          </div>

          {/* Error banner */}
          {params.error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
              Something went wrong. Please try signing in again.
            </div>
          )}

          {/* Primary CTA */}
          <div className="space-y-4">
            <a
              href={loginHref}
              className="group flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #0F4C2A 0%, #1A7A4A 100%)" }}
            >
              Continue to Sign In
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>

            <div className="flex items-center gap-3 text-xs text-gray-400">
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span>Secure sign-in powered by WorkOS</span>
              <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          {/* What to expect */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2.5">
              You will be able to
            </p>
            <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#26A65B" }} />
                Access your school dashboard and modules
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#26A65B" }} />
                Manage students, staff, fees and more
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: "#26A65B" }} />
                View reports, timetables and communications
              </li>
            </ul>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            New to EduMyles?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "#0F4C2A" }}
            >
              Create an account
            </Link>
          </p>

          {/* Help */}
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
