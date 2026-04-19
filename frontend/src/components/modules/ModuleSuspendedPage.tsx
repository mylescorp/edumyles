"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  variant: "payment" | "platform";
  moduleName: string;
};

export function ModuleSuspendedPage({ variant, moduleName }: Props) {
  const title =
    variant === "payment" ? "Module suspended for payment" : "Module suspended by platform";
  const cta = variant === "payment" ? "Update payment method" : "Contact support";

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">
              {moduleName} is temporarily unavailable.
            </p>
          </div>
          <Button variant="outline">{cta}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
