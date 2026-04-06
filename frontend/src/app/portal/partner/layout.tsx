import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { PartnerShell } from "@/components/layout/shells/PartnerShell";

export default async function PartnerLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <PartnerShell>{children}</PartnerShell>;
}
