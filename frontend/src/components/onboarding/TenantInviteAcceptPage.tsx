"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail, School, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const formSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().min(7, "Phone number is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    acceptedTerms: z.boolean().refine((value) => value, "You must accept the Terms of Service"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type InviteState = "loading" | "ready" | "invalid" | "expired" | "used" | "revoked" | "success";

function getPasswordStrength(password: string) {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 30;
  if (/[A-Z]/.test(password)) score += 20;
  if (/[a-z]/.test(password)) score += 20;
  if (/\d/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;
  return Math.min(100, score);
}

export function TenantInviteAcceptPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<InviteState>("loading");
  const [invite, setInvite] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setState("invalid");
        return;
      }

      try {
        const response = await fetch("/api/tenants/invite/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          switch (payload.error) {
            case "expired":
              setState("expired");
              return;
            case "used":
              setState("used");
              return;
            case "revoked":
              setState("revoked");
              return;
            default:
              setState("invalid");
              return;
          }
        }

        const payload = await response.json();
        setInvite(payload.invite);
        setFormData((current) => ({
          ...current,
          firstName: payload.invite.firstName ?? current.firstName,
          lastName: payload.invite.lastName ?? current.lastName,
          phone: payload.invite.phone ?? current.phone,
        }));
        setState("ready");
      } catch {
        setState("invalid");
      }
    };

    void run();
  }, [token]);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const validated = formSchema.parse(formData);
      const response = await fetch("/api/tenants/invite/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          firstName: validated.firstName,
          lastName: validated.lastName,
          phone: validated.phone,
          password: validated.password,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to accept invitation");
      }

      setState("success");
      toast.success("Your school workspace is ready.");
      router.replace(payload.redirectTo ?? "/admin/setup");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const nextErrors: Record<string, string> = {};
        for (const issue of error.issues) {
          const field = String(issue.path[0] ?? "form");
          nextErrors[field] = issue.message;
        }
        setErrors(nextErrors);
      } else {
        const message = error instanceof Error ? error.message : "Failed to accept invitation";
        toast.error(message);
        setErrors({ form: message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-500" />
          <p className="mt-3 text-sm text-slate-600">Validating your invitation...</p>
        </div>
      </div>
    );
  }

  if (state !== "ready") {
    const copy =
      state === "expired"
        ? { title: "Invitation expired", description: "This invite is no longer active. Request a fresh invitation from the EduMyles team." }
        : state === "used"
          ? { title: "Invitation already used", description: "This invite has already been accepted. Sign in with the account that completed it." }
          : state === "revoked"
            ? { title: "Invitation revoked", description: "This invite was revoked before completion. Contact the platform team if this was unexpected." }
            : { title: "Invitation not found", description: "The invite token is invalid or incomplete." };

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
            <CardTitle className="mt-4">{copy.title}</CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => router.push("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_50%,_#e2e8f0)] px-4 py-12">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-slate-200/70 bg-white/90 shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                Tenant Invite
              </Badge>
              <span>Secure school onboarding</span>
            </div>
            <CardTitle className="text-3xl font-semibold text-slate-900">
              Create your school admin account
            </CardTitle>
            <CardDescription className="text-base text-slate-600">
              This will provision your EduMyles workspace, install the core modules, and sign you into setup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(event) => setFormData((current) => ({ ...current, firstName: event.target.value }))}
                  />
                  {errors.firstName ? <p className="text-sm text-red-600">{errors.firstName}</p> : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(event) => setFormData((current) => ({ ...current, lastName: event.target.value }))}
                  />
                  {errors.lastName ? <p className="text-sm text-red-600">{errors.lastName}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input id="email" value={invite.email} disabled className="pl-9" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(event) => setFormData((current) => ({ ...current, phone: event.target.value }))}
                />
                {errors.phone ? <p className="text-sm text-red-600">{errors.phone}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                    className="pl-9"
                  />
                </div>
                <Progress value={passwordStrength} className="h-2" />
                <p className="text-xs text-slate-500">
                  Password strength: {passwordStrength >= 80 ? "strong" : passwordStrength >= 50 ? "medium" : "weak"}
                </p>
                {errors.password ? <p className="text-sm text-red-600">{errors.password}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(event) => setFormData((current) => ({ ...current, confirmPassword: event.target.value }))}
                />
                {errors.confirmPassword ? <p className="text-sm text-red-600">{errors.confirmPassword}</p> : null}
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Checkbox
                  id="acceptedTerms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) =>
                    setFormData((current) => ({ ...current, acceptedTerms: Boolean(checked) }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="acceptedTerms" className="cursor-pointer">
                    I agree to the Terms of Service and Privacy Policy
                  </Label>
                  <p className="text-xs text-slate-500">
                    Your account will be provisioned for this invited school workspace only.
                  </p>
                  {errors.acceptedTerms ? <p className="text-sm text-red-600">{errors.acceptedTerms}</p> : null}
                </div>
              </div>

              {errors.form ? (
                <Alert variant="destructive">
                  <AlertDescription>{errors.form}</AlertDescription>
                </Alert>
              ) : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your workspace...
                  </>
                ) : (
                  "Create Account and Start Setup"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200/70 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <School className="h-5 w-5 text-emerald-300" />
                {invite.schoolName ?? "School Workspace"}
              </CardTitle>
              <CardDescription className="text-slate-300">
                Invited school profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <span>Suggested plan</span>
                <Badge className="bg-white/10 text-white">{invite.suggestedPlan ?? "starter"}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <span>Estimated students</span>
                <span>{invite.studentCountEstimate ?? "Not provided"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <span>Country</span>
                <span>{invite.country ?? "Kenya"}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                <span>Invite email</span>
                <span className="max-w-[60%] truncate text-right">{invite.email}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/70 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl text-slate-900">
                <UserRound className="h-5 w-5 text-sky-600" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <p>EduMyles creates your organization and school admin account in WorkOS.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <p>Your tenant, subscription shell, onboarding record, and core modules are provisioned.</p>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" />
                <p>You are signed into the admin workspace and sent directly to setup.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default TenantInviteAcceptPage;
