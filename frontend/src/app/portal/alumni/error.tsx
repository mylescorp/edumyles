"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AlumniPortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 space-y-4">
          <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {error.message
                ?.replace(/^(UNAUTHENTICATED|UNAUTHORIZED): /, "")
                .replace(/^\[CONVEX [^\]]+\] /, "") ||
                "An unexpected error occurred. Please try again."}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground/60 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
          <Button onClick={reset} variant="outline" className="w-full">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
