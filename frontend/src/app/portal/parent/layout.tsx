import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { ParentShell } from "@/components/layout/shells/ParentShell";

export default async function ParentLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <ParentShell>{children}</ParentShell>;
}
