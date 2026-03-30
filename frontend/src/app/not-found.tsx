import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center" style={{ background: "#061A12" }}>
      <div className="flex flex-col items-center gap-2 mb-8">
        <Image src="/logo-icon.svg" alt="EduMyles" width={56} height={56} priority />
        <span className="text-base font-bold" style={{ color: "#D4AF37" }}>EduMyles</span>
      </div>
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
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
