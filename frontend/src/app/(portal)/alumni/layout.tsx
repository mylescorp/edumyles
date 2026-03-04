"use client";

import { AppShell } from "@/components/layout/AppShell";
import { alumniNavItems } from "@/lib/routes";
import { useModules } from "@/hooks/useModules";

export default function AlumniLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { installedModules } = useModules();

    return (
        <AppShell
            navItems={alumniNavItems}
            installedModules={installedModules}
        >
            {children}
        </AppShell>
    );
}
