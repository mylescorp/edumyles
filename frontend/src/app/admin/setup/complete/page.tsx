"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AdminSetupCompletePage() {
  const { sessionToken, tenantId } = useAuth();
  const wizardContext = useQuery(
    api.modules.platform.onboarding.getSetupWizardContext,
    sessionToken ? { sessionToken, tenantId: tenantId ?? undefined } : "skip"
  );

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center px-4 py-10">
      <Card className="w-full border-emerald-200 bg-white/95 text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>
          <CardTitle>Setup Complete</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {wizardContext?.tenantName ?? "Your school"} has completed the onboarding flow and can now move fully into day-to-day operations.
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/admin">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
