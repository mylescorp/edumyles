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
import {
  Check,
  CheckCircle2,
  Copy,
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
          department: parsed.data.department?.trim() || undefined,
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_380px]">
      <Card className="border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
        <CardContent className="space-y-6 p-6 lg:p-7">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
              >
                Admin Details
              </Badge>
              <Badge variant="secondary" className="rounded-full px-3 py-1">
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Invitation draft
              </Badge>
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Set the recipient, role, and onboarding context.
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                The form is structured so identity comes first, access comes next, and the personal
                note stays optional.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-2">
                <Label htmlFor={`invite-email-${mode}`}>Email Address</Label>
                <Input
                  id={`invite-email-${mode}`}
                  type="email"
                  placeholder="admin@edumyles.com"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="h-12 border-border/70 bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`invite-department-${mode}`}>Department</Label>
                <Input
                  id={`invite-department-${mode}`}
                  placeholder="Operations"
                  value={form.department}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, department: event.target.value }))
                  }
                  className="h-12 border-border/70 bg-background"
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <Label htmlFor={`invite-role-${mode}`}>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
                >
                  <SelectTrigger
                    id={`invite-role-${mode}`}
                    className="h-12 border-border/70 bg-background"
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

              <div className="min-w-[220px] rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Selected Role
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {selectedRole?.name ?? "Select a role"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {(selectedRole?.permissions?.length ?? 0).toLocaleString()} mapped permissions
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`invite-message-${mode}`}>Personal Message</Label>
              <Textarea
                id={`invite-message-${mode}`}
                placeholder="Add an onboarding note, handoff context, or expectations for the new admin."
                value={form.personalMessage}
                onChange={(event) =>
                  setForm((current) => ({ ...current, personalMessage: event.target.value }))
                }
                className="min-h-[160px] border-border/70 bg-background"
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This message is optional and can help the recipient understand why they are being
                invited.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-3">
              <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="min-w-[190px]">
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

      <Card className="h-fit border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
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

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-border/70 bg-background/90 p-4">
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
                    className="rounded-xl border border-border/70 bg-background/90 px-3 py-2.5 text-xs font-mono text-foreground shadow-sm"
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
