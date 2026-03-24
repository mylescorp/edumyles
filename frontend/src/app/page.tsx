import { redirect } from "next/navigation";
import { cookies } from "next/headers";

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
  const sessionCookie = cookieStore.get("edumyles_session");
  const role = cookieStore.get("edumyles_role")?.value;

  if (sessionCookie?.value) {
    redirect(getRoleDashboard(role ?? "school_admin"));
  }

  redirect("/auth/login/api");
}
