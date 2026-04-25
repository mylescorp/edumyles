import type { Metadata } from "next";
import { ReactNode } from "react";
import { PlatformShell } from "@/components/layout/shells/PlatformShell";
import { DEV_PANEL_ALLOWED_ROLES } from "@/lib/dev/access";
import { ensureAuthorizedRouteSession } from "@/lib/serverRouteAuth";

export const metadata: Metadata = {
  title: "Developer Console",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function DevLayout({ children }: { children: ReactNode }) {
  await ensureAuthorizedRouteSession(DEV_PANEL_ALLOWED_ROLES);
  return <PlatformShell>{children}</PlatformShell>;
}
