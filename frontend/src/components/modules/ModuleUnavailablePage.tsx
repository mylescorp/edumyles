"use client";

import { PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  moduleName: string;
  description?: string;
  onRequest?: () => void;
};

export function ModuleUnavailablePage({ moduleName, description, onRequest }: Props) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-4 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <PackageOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Module not installed</h2>
            <p className="text-sm text-muted-foreground">
              {moduleName} is not currently installed for this school.
              {description ? ` ${description}` : ""}
            </p>
          </div>
          {onRequest ? <Button onClick={onRequest}>Request this module</Button> : null}
        </CardContent>
      </Card>
    </div>
  );
}
