"use client";

import { ConvexAuthProvider } from "@/components/ConvexAuthProvider";
import { GlobalShell } from "@/components/layout/GlobalShell";
import { useAuth } from "@/hooks/useAuth";
import { getNavItemsForRole } from "@/lib/routes";

function SupportShell({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const navItems = getNavItemsForRole(role ?? "school_admin");

  return (
    <GlobalShell navItems={navItems}>
      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-[1400px]">{children}</div>
      </div>
    </GlobalShell>
  );
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthProvider>
      <SupportShell>{children}</SupportShell>
    </ConvexAuthProvider>
  );
}
