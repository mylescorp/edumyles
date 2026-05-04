import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { TeacherShell } from "@/components/layout/shells/TeacherShell";

const TEACHER_ROLES = ["teacher", "master_admin", "super_admin"] as const;

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(TEACHER_ROLES, "/dashboard");
  return <TeacherShell>{children}</TeacherShell>;
}
