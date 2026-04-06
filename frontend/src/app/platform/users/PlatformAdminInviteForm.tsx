"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { api } from "@/convex/_generated/api";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, CheckCircle2, Copy, Mail, UserPlus, Users } from "lucide-react";
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
  const invitePlatformUser = useMutation(api.modules.platform.users.invitePlatformUser);

  const [form, setForm] = useState({
    email: "",
    role: "super_admin",
    department: "",
    personalMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{ invitedEmail: string; token: string } | null>(null);

  const resetFlow = () => {
    setForm({ email: "", role: "super_admin", department: "", personalMessage: "" });
    setError(null);
    setCopied(false);
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
      const response = await invitePlatformUser({
        sessionToken,
        email: parsed.data.email,
        role: parsed.data.role,
        department: parsed.data.department?.trim() || undefined,
        personalMessage: parsed.data.personalMessage?.trim() || undefined,
      });

      setResult({
        invitedEmail: parsed.data.email,
        token: response.token,
      });
      onComplete?.();
      toast.success(`Invitation queued for ${parsed.data.email}`);
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

  if (result) {
    return (
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
          <span>
            Invite created for <strong>{result.invitedEmail}</strong>. Email delivery was handed off to Convex.
          </span>
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
            Keep this token for support follow-up in case the invite email needs to be resent.
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
              <SelectItem value="master_admin">Master Admin</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="platform_manager">Platform Manager</SelectItem>
              <SelectItem value="support_agent">Support Agent</SelectItem>
              <SelectItem value="billing_admin">Billing Admin</SelectItem>
              <SelectItem value="marketplace_reviewer">Marketplace Reviewer</SelectItem>
              <SelectItem value="content_moderator">Content Moderator</SelectItem>
              <SelectItem value="analytics_viewer">Analytics Viewer</SelectItem>
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
  );
}
