import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  BarChart3,
  GraduationCap,
  Shield,
  Users,
  WalletCards,
} from "lucide-react";
import Logo from "@/components/shared/Logo";
import "./login.css";

export const metadata: Metadata = {
  title: "Sign in to EduMyles",
  description: "Securely sign in to your EduMyles school management account.",
  robots: { index: false, follow: false },
};

const capabilities = [
  { label: "Student & class management", icon: GraduationCap },
  { label: "Fees, invoices & eWallet", icon: WalletCards },
  { label: "HR, staff & payroll", icon: Users },
  { label: "Timetable & attendance", icon: CalendarDays },
  { label: "Reports & analytics", icon: BarChart3 },
  { label: "Role-based access control", icon: Shield },
];

const outcomes = [
  "Access your school dashboard and modules",
  "Manage students, staff, fees and more",
  "View reports, timetables and communications",
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const signInHref = returnTo
    ? { pathname: "/auth/login", query: { returnTo } }
    : "/auth/login";

  return (
    <main className="login-screen">
      <section className="login-story" aria-labelledby="login-story-heading">
        <div className="login-brand">
          <Logo variant="full" width={200} height={56} appearance="dark" />
        </div>

        <div className="login-story-copy">
          <h1 id="login-story-heading">The all-in-one platform for East African schools.</h1>
          <p>
            Replace disconnected spreadsheets and WhatsApp groups with one unified system, from
            admissions to graduation.
          </p>
          <ul className="login-capabilities" aria-label="EduMyles platform capabilities">
            {capabilities.map(({ label, icon: Icon }) => (
              <li key={label}>
                <span className="login-icon"><Icon aria-hidden="true" size={18} strokeWidth={1.75} /></span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="login-trust">Trusted by schools across Kenya, Uganda, Tanzania &amp; Rwanda</p>
      </section>

      <section className="login-panel" aria-labelledby="login-heading">
        <div className="login-panel-inner">
          <h2 id="login-heading">Welcome back</h2>
          <p className="login-subtitle">Sign in to your EduMyles account to continue.</p>
          <Link className="login-submit" href={signInHref}>
            Continue to Sign In <ArrowRight aria-hidden="true" size={18} />
          </Link>
          <p className="login-secure">Secure sign-in powered by WorkOS</p>

          <div className="login-outcomes">
            <h3>You will be able to</h3>
            <ul>
              {outcomes.map((outcome) => (
                <li key={outcome}>
                  <span aria-hidden="true">✓</span>
                  {outcome}
                </li>
              ))}
            </ul>
          </div>

          <p className="login-footnote">
            New to EduMyles? <Link href="/waitlist">Create an account</Link>
          </p>
          <p className="login-footnote">
            Forgot your password? <Link href={signInHref}>Reset it with WorkOS</Link>
          </p>
          <p className="login-help">Need help? <a href="mailto:support@edumyles.com">support@edumyles.com</a></p>
        </div>
      </section>
    </main>
  );
}
