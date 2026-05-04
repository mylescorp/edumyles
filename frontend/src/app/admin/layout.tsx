import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { AdminShell } from "@/components/layout/shells/AdminShell";

const ADMIN_ROLES = [
  "school_admin",
  "principal",
  "bursar",
  "hr_manager",
  "librarian",
  "transport_manager",
  "master_admin",
  "super_admin",
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(ADMIN_ROLES, "/dashboard");
  return <AdminShell>{children}</AdminShell>;
}
