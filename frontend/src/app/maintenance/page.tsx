"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, RefreshCw } from "lucide-react";
import Logo from "@/components/shared/Logo";

export default function MaintenancePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-12 pb-12 space-y-6">
          <div className="flex flex-col items-center gap-3 mb-2">
            <Logo variant="icon" width={64} height={64} priority href={null} />
            <span className="text-xl font-bold text-primary">EduMyles</span>
          </div>

          <div className="mx-auto w-fit rounded-full bg-warning-muted p-4">
            <Wrench className="h-10 w-10 text-warning-muted-foreground" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-foreground">Under Maintenance</h1>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              EduMyles is currently undergoing scheduled maintenance. We will be back shortly.
              Thank you for your patience.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>

          <p className="text-xs text-muted-foreground">
            If you are a platform administrator, access{" "}
            <a href="/platform" className="text-primary underline">
              the admin panel
            </a>{" "}
            to disable maintenance mode.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
