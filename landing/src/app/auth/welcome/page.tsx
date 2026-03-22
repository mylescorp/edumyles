import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

function getRoleLabel(role: string): string {
  switch (role) {
    case "master_admin": return "Platform Administrator";
    case "super_admin": return "Super Administrator";
    case "school_admin": return "School Administrator";
    case "principal": return "Principal";
    case "teacher": return "Teacher";
    case "student": return "Student";
    case "parent": return "Parent";
    case "bursar": return "Bursar";
    default: return role.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  }
}

function getDashboardPath(role: string): string {
  switch (role) {
    case "master_admin":
    case "super_admin":
      return "/platform";
    case "teacher":
      return "/portal/teacher";
    case "parent":
      return "/portal/parent";
    case "student":
      return "/portal/student";
    default:
      return "/admin";
  }
}

export default async function WelcomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("edumyles_session");
  const role = cookieStore.get("edumyles_role")?.value ?? "school_admin";
  const userRaw = cookieStore.get("edumyles_user")?.value;

  // Not logged in — send to login
  if (!sessionCookie?.value) {
    redirect("/auth/login/api");
  }

  let email = "";
  let firstName = "";
  try {
    const u = JSON.parse(userRaw ?? "{}");
    email = u.email ?? "";
    firstName = u.firstName ?? "";
  } catch {}

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const dashboardPath = getDashboardPath(role);

  // If APP_URL is a different domain, redirect directly to the frontend app
  if (appUrl) {
    try {
      // We're a server component — detect same/cross-domain at render time
      const appHost = new URL(appUrl).host;
      // The current host is determined by request headers, but for simplicity
      // check if appUrl contains 'localhost' or matches a known pattern
      if (!appUrl.includes("localhost") && appHost !== "edumyles.vercel.app") {
        redirect(`${appUrl}${dashboardPath}`);
      }
    } catch {}
  }

  const displayName = firstName || email.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-6">
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
            Signed in as <span className="font-medium text-gray-700">{getRoleLabel(role)}</span>
            {email && <span className="block text-xs text-gray-400 mt-0.5">{email}</span>}
          </p>
        </div>

        {appUrl ? (
          <div className="space-y-3">
            <a
              href={`${appUrl}${dashboardPath}`}
              className="block w-full bg-green-700 text-white rounded-lg px-6 py-3 font-medium hover:bg-green-800 transition-colors"
            >
              Open Dashboard →
            </a>
            <p className="text-xs text-gray-400">
              You will be taken to your {getRoleLabel(role)} dashboard
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left space-y-2">
            <p className="text-sm font-medium text-amber-800">Dashboard setup required</p>
            <p className="text-xs text-amber-700">
              Your account is ready, but the admin dashboard URL is not configured yet.
              Please set <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_APP_URL</code> in
              your Vercel project settings to point to your frontend app.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center pt-2">
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
