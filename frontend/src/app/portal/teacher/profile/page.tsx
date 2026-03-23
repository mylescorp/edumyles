"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Hash, Briefcase } from "lucide-react";

export default function TeacherProfilePage() {
  const { user, isLoading, tenantProfile } = useAuth();

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user) {
    return (
      <div>
        <PageHeader
          title="My Profile"
          description="View your staff information"
        />
        <p className="text-muted-foreground">No profile found for your account.</p>
      </div>
    );
  }

  const fullName =
    `${(user as any).firstName ?? ""} ${(user as any).lastName ?? ""}`.trim() || user.email;

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your staff information and teaching details"
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-muted-foreground" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="text-sm mt-0.5">{fullName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email
              </p>
              <p className="text-sm mt-0.5">{user.email ?? "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-sm mt-0.5">
                {(user as any).phone ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Account Status</p>
              <p className="text-sm mt-0.5 capitalize">
                {(user as any).isActive === false ? "Inactive" : "Active"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Employment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              Employment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" /> Employee ID
              </p>
              <p className="text-sm mt-0.5 font-mono">
                {(tenantProfile as any)?.employeeId ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm mt-0.5">
                {(tenantProfile as any)?.department ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Subjects Taught</p>
              <p className="text-sm mt-0.5">
                {Array.isArray((tenantProfile as any)?.subjects)
                  ? (tenantProfile as any).subjects.join(", ")
                  : (tenantProfile as any)?.subject ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-sm mt-0.5 capitalize">
                {(user as any).role?.replace(/_/g, " ") ?? "Teacher"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
