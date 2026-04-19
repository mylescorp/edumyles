import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getMarketingSiteUrl } from "@/lib/marketingSite";

function isCanonicalAppHost(origin?: string) {
  if (!origin) return false;

  try {
    const currentHost = new URL(origin).host;
    const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const configuredAppHost = configuredAppUrl ? new URL(configuredAppUrl).host : null;

    return currentHost === configuredAppHost || currentHost === "edumyles-frontend.vercel.app";
  } catch {
    return false;
  }
}

function getRoleDashboard(role: string): string {
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
    case "alumni":
      return "/portal/alumni";
    case "partner":
      return "/portal/partner";
    default:
      return "/admin";
  }
}

export default async function RootPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionCookie = cookieStore.get("edumyles_session");
  const role = cookieStore.get("edumyles_role")?.value;
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const host = headerStore.get("host");
  const origin = host ? `${forwardedProto ?? "http"}://${host}` : undefined;

  if (sessionCookie?.value) {
    redirect(getRoleDashboard(role ?? "school_admin"));
  }

  redirect(getMarketingSiteUrl(origin));
}
