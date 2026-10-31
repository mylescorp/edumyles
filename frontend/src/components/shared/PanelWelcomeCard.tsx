"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

type PanelWelcomeCardProps = {
  description: string;
  actions?: ReactNode;
  metrics?: Array<{ label: string; value: string }>;
};

function getDisplayName(user: unknown): string {
  if (!user || typeof user !== "object") return "there";

  const person = user as Record<string, unknown>;
  const firstName = typeof person.firstName === "string" ? person.firstName.trim() : "";
  const lastName = typeof person.lastName === "string" ? person.lastName.trim() : "";
  const email = typeof person.email === "string" ? person.email : "";
  const localPart = email.split("@")[0] ?? "";
  const profileName = [firstName, lastName].filter(Boolean).join(" ");
  if (profileName && firstName.toLocaleLowerCase() !== localPart.toLocaleLowerCase()) {
    return profileName;
  }

  for (const key of ["name", "fullName", "displayName"]) {
    const value = person[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }

  const readableName = (firstName || localPart)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[._+-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return readableName
    ? readableName.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
    : "there";
}

function getWorkspaceLabel(role: string | null): string {
  if (role === "master_admin" || role === "super_admin" || role === "platform_manager") {
    return "Platform workspace";
  }
  if (["school_admin", "principal", "bursar", "hr_manager", "librarian", "transport_manager"].includes(role ?? "")) {
    return "School workspace";
  }
  if (role) {
    const label = role.replaceAll("_", " ").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase());
    return `${label} workspace`;
  }
  return "Your workspace";
}

export function PanelWelcomeCard({ description, actions, metrics = [] }: PanelWelcomeCardProps) {
  const { user, role } = useAuth();
  const [now, setNow] = useState<Date | null>(null);
  const displayName = getDisplayName(user);

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime();
    const interval = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const greeting = now
    ? now.getHours() < 12
      ? "Good morning"
      : now.getHours() < 17
        ? "Good afternoon"
        : "Good evening"
    : "Welcome";
  const localDateTime = now
    ? new Intl.DateTimeFormat(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(now)
    : null;
  const timeZone = now ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

  return (
    <Card
      aria-label="Personalized dashboard welcome"
      className="flex flex-col gap-5 overflow-hidden rounded-xl border-0 px-5 py-5 text-white shadow-sm md:flex-row md:items-center md:justify-between md:px-6 md:py-6"
      style={{ backgroundColor: "var(--platform-dashboard-banner)" }}
    >
      <div className="min-w-0 max-w-2xl">
        <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--platform-highlight)]" />
          {getWorkspaceLabel(role)}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-[27px]">
          {greeting}, {displayName}.
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-5 text-white/75">{description}</p>
        {actions ? <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="flex shrink-0 flex-col items-stretch gap-2 md:items-end">
        {metrics.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {metrics.map((metric) => (
              <div key={metric.label} className="min-w-[5.25rem] rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2">
                <p className="text-[10px] text-white/70">{metric.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-white">{metric.value}</p>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-center gap-2 self-start rounded-lg border border-white/15 bg-white/[0.08] px-3 py-2 text-xs text-white/85 md:self-end">
          <Clock3 aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>
            {localDateTime ?? "Your local time"}
            {timeZone ? <span className="ml-1.5 text-[10px] text-white/60">{timeZone}</span> : null}
          </span>
        </div>
      </div>
    </Card>
  );
}
