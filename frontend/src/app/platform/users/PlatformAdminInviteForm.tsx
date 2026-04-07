"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { Check, CheckCircle2, Copy, ExternalLink, Link as LinkIcon, Mail, TriangleAlert, UserPlus, Users } from "lucide-react";
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
    department: "",
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

  const resetFlow = () => {
    setForm({ email: "", role: "super_admin", department: "", personalMessage: "" });
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
      <div className="space-y-4 py-2">
        {result.emailSent ? (
          <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
            <span>
              WorkOS login invitation sent to <strong>{result.invitedEmail}</strong>.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Invite record was created for <strong>{result.invitedEmail}</strong>, but the WorkOS email could not be sent.
              {result.workosError ? ` ${result.workosError}` : ""}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Direct WorkOS sign-up link</p>
          <div className="flex gap-2">
            <Input readOnly value={result.signUpUrl} className="text-xs" />
            <Button size="sm" variant="outline" onClick={handleCopyUrl}>
              {copiedUrl ? <Check className="h-4 w-4 text-green-600" /> : <LinkIcon className="h-4 w-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(result.signUpUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Share this link manually if the recipient needs a direct path into WorkOS sign-up.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Fallback invite token</p>
          <div className="flex gap-2">
            <Input readOnly value={result.token} className="font-mono text-xs" />
            <Button size="sm" variant="outline" onClick={handleCopyToken}>
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Keep this token for platform support follow-up and invite reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
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
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <form onSubmit={handleSubmit} className="space-y-5">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`invite-email-${mode}`}>Email</Label>
        <Input
          id={`invite-email-${mode}`}
          type="email"
          placeholder="admin@edumyles.com"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`invite-role-${mode}`}>Role</Label>
          <Select
            value={form.role}
            onValueChange={(value) => setForm((current) => ({ ...current, role: value }))}
          >
            <SelectTrigger id={`invite-role-${mode}`}>
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

        <div className="space-y-2">
          <Label htmlFor={`invite-department-${mode}`}>Department</Label>
          <Input
            id={`invite-department-${mode}`}
            placeholder="Operations"
            value={form.department}
            onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`invite-message-${mode}`}>Personal Message</Label>
        <Textarea
          id={`invite-message-${mode}`}
          placeholder="Optional onboarding note for the invite email"
          value={form.personalMessage}
          onChange={(event) => setForm((current) => ({ ...current, personalMessage: event.target.value }))}
          rows={4}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
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

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Permission Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="font-medium">{selectedRole?.name ?? "Select a role"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedRole?.description ?? "Role capabilities will appear here."}
            </p>
          </div>
          <div className="space-y-2">
            {(selectedRole?.permissions ?? []).slice(0, 12).map((permission: string) => (
              <div key={permission} className="rounded-lg border px-3 py-2 text-xs font-mono">
                {permission}
              </div>
            ))}
            {(selectedRole?.permissions?.length ?? 0) > 12 ? (
              <p className="text-xs text-muted-foreground">
                And {(selectedRole?.permissions?.length ?? 0) - 12} more permissions.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
