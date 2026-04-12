import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { getMarketingSiteUrl } from "@/lib/marketingSite";

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
