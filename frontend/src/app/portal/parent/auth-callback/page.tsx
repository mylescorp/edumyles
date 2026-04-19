"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ParentAuthCallbackPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && role === "parent") {
      router.replace("/portal/parent");
    }
  }, [isAuthenticated, isLoading, role, router]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4 py-10">
      <Card className="w-full border-emerald-100 bg-white/95">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-700" />
          </div>
          <CardTitle>Finishing parent sign-in</CardTitle>
          <CardDescription>
            We’re linking your parent portal access and preparing your session.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {!isLoading && (!isAuthenticated || role !== "parent") ? (
            <Button asChild>
              <Link href="/">Return to sign in</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
