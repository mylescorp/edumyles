"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, CheckCircle2, AlertTriangle, Users } from "lucide-react";

export default function InviteAdminPage() {
  const { isLoading, sessionToken } = useAuth();
  const { hasRole } = usePermissions();
  const isMasterAdmin = hasRole("master_admin");
  const router = useRouter();
  const createAdmin = useMutation(api.platform.users.mutations.createPlatformAdmin);

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "super_admin" as "master_admin" | "super_admin",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

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
      await createAdmin({ ...form, sessionToken: sessionToken! });
      setSuccessEmail(form.email);
    } catch (err: any) {
      setError(err.message || "Failed to create admin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInviteAnother = () => {
    setSuccessEmail(null);
    setForm({ email: "", firstName: "", lastName: "", role: "super_admin" });
    setError(null);
  };

  if (successEmail) {
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
          <CardContent className="pt-6 space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold">Admin Account Created</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Account created for{" "}
                  <span className="font-medium text-foreground">{successEmail}</span>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">No invitation email was sent</p>
                  <p className="mt-1">
                    Email invitations require WorkOS integration (not yet configured). The new
                    admin can log in directly at{" "}
                    <span className="font-mono text-xs bg-amber-100 px-1 rounded">/auth/login</span>{" "}
                    using their email address.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleInviteAnother}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Another
              </Button>
              <Button
                className="flex-1 bg-[#056C40] hover:bg-[#023c24]"
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
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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
                {submitting ? "Creating..." : "Invite Admin"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
