import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { AlumniShell } from "@/components/layout/shells/AlumniShell";

const ALUMNI_ROLES = ["alumni", "master_admin", "super_admin"] as const;

export default async function AlumniLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(ALUMNI_ROLES, "/dashboard");
  return <AlumniShell>{children}</AlumniShell>;
}
