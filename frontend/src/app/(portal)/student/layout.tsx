"use client";

import { AppShell } from "@/components/layout/AppShell";
import { studentNavItems } from "@/lib/routes";
import { useTenant } from "@/hooks/useTenant";
import { useModules } from "@/hooks/useModules";

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { tenant } = useTenant();
    const { installedModules } = useModules();

    return (
        <AppShell
            navItems={studentNavItems}
            installedModules={installedModules}
        >
            {children}
        </AppShell>
    );
}
