"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Check, CheckCircle2, Copy, Mail, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";

type PlatformAdminRole = "master_admin" | "super_admin";

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
    firstName: "",
    lastName: "",
    role: "super_admin" as PlatformAdminRole,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    invitedEmail: string;
    emailSent: boolean;
    signUpUrl: string;
    workosError?: string;
  } | null>(null);

  const resetFlow = () => {
    setForm({ email: "", firstName: "", lastName: "", role: "super_admin" });
    setError(null);
    setCopied(false);
    setResult(null);
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!form.email || !form.firstName || !form.lastName) {
      setError("First name, last name, and email are required.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/platform/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionToken }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.error ?? "Failed to invite platform admin.");
        return;
      }

      const inviteResult = {
        invitedEmail: form.email,
        emailSent: data.emailSent ?? false,
        signUpUrl: data.signUpUrl ?? `${window.location.origin}/auth/login/api`,
        workosError: data.workosError,
      };

      setResult(inviteResult);
      onComplete?.();

      if (inviteResult.emailSent) {
        toast.success(`Invitation email sent to ${inviteResult.invitedEmail}`);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unexpected error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!result?.signUpUrl) return;
    await navigator.clipboard.writeText(result.signUpUrl);
    setCopied(true);
    toast.success("Link copied");
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (result) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>
            User <strong>{result.invitedEmail}</strong> created successfully.
          </span>
        </div>

        {result.emailSent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              <div className="text-sm text-green-800">
                <p className="font-semibold">Invitation email sent</p>
                <p className="mt-1 text-green-700">
                  {result.invitedEmail} will receive a sign-in link that expires in 7 days.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Invitation email not sent</p>
                  <p className="mt-1 text-xs text-amber-700">
                    {result.workosError ?? "WorkOS is not configured for invitation delivery."}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Share this sign-up link directly:</p>
              <div className="flex gap-2">
                <Input readOnly value={result.signUpUrl} className="font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send this link to <strong>{result.invitedEmail}</strong> via email, WhatsApp, or Slack.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={resetFlow}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Another
          </Button>
          {mode === "page" ? (
            <Button onClick={() => router.push("/platform/users")}>
              <Users className="mr-2 h-4 w-4" />
              View All Admins
            </Button>
          ) : (
            <Button onClick={onCancel}>Done</Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`invite-firstName-${mode}`}>First Name</Label>
          <Input
            id={`invite-firstName-${mode}`}
            placeholder="John"
            value={form.firstName}
            onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`invite-lastName-${mode}`}>Last Name</Label>
          <Input
            id={`invite-lastName-${mode}`}
            placeholder="Doe"
            value={form.lastName}
            onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`invite-email-${mode}`}>Email</Label>
        <Input
          id={`invite-email-${mode}`}
          type="email"
          placeholder="john@edumyles.com"
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`invite-role-${mode}`}>Role</Label>
        <Select
          value={form.role}
          onValueChange={(value) => setForm((current) => ({ ...current, role: value as PlatformAdminRole }))}
        >
          <SelectTrigger id={`invite-role-${mode}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="super_admin">Super Admin</SelectItem>
            <SelectItem value="master_admin">Master Admin</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {form.role === "master_admin"
            ? "Full platform control including billing, settings, and tenant operations."
            : "Operational platform access for support, visibility, and administration."}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
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
  );
}
