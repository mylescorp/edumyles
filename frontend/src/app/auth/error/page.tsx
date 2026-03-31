import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, RefreshCw, Home, Mail, ArrowRight } from "lucide-react";

interface ReasonConfig {
  title: string;
  message: string;
  hint?: string;
  /** Primary CTA shown in place of / in addition to "Try signing in again" */
  cta?: { label: string; href: string };
}

const REASON_CONFIG: Record<string, ReasonConfig> = {
  not_configured: {
    title: "Auth not configured",
    message: "Authentication is not configured on this instance.",
    hint: "Please contact your system administrator to set up WorkOS credentials.",
  },
  callback_failed: {
    title: "Sign-in failed",
    message: "The authentication server returned an unexpected error.",
    hint: "This may be a temporary issue. Please wait a moment and try again.",
  },
  invalid_state: {
    title: "Security check failed",
    message: "The security token from your sign-in attempt did not match.",
    hint: "This usually happens if you have multiple tabs open or your session expired. Please try again.",
  },
  no_code: {
    title: "No authorization code",
    message: "No authorization code was received from the identity provider.",
    hint: "The sign-in flow was interrupted. Please start again from the login page.",
  },
  config_error: {
    title: "System configuration error",
    message: "A required environment variable is missing on the server.",
    hint: "Contact your administrator — this requires a server-side fix.",
  },
  access_denied: {
    title: "Access denied",
    message: "Your sign-in attempt was denied by the identity provider.",
    hint: "If you believe this is a mistake, contact your school administrator.",
  },
  not_authorized: {
    title: "Account not found",
    message:
      "Your account does not exist in EduMyles. Access is by invitation only.",
    hint:
      "If you need access, ask your school administrator to provision your account, " +
      "or sign up to join the waitlist for review.",
    cta: { label: "Sign up for access", href: "/auth/signup" },
  },
  account_inactive: {
    title: "Account deactivated",
    message: "Your account has been deactivated and can no longer sign in.",
    hint:
      "Contact your school administrator or platform support to reinstate your access.",
  },
};

const DEFAULT_CONFIG: ReasonConfig = {
  title: "Sign-in failed",
  message: "An unexpected authentication error occurred.",
  hint: "Please try again, or contact support if the issue persists.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const config = (reason && REASON_CONFIG[reason]) ?? DEFAULT_CONFIG;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="mb-10">
        <Image src="/logo-full.svg" alt="EduMyles" width={160} height={44} priority />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Error card */}
        <div className="rounded-2xl border border-red-100 bg-white p-8 shadow-sm dark:border-red-900/40 dark:bg-gray-900">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
              <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
            </span>
          </div>

          {/* Text */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {config.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {config.message}
            </p>
          </div>

          {/* Hint box */}
          {config.hint && (
            <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 px-4 py-3">
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                {config.hint}
              </p>
            </div>
          )}

          {/* Error code */}
          {reason && (
            <p className="mb-6 text-center font-mono text-xs text-gray-400 dark:text-gray-600">
              Error code: <span className="text-gray-500 dark:text-gray-500">{reason}</span>
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Context-specific primary CTA (e.g. Sign up for not_authorized) */}
            {config.cta && (
              <Link
                href={config.cta.href}
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #0F4C2A 0%, #1A7A4A 100%)" }}
              >
                {config.cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            {/* Default: try signing in again */}
            {!config.cta && (
              <a
                href="/auth/login/api"
                className="group flex w-full items-center justify-center gap-2.5 rounded-xl px-5 py-3 text-sm font-semibold text-white transition-all hover:shadow-md active:scale-[0.98]"
                style={{ background: "linear-gradient(135deg, #0F4C2A 0%, #1A7A4A 100%)" }}
              >
                <RefreshCw className="h-4 w-4" />
                Try signing in again
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-5 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="text-center space-y-1.5">
          <p className="text-sm text-gray-500 dark:text-gray-400">Still having trouble?</p>
          <a
            href="mailto:support@edumyles.com"
            className="inline-flex items-center gap-2 text-sm font-medium underline underline-offset-2"
            style={{ color: "#0F4C2A" }}
          >
            <Mail className="h-4 w-4" />
            Contact support@edumyles.com
          </a>
        </div>

        {/* Diagnostic block */}
        <details className="text-center">
          <summary className="cursor-pointer text-xs text-gray-400 dark:text-gray-600 hover:text-gray-500 select-none">
            Show diagnostic info
          </summary>
          <div className="mt-3 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-4 text-left font-mono text-xs text-gray-500 space-y-1">
            <p>reason: <span className="text-gray-700 dark:text-gray-400">{reason ?? "none"}</span></p>
            <p>page: <span className="text-gray-700 dark:text-gray-400">/auth/error</span></p>
            <p>support: <span className="text-gray-700 dark:text-gray-400">support@edumyles.com</span></p>
          </div>
        </details>
      </div>
    </div>
  );
}
