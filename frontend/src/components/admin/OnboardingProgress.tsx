"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function OnboardingProgress() {
  const { isLoading, sessionToken, tenantId } = useAuth();
  const onboarding = useQuery(
    api.modules.platform.onboarding.getTenantOnboarding,
    sessionToken ? { sessionToken, tenantId: tenantId ?? undefined } : "skip"
  );

  if (isLoading || onboarding === undefined || onboarding?.wizardCompleted) {
    return null;
  }

  const steps = Object.values(onboarding.steps ?? {}) as Array<{ completed?: boolean }>;
  const completedCount = steps.filter((step) => step.completed).length;
  const totalSteps = steps.length || 12;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  return (
    <Card className="border-amber-200/70 bg-amber-50/60">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Onboarding Progress</CardTitle>
            <p className="text-sm text-muted-foreground">
              Complete your school setup to activate your trial and unlock the full workspace.
            </p>
          </div>
          <Badge variant="outline">{completedCount}/{totalSteps} steps</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Health score</span>
            <span>{onboarding.healthScore}/51</span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </div>

        <div className="flex flex-wrap gap-2">
          {steps.map((step, index) => (
            <span
              key={index}
              className={`h-2.5 w-2.5 rounded-full ${step.completed ? "bg-emerald-600" : "bg-slate-300"}`}
            />
          ))}
        </div>

        {(onboarding as any).organizationMode === "multi_campus_network" ? (
          <p className="text-xs text-muted-foreground">
            Network onboarding is active for {(onboarding as any).provisionedCampusTenantIds?.length ?? 1} campus workspace(s).
          </p>
        ) : null}

        <Button asChild size="sm">
          <Link href="/admin/setup">Continue Setup</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
