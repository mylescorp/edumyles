import { ReactNode } from "react";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";
import { PlatformShell } from "@/components/layout/shells/PlatformShell";

const PLATFORM_ROLES = [
  "master_admin",
  "super_admin",
  "platform_manager",
  "support_agent",
  "billing_admin",
  "marketplace_reviewer",
  "content_moderator",
  "analytics_viewer",
] as const;

export default async function PlatformLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(PLATFORM_ROLES, "/dashboard");
  return <PlatformShell>{children}</PlatformShell>;
}
