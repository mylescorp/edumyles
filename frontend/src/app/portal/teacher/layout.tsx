"use client";

import { AppShell } from "@/components/layout/AppShell";
import { teacherNavItems } from "@/lib/routes";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell navItems={teacherNavItems}>
      {children}
    </AppShell>
  );
}
