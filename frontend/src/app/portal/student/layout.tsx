import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { StudentShell } from "@/components/layout/shells/StudentShell";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <StudentShell>{children}</StudentShell>;
}
