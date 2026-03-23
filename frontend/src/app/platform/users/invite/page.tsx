"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle2, AlertTriangle, Users, Mail } from "lucide-react";

export default function InviteAdminPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const isMasterAdmin = hasRole("master_admin");
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "super_admin" as "master_admin" | "super_admin",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    email: string;
    emailSent: boolean;
    warning?: string;
  } | null>(null);

  if (isLoading) return <LoadingSkeleton variant="page" />;

  if (!isMasterAdmin) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Only Master Admins can invite new platform administrators.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/platform/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, sessionToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to invite admin");
        return;
      }

      setResult({
        email: form.email,
        emailSent: data.emailSent ?? false,
        warning: data.warning,
      });
    } catch (err: any) {
      setError(err.message || "Failed to invite admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteAnother = () => {
    setResult(null);
    setForm({ email: "", firstName: "", lastName: "", role: "super_admin" });
    setError(null);
  };

  if (result) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Card className="w-full max-w-md overflow-hidden shadow-lg">
          {/* Success banner */}
          <div className="bg-gradient-to-br from-primary to-primary-dark px-8 py-10 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Admin Invited!</h2>
            <p className="text-green-100 text-sm mt-1">
              {result.emailSent
                ? "An invitation email has been sent"
                : "Account created — see note below"}
            </p>
          </div>

          <CardContent className="pt-6 space-y-5">
            {/* Email highlight box */}
            <div className="rounded-lg border bg-muted/40 p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Invited email</p>
              <p className="font-mono font-semibold text-foreground break-all">{result.email}</p>
            </div>

            {/* Status notice */}
            {result.emailSent ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold">Invitation email sent</p>
                    <p className="mt-1 text-green-700">
                      {result.email} will receive a link to set their password and access the platform.
                      The invitation expires in 7 days.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-800">
                    <p className="font-semibold">No invitation email sent</p>
                    <p className="mt-1 text-amber-700">
                      {result.warning ?? "WorkOS integration is not configured."} Share the login
                      link manually:{" "}
                      <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                        /auth/login/api
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={handleInviteAnother}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Another
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary-dark"
                onClick={() => router.push("/platform/users")}
              >
                <Users className="h-4 w-4 mr-2" />
                View All Admins
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Invite Platform Admin"
        description="Add a new administrator to the platform"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Invite" },
        ]}
      />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Admin Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-danger bg-danger-bg p-3 text-sm text-danger">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={form.lastName}
                  onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@edumyles.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) =>
                  setForm((p) => ({ ...p, role: v as "master_admin" | "super_admin" }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {form.role === "master_admin"
                  ? "Full platform control: tenant management, billing, user management, all settings."
                  : "Limited platform access: can view tenants and audit logs, but cannot manage billing or create other admins."}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Sending invite…" : "Send Invitation"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
