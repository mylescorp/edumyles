"use client";

import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  moduleName: string;
  reason?: string;
};

export function ModuleAccessDeniedPage({ moduleName, reason }: Props) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Access restricted</h2>
            <p className="text-sm text-muted-foreground">
              You do not currently have access to {moduleName}.
              {reason ? ` ${reason}` : " Contact your school administrator for access."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
