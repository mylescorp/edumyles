import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function ParentPortalNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <p className="text-7xl font-bold text-muted-foreground/30">404</p>
            <h2 className="text-xl font-semibold">Page not found</h2>
            <p className="text-sm text-muted-foreground">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild variant="outline">
              <Link href="javascript:history.back()">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go back
              </Link>
            </Button>
            <Button asChild>
              <Link href="/portal/parent">
                <Home className="h-4 w-4 mr-2" />
                Parent Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
