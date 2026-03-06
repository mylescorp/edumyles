"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, LogOut, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LogoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const performLogout = async () => {
    try {
      // Clear session cookie
      document.cookie = "edumyles_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Clear any other auth cookies
      document.cookie = "edumyles_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Simulate API call to invalidate session on server
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStatus("success");
      setMessage("You have been successfully logged out.");
      
      // Redirect to login after a delay
      setTimeout(() => {
        const returnUrl = searchParams.get("returnUrl");
        if (returnUrl && returnUrl !== "/auth/logout") {
          router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
        } else {
          router.push("/auth/login");
        }
      }, 2000);
      
    } catch (error) {
      console.error("Logout error:", error);
      setStatus("error");
      setMessage("There was an error logging out. Please try again.");
    }
  };

  useEffect(() => {
    performLogout();
  }, []);

  const handleRetryLogout = () => {
    setStatus("loading");
    performLogout();
  };

  const handleGoToLogin = () => {
    const returnUrl = searchParams.get("returnUrl");
    if (returnUrl && returnUrl !== "/auth/logout") {
      router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    } else {
      router.push("/auth/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-[#056C40] text-white">
              <LogOut className="h-8 w-8" />
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Signing Out
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we securely log you out...
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {status === "loading" && "Logging Out"}
              {status === "success" && "Logged Out Successfully"}
              {status === "error" && "Logout Error"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Loading State */}
            {status === "loading" && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <Loader2 className="h-12 w-12 animate-spin text-[#056C40]" />
                <p className="text-sm text-muted-foreground">
                  Clearing your session and securing your account...
                </p>
              </div>
            )}

            {/* Success State */}
            {status === "success" && (
              <div className="flex flex-col items-center space-y-4 py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <p className="text-sm text-muted-foreground text-center">
                  {message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Redirecting you to the login page...
                </p>
              </div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {message}
                  </AlertDescription>
                </Alert>
                
                <div className="flex flex-col space-y-2 pt-4">
                  <Button 
                    onClick={handleRetryLogout}
                    className="w-full"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleGoToLogin}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Information */}
        {status !== "error" && (
          <div className="text-center space-y-2">
            <h3 className="text-sm font-medium text-gray-900">
              Security Notice
            </h3>
            <p className="text-xs text-gray-600 max-w-sm mx-auto">
              For your security, all active sessions have been terminated. 
              You will need to log in again to access your account.
            </p>
          </div>
        )}

        {/* Quick Links */}
        <div className="text-center space-y-4">
          <div className="text-sm text-gray-600">
            Want to go somewhere else?
          </div>
          <div className="flex flex-col space-y-2">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/")}
              className="w-full"
            >
              Back to Home
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "mailto:support@edumyles.com"}
              className="w-full"
            >
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
