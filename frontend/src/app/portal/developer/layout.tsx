import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { DeveloperShell } from "@/components/layout/shells/DeveloperShell";

export default async function DeveloperLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <DeveloperShell>{children}</DeveloperShell>;
}
