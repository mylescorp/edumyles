import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { ResellerShell } from "@/components/layout/shells/ResellerShell";

export default async function ResellerLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <ResellerShell>{children}</ResellerShell>;
}
