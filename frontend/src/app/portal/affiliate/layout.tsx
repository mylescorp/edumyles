import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { AffiliateShell } from "@/components/layout/shells/AffiliateShell";

export default async function AffiliateLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <AffiliateShell>{children}</AffiliateShell>;
}
