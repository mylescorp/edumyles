"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg text-center">
        <CardContent className="pt-12 pb-12 space-y-6">
          <div className="mx-auto p-4 rounded-full bg-amber-100 w-fit">
            <Wrench className="h-10 w-10 text-amber-600" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">Under Maintenance</h1>
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
