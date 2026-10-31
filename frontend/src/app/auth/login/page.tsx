import Link from "next/link";
import Logo from "@/components/shared/Logo";
import {
  ArrowRight,
  GraduationCap,
  DollarSign,
  Users,
  Calendar,
  Shield,
  BarChart3,
} from "lucide-react";

const FEATURES = [
  { icon: GraduationCap, text: "Student & class management" },
  { icon: DollarSign, text: "Fees, invoices & eWallet" },
  { icon: Users, text: "HR, staff & payroll" },
  { icon: Calendar, text: "Timetable & attendance" },
  { icon: BarChart3, text: "Reports & analytics" },
  { icon: Shield, text: "Role-based access control" },
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
        className="hidden flex-col justify-between bg-[var(--platform-chrome)] p-12 text-white lg:flex lg:w-[52%] xl:w-[55%] xl:p-16">
        {/* Logo */}
        <div>
          <Logo variant="lockup" width={320} height={91} priority appearance="dark" href={null} />
        </div>

        {/* Hero copy */}
        <div className="space-y-10">
          <div className="space-y-4">
            <h1
              className="text-4xl font-bold leading-tight xl:text-5xl">
              The all-in-one platform for East African schools.
            </h1>
            <p className="text-white/80">
              Replace disconnected spreadsheets and WhatsApp groups with one unified system — from
              admissions to graduation.
            </p>
          </div>

          {/* Feature list */}
          <ul className="grid grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                  style={{ background: "rgb(255 255 255 / 14%)" }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </span>
                <span className="text-white/80">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer trust signal */}
        <p className="text-white/65">
          Trusted by schools across Kenya, Uganda, Tanzania &amp; Rwanda
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo variant="full" width={160} height={44} priority href={null} />
        </div>

        <div className="w-full max-w-md space-y-8">
          {/* Heading */}
          <div className="space-y-2">
            <h2
              className="text-3xl font-bold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-muted-foreground">
              Sign in to your EduMyles account to continue.
            </p>
          </div>

          {/* Error banner */}
          {params.error && (
            <div className="rounded-lg border border-danger/30 bg-danger-muted px-4 py-3 text-sm text-danger-muted-foreground">
              Something went wrong. Please try signing in again.
            </div>
          )}

          {/* Primary CTA */}
          <div className="space-y-4">
            <a
              href={loginHref}
              className="group flex h-[var(--control-touch)] w-full items-center justify-center gap-3 rounded-[var(--radius-control)] bg-primary px-6 text-base font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
            >
              Continue to Sign In
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>Secure sign-in powered by WorkOS</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          {/* What to expect */}
          <div className="rounded-xl border border-border bg-muted p-4">
            <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              You will be able to
            </p>
            <ul className="space-y-1.5 text-sm text-secondary-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                Access your school dashboard and modules
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                Manage students, staff, fees and more
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-success" />
                View reports, timetables and communications
              </li>
            </ul>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground">
            New to EduMyles?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold text-primary underline-offset-2 hover:underline">
              Create an account
            </Link>
          </p>

          <p className="text-center text-sm text-muted-foreground">
            Forgot your password?{" "}
            <Link
              href="/auth/password-reset"
              className="font-semibold text-primary underline-offset-2 hover:underline">
              Reset it with WorkOS
            </Link>
          </p>

          {/* Help */}
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
