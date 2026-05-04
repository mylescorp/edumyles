import { cookies, headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">

        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image src="/logo-icon.svg" alt="EduMyles" width={48} height={48} priority />
          <span className="text-sm font-bold" style={{ color: "#D4AF37" }}>EduMyles</span>
        </div>

        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {displayName}!
          </h1>
          <p className="text-gray-500 text-sm">
            Signed in as{" "}
            <span className="font-medium text-gray-700">{getRoleLabel(role)}</span>
          </p>
          {email && (
            <p className="text-xs text-gray-400">{email}</p>
          )}
        </div>

        {/* Same-domain: admin dashboard not yet available on this host */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-amber-800">
            ✅ Authentication successful
          </p>
          <p className="text-sm text-amber-700">
            Your account is ready. To access the admin dashboard, the
            <strong> frontend app URL</strong> needs to be configured.
          </p>
          <p className="text-xs text-amber-600 mt-1">
            In your hosting project settings, set{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
              NEXT_PUBLIC_APP_URL
            </code>{" "}
            to the URL of the deployed frontend app (e.g.{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
              https://app.mylescorptech.com
            </code>
            ), then redeploy.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Back to home
          </Link>
          <span className="text-gray-300">·</span>
          <Link
            href="/auth/logout"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
