"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { PLATFORM_DEPARTMENTS, PLATFORM_DEPARTMENT_BY_VALUE } from "@/lib/platform-departments";
import {
  Check,
  CheckCircle2,
  Copy,
  Building2,
  ExternalLink,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const inviteSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.string().min(1, "Select a role"),
  department: z.string().optional(),
  personalMessage: z.string().optional(),
});

interface PlatformAdminInviteFormProps {
  sessionToken: string;
  mode: "page" | "dialog";
  onCancel?: () => void;
  onComplete?: () => void;
}

export function PlatformAdminInviteForm({
  sessionToken,
  mode,
  onCancel,
  onComplete,
}: PlatformAdminInviteFormProps) {
  const router = useRouter();
  const departmentPlaceholder = "unassigned";

  const [form, setForm] = useState({
    email: "",
    role: "super_admin",
    department: "platform_operations",
    personalMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [result, setResult] = useState<{
    invitedEmail: string;
    token: string;
    signUpUrl: string;
    emailSent: boolean;
    workosError?: string;
  } | null>(null);
  const roles = usePlatformQuery(
    api.modules.platform.rbac.getRoles,
    sessionToken ? { sessionToken, includeSystem: true } : "skip",
    !!sessionToken
  ) as Array<any> | undefined;

  const selectedRole = (roles ?? []).find((role) => role.slug === form.role);
  const selectedDepartment =
    form.department && form.department !== departmentPlaceholder
      ? PLATFORM_DEPARTMENT_BY_VALUE[form.department]
      : null;
  const previewPermissions = (selectedRole?.permissions ?? []).slice(0, 12);
  const remainingPermissions = Math.max((selectedRole?.permissions?.length ?? 0) - 12, 0);

  const resetFlow = () => {
    setForm({
      email: "",
      role: "super_admin",
      department: "platform_operations",
      personalMessage: "",
    });
    setError(null);
    setCopied(false);
    setCopiedUrl(false);
    setResult(null);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const parsed = inviteSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter valid invite details.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/platform/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          email: parsed.data.email,
          role: parsed.data.role,
          department:
            parsed.data.department && parsed.data.department !== departmentPlaceholder
              ? PLATFORM_DEPARTMENT_BY_VALUE[parsed.data.department]?.label ?? parsed.data.department.trim()
              : undefined,
          personalMessage: parsed.data.personalMessage?.trim() || undefined,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send invitation");
      }

      setResult({
        invitedEmail: parsed.data.email,
        token: payload.token,
        signUpUrl: payload.signUpUrl,
        emailSent: Boolean(payload.emailSent),
        workosError: payload.workosError,
      });
      onComplete?.();
      toast.success(
        payload.emailSent
          ? `WorkOS invitation sent to ${parsed.data.email}`
          : `Invite created for ${parsed.data.email}`
      );
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyToken = async () => {
    if (!result?.token) return;
    await navigator.clipboard.writeText(result.token);
    setCopied(true);
    toast.success("Invite token copied");
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyUrl = async () => {
    if (!result?.signUpUrl) return;
    await navigator.clipboard.writeText(result.signUpUrl);
    setCopiedUrl(true);
    toast.success("Sign-up link copied");
    window.setTimeout(() => setCopiedUrl(false), 1500);
  };

  if (result) {
    return (
      <div className="space-y-6 py-1">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
            >
              Invite created
            </Badge>
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Ready for onboarding
            </Badge>
          </div>
          <div>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              {result.invitedEmail} is ready for the next step.
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              Use the direct sign-up link for the smoothest path, and keep the fallback token for
              support follow-up if the recipient needs manual help.
            </p>
          </div>
        </div>

        {result.emailSent ? (
          <div className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>
              WorkOS login invitation sent to <strong>{result.invitedEmail}</strong>.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Invite record was created for <strong>{result.invitedEmail}</strong>, but the WorkOS
              email could not be sent.
              {result.workosError ? ` ${result.workosError}` : ""}
            </span>
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Direct WorkOS sign-up link</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Share this if the recipient needs a direct path into onboarding.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  readOnly
                  value={result.signUpUrl}
                  className="h-11 border-border/70 bg-background text-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={handleCopyUrl}>
                    {copiedUrl ? (
                      <Check className="mr-2 h-4 w-4 text-green-600" />
                    ) : (
                      <LinkIcon className="mr-2 h-4 w-4" />
                    )}
                    Copy link
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(result.signUpUrl, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open link
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-gradient-to-br from-background to-muted/20 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">Fallback invite token</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Keep this for support reconciliation if email delivery needs manual handling.
                </p>
              </div>
              <div className="space-y-3">
                <Input
                  readOnly
                  value={result.token}
                  className="h-11 border-border/70 bg-background font-mono text-xs"
                />
                <Button size="sm" variant="outline" onClick={handleCopyToken}>
                  {copied ? (
                    <Check className="mr-2 h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Copy token
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border/60 pt-2">
          <Button variant="outline" onClick={resetFlow}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Another
          </Button>
          {mode === "page" ? (
            <Button onClick={() => router.push("/platform/users")}>
              <Users className="mr-2 h-4 w-4" />
              View All Staff
            </Button>
          ) : (
            <Button onClick={onCancel}>Done</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.35fr)_380px]">
      <div className="space-y-6">
        <Card className="border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/50 to-slate-50 shadow-md dark:border-border/70 dark:from-background dark:via-background dark:to-muted/20">
          <CardContent className="space-y-5 p-6 lg:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/15 text-emerald-800"
              >
                Admin Details
              </Badge>
              <Badge variant="secondary" className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-slate-700 shadow-sm dark:border-border/70 dark:bg-secondary dark:text-secondary-foreground">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Invitation draft
              </Badge>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm dark:border-border/70 dark:bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  01 Recipient
                </p>
                <p className="mt-3 text-base font-semibold text-slate-950 dark:text-foreground">
                  {form.email.trim() || "Add a work email"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                  Identity should match the staff member’s login address.
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm dark:border-border/70 dark:bg-background/80">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  02 Department
                </p>
                <p className="mt-3 text-base font-semibold text-slate-950 dark:text-foreground">
                  {selectedDepartment?.label ?? "Unassigned"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                  {selectedDepartment?.description ?? "Optional if this admin serves across teams."}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/12 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  03 Access posture
                </p>
                <p className="mt-3 text-base font-semibold text-slate-950 dark:text-foreground">
                  {selectedRole?.name ?? "Select a role"}
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-700 dark:text-muted-foreground">
                  {(selectedRole?.permissions?.length ?? 0).toLocaleString()} mapped permissions
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-emerald-200/70 bg-white shadow-md dark:border-border/70 dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-muted/20">
          <CardContent className="space-y-6 p-6 lg:p-7">
            <div className="space-y-3">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
                Set the recipient, role, and onboarding context.
              </h3>
              <p className="max-w-3xl text-base leading-8 text-slate-600 dark:text-muted-foreground">
                Keep the workflow structured: identify the operator, place them in the right
                platform function, then review access before sending.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-5 xl:grid-cols-2">
                <div className="space-y-5 rounded-3xl border border-emerald-200/70 bg-emerald-50/35 p-5 shadow-sm dark:border-border/70 dark:bg-background/70">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-950 dark:text-foreground">Identity & placement</p>
                    <p className="text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                      Capture the operator and assign the home department for accountability.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`invite-email-${mode}`} className="text-sm font-semibold text-slate-800 dark:text-foreground">Email Address</Label>
                    <Input
                      id={`invite-email-${mode}`}
                      type="email"
                      placeholder="admin@edumyles.com"
                      value={form.email}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, email: event.target.value }))
                      }
                      className="h-[52px] border-slate-300 bg-white text-base shadow-sm placeholder:text-slate-400 dark:border-border/70 dark:bg-background"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`invite-department-${mode}`} className="text-sm font-semibold text-slate-800 dark:text-foreground">Department</Label>
                    <Select
                      value={form.department || departmentPlaceholder}
                      onValueChange={(value) =>
                        setForm((current) => ({ ...current, department: value }))
                      }
                    >
                      <SelectTrigger
                        id={`invite-department-${mode}`}
                        className="h-[52px] border-slate-300 bg-white text-base shadow-sm dark:border-border/70 dark:bg-background"
                      >
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={departmentPlaceholder}>Unassigned / Cross-functional</SelectItem>
                        {PLATFORM_DEPARTMENTS.map((department) => (
                          <SelectItem key={department.value} value={department.value}>
                            {department.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs leading-5 text-slate-500 dark:text-muted-foreground">
                      Use the department that best represents where this operator will spend most
                      of their platform time.
                    </p>
                  </div>
                </div>

                <div className="space-y-5 rounded-3xl border border-sky-200/70 bg-sky-50/35 p-5 shadow-sm dark:border-border/70 dark:bg-background/70">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-slate-950 dark:text-foreground">Access assignment</p>
                    <p className="text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                      Choose the least-privileged role that still fits the operator’s actual job.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`invite-role-${mode}`} className="text-sm font-semibold text-slate-800 dark:text-foreground">Role</Label>
                    <Select
                      value={form.role}
                      onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
                    >
                      <SelectTrigger
                        id={`invite-role-${mode}`}
                        className="h-[52px] border-slate-300 bg-white text-base shadow-sm dark:border-border/70 dark:bg-background"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(roles ?? []).map((role) => (
                          <SelectItem key={role.slug} value={role.slug}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-sky-300/60 bg-white/90 p-4 shadow-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                      Selected Role
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-foreground">
                      {selectedRole?.name ?? "Select a role"}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                      {selectedRole?.description ?? "Role context appears here once selected."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/70 bg-slate-50/80 p-5 shadow-sm dark:bg-background/70">
                <div className="space-y-2">
                  <Label htmlFor={`invite-message-${mode}`} className="text-sm font-semibold text-slate-800 dark:text-foreground">Personal Message</Label>
                  <Textarea
                    id={`invite-message-${mode}`}
                    placeholder="Add an onboarding note, handoff context, or expectations for the new admin."
                    value={form.personalMessage}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, personalMessage: event.target.value }))
                    }
                    className="min-h-[170px] border-slate-300 bg-white text-base shadow-sm placeholder:text-slate-400 dark:border-border/70 dark:bg-background"
                    rows={6}
                  />
                  <p className="text-xs leading-5 text-slate-500 dark:text-muted-foreground">
                    Optional, but useful when you want the recipient to understand scope, urgency,
                    or who they should coordinate with first.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-3">
                <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="min-w-[220px] bg-emerald-600 text-white hover:bg-emerald-700">
                  {submitting ? (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit border-slate-200/80 bg-white shadow-md 2xl:sticky 2xl:top-6 dark:border-border/70 dark:bg-gradient-to-br dark:from-background dark:via-background dark:to-muted/20">
        <CardContent className="space-y-5 p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Permission Preview</p>
                <p className="text-xs text-muted-foreground">Access snapshot before sending</p>
              </div>
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight text-foreground">
                {selectedRole?.name ?? "Select a role"}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {selectedRole?.description ??
                  "Role capabilities will appear here once a role is selected."}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm dark:border-border/70 dark:bg-background/90">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {selectedDepartment?.label ?? "Unassigned / Cross-functional"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {selectedDepartment?.description ??
                    "Use this when the operator works across multiple platform areas."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 p-4 shadow-sm dark:border-border/70 dark:bg-background/90">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Permission count
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                {(selectedRole?.permissions?.length ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Role posture
              </p>
              <p className="mt-2 text-sm font-medium text-foreground">
                {selectedRole?.description ?? "Awaiting role selection"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Sample permissions
            </p>
            <div className="space-y-2">
              {previewPermissions.length > 0 ? (
                previewPermissions.map((permission: string) => (
                  <div
                    key={permission}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5 text-xs font-mono text-slate-800 shadow-sm dark:border-border/70 dark:bg-background/90 dark:text-foreground"
                  >
                    {permission}
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border px-3 py-6 text-sm text-muted-foreground">
                  Choose a role to see its permissions.
                </div>
              )}
            </div>
            {remainingPermissions > 0 ? (
              <p className="text-xs text-muted-foreground">
                And {remainingPermissions} more permissions.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Review checklist</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Use a verified work email for identity matching.</li>
              <li>Double-check destructive roles before sending.</li>
              <li>Add a short onboarding note when context matters.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
