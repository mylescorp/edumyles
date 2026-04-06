import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { PlatformShell } from "@/components/layout/shells/PlatformShell";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <PlatformShell>{children}</PlatformShell>;
}
