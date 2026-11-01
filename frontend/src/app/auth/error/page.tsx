import Link from "next/link";
import { AlertTriangle, RefreshCw, Home, Mail, ArrowRight } from "lucide-react";
import Logo from "@/components/shared/Logo";

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
  platform_role_required: {
    title: "EduMyles platform access required",
    message:
      "Your WorkOS account is recognized, but it does not have an EduMyles platform role.",
    hint:
      "A WorkOS organization invitation does not grant EduMyles permissions. Ask an EduMyles platform administrator to invite you through EduMyles and assign the appropriate role.",
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
  const config = reason ? REASON_CONFIG[reason] ?? DEFAULT_CONFIG : DEFAULT_CONFIG;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      {/* Logo */}
      <div className="mb-10">
        <Logo variant="full" width={160} height={44} priority href={null} />
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Error card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-muted">
              <AlertTriangle className="h-8 w-8 text-danger" />
            </span>
          </div>

          {/* Text */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-xl font-bold text-foreground">
              {config.title}
            </h1>
            <p className="text-sm text-secondary-foreground leading-relaxed">
              {config.message}
            </p>
          </div>

          {/* Hint box */}
          {config.hint && (
            <div className="mb-6 rounded-lg border border-warning/30 bg-warning-muted px-4 py-3">
              <p className="text-sm text-warning-muted-foreground leading-relaxed">
                {config.hint}
              </p>
            </div>
          )}

          {/* Error code */}
          {reason && (
            <p className="mb-6 text-center font-mono text-xs text-muted-foreground">
              Error code: <span className="text-muted-foreground">{reason}</span>
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {/* Context-specific primary CTA (e.g. Sign up for not_authorized) */}
            {config.cta && (
              <Link
                href={config.cta.href}
                className="group flex h-[var(--control-lg)] w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                {config.cta.label}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            {/* Default: try signing in again */}
            {!config.cta && (
              <a
                href="/auth/login/api"
                className="group flex h-[var(--control-lg)] w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                <RefreshCw className="h-4 w-4" />
                Try signing in again
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            )}

            <Link
              href="/"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-input bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </div>
        </div>

        {/* Support */}
        <div className="text-center space-y-1.5">
          <p className="text-sm text-muted-foreground">Still having trouble?</p>
          <a
            href="mailto:support@edumyles.com"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary underline underline-offset-2">
            <Mail className="h-4 w-4" />
            Contact support@edumyles.com
          </a>
        </div>

        {/* Diagnostic block */}
        <details className="text-center">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
            Show diagnostic info
          </summary>
          <div className="mt-3 rounded-lg border border-border bg-muted p-4 text-left font-mono text-xs text-muted-foreground space-y-1">
            <p>reason: <span className="text-secondary-foreground">{reason ?? "none"}</span></p>
            <p>page: <span className="text-secondary-foreground">/auth/error</span></p>
            <p>support: <span className="text-secondary-foreground">support@edumyles.com</span></p>
          </div>
        </details>
      </div>
    </div>
  );
}
