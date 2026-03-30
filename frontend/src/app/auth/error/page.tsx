import Link from "next/link";
import Image from "next/image";

const REASON_MESSAGES: Record<string, string> = {
  not_configured: "Authentication is not configured. Please contact your administrator.",
  callback_failed: "Sign-in failed. The authentication server returned an error.",
  invalid_state: "Security token mismatch. Please try signing in again.",
  no_code: "No authorization code was received. Please try again.",
  config_error: "System configuration error. Please contact your administrator.",
  access_denied: "Access was denied. Please contact your administrator.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const message =
    REASON_MESSAGES[reason ?? ""] ??
    `An unexpected authentication error occurred${reason ? ` (${reason})` : ""}.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8" style={{ background: "#061A12" }}>
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex flex-col items-center gap-2 mb-4">
          <Image src="/logo-icon.svg" alt="EduMyles" width={56} height={56} priority />
          <span className="text-base font-bold" style={{ color: "#D4AF37" }}>EduMyles</span>
        </div>
        <div className="space-y-2">
          <p className="text-6xl font-bold text-muted-foreground/30">Auth Error</p>
          <h1 className="text-2xl font-semibold text-foreground">Sign-in failed</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Link
            href="/auth/login/api"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Go home
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/60">
          If this keeps happening, contact{" "}
          <a href="mailto:support@edumyles.com" className="underline underline-offset-2">
            support@edumyles.com
          </a>
        </p>
      </div>
    </div>
  );
}
