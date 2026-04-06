import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { TeacherShell } from "@/components/layout/shells/TeacherShell";

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <TeacherShell>{children}</TeacherShell>;
}
