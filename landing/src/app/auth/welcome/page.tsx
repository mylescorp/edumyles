import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import Logo from "@/components/shared/Logo";

function getRoleLabel(role: string): string {
  switch (role) {
    case "master_admin":  return "Platform Administrator";
    case "super_admin":   return "Super Administrator";
    case "school_admin":  return "School Administrator";
    case "principal":     return "Principal";
    case "teacher":       return "Teacher";
    case "student":       return "Student";
    case "parent":        return "Parent";
    case "bursar":        return "Bursar";
    default:
      return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":   return "/portal/teacher";
    case "parent":    return "/portal/parent";
    case "student":   return "/portal/student";
    default:          return "/admin";
  }
}

export default async function WelcomePage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const sessionCookie = cookieStore.get("edumyles_session");
  if (!sessionCookie?.value) {
    redirect("/auth/login/api");
  }

  const role     = cookieStore.get("edumyles_role")?.value ?? "school_admin";
  const userRaw  = cookieStore.get("edumyles_user")?.value;

  let email = "", firstName = "";
  try {
    const u  = JSON.parse(userRaw ?? "{}");
    email    = u.email     ?? "";
    firstName = u.firstName ?? "";
  } catch {}

  const appUrl      = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  const dashPath    = getDashboardPath(role);
  const currentHost = headerStore.get("host") ?? "";

  // Detect whether APP_URL lives on a different domain
  let isCrossDomain = false;
  let frontendUrl   = "";
  if (appUrl) {
    try {
      const appHost = new URL(appUrl).host;
      isCrossDomain = appHost !== currentHost;
      if (isCrossDomain) frontendUrl = `${appUrl}${dashPath}`;
    } catch {}
  }

  // Cross-domain: skip the welcome page and send them straight to the frontend app
  if (isCrossDomain) {
    redirect(frontendUrl);
  }

  const displayName = firstName || email.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-card rounded-2xl shadow-sm border border-border p-8 text-center space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Logo variant="full" width={180} height={50} priority appearance="light" href={null} />
        </div>

        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-success-muted flex items-center justify-center">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {displayName}!
          </h1>
          <p className="text-muted-foreground text-sm">
            Signed in as{" "}
            <span className="font-medium text-foreground">{getRoleLabel(role)}</span>
          </p>
          {email && (
            <p className="text-xs text-muted-foreground">{email}</p>
          )}
        </div>

        {/* Same-domain: admin dashboard not yet available on this host */}
        <div className="bg-warning-muted border border-warning rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-warning-muted-foreground">
            ✅ Authentication successful
          </p>
          <p className="text-sm text-warning-muted-foreground">
            Your account is ready. To access the admin dashboard, the
            <strong> frontend app URL</strong> needs to be configured.
          </p>
          <p className="text-xs text-warning-muted-foreground mt-1">
            In your hosting project settings, set{" "}
            <code className="bg-warning-muted px-1 py-0.5 rounded font-mono">
              NEXT_PUBLIC_APP_URL
            </code>{" "}
            to the URL of the deployed frontend app (e.g.{" "}
            <code className="bg-warning-muted px-1 py-0.5 rounded font-mono">
              https://app.edumyles.com
            </code>
            ), then redeploy.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to home
          </Link>
          <span className="text-muted-foreground">·</span>
          <Link
            href="/auth/logout"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
