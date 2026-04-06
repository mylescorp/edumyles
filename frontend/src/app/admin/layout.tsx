import { ReactNode } from "react";
import { ensureProtectedRouteSession } from "@/lib/serverRouteAuth";
import { AdminShell } from "@/components/layout/shells/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await ensureProtectedRouteSession();
  return <AdminShell>{children}</AdminShell>;
}
