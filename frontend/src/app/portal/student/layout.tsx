import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { StudentShell } from "@/components/layout/shells/StudentShell";

const STUDENT_ROLES = ["student", "master_admin", "super_admin"] as const;

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(STUDENT_ROLES, "/dashboard");
  return <StudentShell>{children}</StudentShell>;
}
