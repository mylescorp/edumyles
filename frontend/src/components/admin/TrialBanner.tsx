"use client";

import Link from "next/link";
import { AlertTriangle, Clock3, CreditCard } from "lucide-react";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

function getUrgency(trialEndsAt: number | null | undefined, currentTime: number) {
  if (!trialEndsAt) return { tone: "info" as const, daysLeft: null };
  const dayMs = 24 * 60 * 60 * 1000;
  const daysLeft = Math.ceil((trialEndsAt - currentTime) / dayMs);
  if (daysLeft < 3) return { tone: "critical" as const, daysLeft };
  if (daysLeft < 7) return { tone: "warning" as const, daysLeft };
  return { tone: "info" as const, daysLeft };
}

export function TrialBanner() {
  const { tenant } = useTenant();
  const [currentTime] = useState(() => Date.now());

  if (!tenant || (tenant.status !== "trial" && tenant.status !== "trial_expired")) {
    return null;
  }

  const urgency = getUrgency(tenant.trialEndsAt, currentTime);

  if (tenant.status === "trial_expired") {
    return (
      <Card className="border-rose-200 bg-rose-50/90">
        <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-700" />
              <p className="font-semibold text-rose-950">Your trial has ended</p>
              <Badge variant="destructive">Trial expired</Badge>
            </div>
            <p className="text-sm text-rose-900/80">
              Core SIS access remains available, but paid modules may be suspended until you choose a plan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-rose-700 text-white hover:bg-rose-800">
              <Link href="/admin/settings/billing">
                <CreditCard className="mr-2 h-4 w-4" />
                Choose a Plan
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const styles =
    urgency.tone === "critical"
      ? {
          card: "border-rose-200 bg-rose-50/90",
          icon: "text-rose-700",
          text: "text-rose-950",
          subtext: "text-rose-900/80",
          badge: "destructive" as const,
          label: urgency.daysLeft === 0 ? "Ends today" : `${urgency.daysLeft} day${urgency.daysLeft === 1 ? "" : "s"} left`,
        }
      : urgency.tone === "warning"
        ? {
            card: "border-amber-200 bg-amber-50/90",
            icon: "text-amber-700",
            text: "text-amber-950",
            subtext: "text-amber-900/80",
            badge: "secondary" as const,
            label: `${urgency.daysLeft} days left`,
          }
        : {
            card: "border-sky-200 bg-sky-50/90",
            icon: "text-sky-700",
            text: "text-sky-950",
            subtext: "text-sky-900/80",
            badge: "outline" as const,
            label: `${urgency.daysLeft ?? "14"} days left`,
          };

  return (
    <Card className={styles.card}>
      <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock3 className={`h-5 w-5 ${styles.icon}`} />
            <p className={`font-semibold ${styles.text}`}>Trial active for {tenant.name}</p>
            <Badge variant={styles.badge}>{styles.label}</Badge>
          </div>
          <p className={`text-sm ${styles.subtext}`}>
            Keep onboarding momentum high and choose your plan before the trial ends to avoid module suspension.
          </p>
        </div>
        <Button asChild className="bg-[var(--platform-accent)] text-white hover:bg-[var(--platform-accent-hover)]">
          <Link href="/admin/settings/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            Choose a Plan
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
