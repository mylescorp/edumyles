import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { AlumniShell } from "@/components/layout/shells/AlumniShell";

export default async function AlumniLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <AlumniShell>{children}</AlumniShell>;
}
