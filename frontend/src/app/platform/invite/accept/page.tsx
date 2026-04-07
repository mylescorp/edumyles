"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/useSSRSafeConvex";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Shield, UserPlus, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const newAccountSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function InviteAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [step, setStep] = useState<"loading" | "valid" | "expired" | "invalid" | "new-account" | "existing-account" | "success">("loading");
  const [invite, setInvite] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const acceptInvite = useConvexMutation(api.modules.platform.rbac.acceptPlatformInvite);

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    
    if (success === "true") {
      setStep("success");
      return;
    }
    
    if (error) {
      setStep("invalid");
      return;
    }

    if (!token) {
      setStep("invalid");
      return;
    }

    validateInvite();
  }, [token, searchParams]);

  const validateInvite = async () => {
    try {
      const response = await fetch("/api/platform/invite/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.error === "expired") setStep("expired");
        else setStep("invalid");
        return;
      }

      const data = await response.json();
      setInvite(data.invite);
      setStep("valid");
    } catch (error) {
      setStep("invalid");
    }
  };

  const handleNewAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const validated = newAccountSchema.parse(formData);
      
      // First create WorkOS account
      const createResponse = await fetch("/api/platform/invite/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invite.email,
          firstName: validated.firstName,
          lastName: validated.lastName,
          password: validated.password,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create account");
      }

      const { workosUserId } = await createResponse.json();

      // Then accept the invite
      await acceptInvite({
        token: token!,
        workosUserId,
        firstName: validated.firstName,
        lastName: validated.lastName,
      });

      setStep("success");
      toast.success("Account created and invitation accepted!");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error instanceof Error ? error.message : "Failed to create account");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExistingAccount = async () => {
    setIsLoading(true);
    try {
      // Redirect to WorkOS auth with invite token
      const authUrl = await fetch("/api/platform/invite/auth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).then(res => res.json());

      window.location.href = authUrl.url;
    } catch (error) {
      toast.error("Failed to initiate authentication");
      setIsLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (step === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is not valid or has been used.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/platform")} variant="outline">
              Go to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Invitation Expired</CardTitle>
            <CardDescription>
              This invitation has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/platform")} variant="outline">
              Go to Platform
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle>Welcome to EduMyles!</CardTitle>
            <CardDescription>
              Your account has been created and you're ready to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/platform")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "valid") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <CardTitle>You've been invited to join EduMyles</CardTitle>
            <CardDescription>
              You've been invited to join as a <Badge variant="secondary">{invite.roleName}</Badge>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Invitation Details</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <p><strong>Email:</strong> {invite.email}</p>
                <p><strong>Role:</strong> {invite.roleName}</p>
                {invite.department && <p><strong>Department:</strong> {invite.department}</p>}
                <p><strong>Invited by:</strong> Platform Team</p>
              </div>
            </div>

            {invite.personalMessage && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Personal Message</h3>
                <p className="text-sm text-slate-600">{invite.personalMessage}</p>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h3 className="font-semibold">Choose Account Type</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={() => setStep("new-account")}
                  variant="outline"
                  className="h-24 flex-col"
                >
                  <UserPlus className="h-6 w-6 mb-2" />
                  <span>Create New Account</span>
                </Button>
                
                <Button
                  onClick={handleExistingAccount}
                  variant="outline"
                  className="h-24 flex-col"
                  disabled={isLoading}
                >
                  <Shield className="h-6 w-6 mb-2" />
                  <span>Sign In with Existing Account</span>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "new-account") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Button
              variant="ghost"
              onClick={() => setStep("valid")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <CardTitle>Create Your Account</CardTitle>
            <CardDescription>
              Create a new account to accept the invitation for <strong>{invite.email}</strong>
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleNewAccount} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={errors.firstName ? "border-red-500" : ""}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={errors.lastName ? "border-red-500" : ""}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>

              <Alert>
                <AlertDescription>
                  By creating an account, you agree to our Terms of Service and Privacy Policy.
                </AlertDescription>
              </Alert>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account & Accept Invitation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
