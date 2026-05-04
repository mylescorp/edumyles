import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import { getTenantSubdomainFromHost } from "@/lib/tenant-host";

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
  const headersList = await headers();
  const sessionCookie = cookieStore.get("edumyles_session");
  const role = cookieStore.get("edumyles_role")?.value;
  const tenantSlug = getTenantSubdomainFromHost(headersList.get("host"));

  if (sessionCookie?.value) {
    if (tenantSlug) {
      redirect("/admin");
    }
    redirect(getRoleDashboard(role ?? "school_admin"));
  }

  if (tenantSlug) {
    redirect("/auth/login?returnTo=/admin");
  }

  redirect("/auth/login");
}
