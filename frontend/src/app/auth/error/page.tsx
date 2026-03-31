import Link from "next/link";

const REASON_MESSAGES: Record<string, { title: string; message: string; action?: "signup" | "login" | "support" | "pending" }> = {
  not_configured: {
    title: "Not configured",
    message: "Authentication is not configured. Please contact your administrator.",
    action: "support",
  },
  callback_failed: {
    title: "Sign-in failed",
    message: "The authentication server returned an error. Please try again.",
    action: "login",
  },
  invalid_state: {
    title: "Security token mismatch",
    message: "The security token is invalid or expired. Please start the sign-in process again.",
    action: "login",
  },
  no_code: {
    title: "No authorization code",
    message: "No authorization code was received from the identity provider. Please try again.",
    action: "login",
  },
  config_error: {
    title: "Configuration error",
    message: "A system configuration error occurred. Please contact your administrator.",
    action: "support",
  },
  access_denied: {
    title: "Access denied",
    message: "Access was denied by the identity provider. Please contact your administrator.",
    action: "support",
  },
  not_authorized: {
    title: "Account not found",
    message:
      "Your account does not exist in EduMyles. Access is by invitation only. " +
      "If you need access, please contact your school administrator or sign up to join the waitlist.",
    action: "signup",
  },
  account_inactive: {
    title: "Account deactivated",
    message:
      "Your account has been deactivated. Please contact your school administrator or " +
      "platform support to reinstate your access.",
    action: "support",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const entry = REASON_MESSAGES[reason ?? ""] ?? {
    title: "Authentication error",
    message: `An unexpected error occurred${reason ? ` (${reason})` : ""}.`,
    action: "login" as const,
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
          <svg
            className="w-8 h-8 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">{entry.title}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{entry.message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          {entry.action === "login" && (
            <Link
              href="/auth/login/api"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Try signing in
            </Link>
          )}
          {entry.action === "signup" && (
            <Link
              href="/auth/signup/api"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Sign up for access
            </Link>
          )}
          {entry.action === "pending" && (
            <Link
              href="/auth/pending"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Check application status
            </Link>
          )}
          {entry.action === "support" && (
            <a
              href="mailto:support@edumyles.com"
              className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Contact support
            </a>
          )}

          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Go home
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60">
          Need help?{" "}
          <a
            href="mailto:support@edumyles.com"
            className="underline underline-offset-2"
          >
            support@edumyles.com
          </a>
        </p>
      </div>
    </div>
  );
}
