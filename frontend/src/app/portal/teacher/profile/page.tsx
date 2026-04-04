"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Hash, Briefcase, Phone, CalendarDays, GraduationCap, ShieldCheck } from "lucide-react";

export default function TeacherProfilePage() {
  const { user, isLoading, tenantProfile, sessionToken } = useAuth();
  const staffProfile = useQuery(
    api.modules.hr.queries.getCurrentStaffProfile,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  );

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
  const subjectList = Array.isArray((tenantProfile as any)?.subjects)
    ? (tenantProfile as any).subjects
    : (tenantProfile as any)?.subject
      ? [(tenantProfile as any).subject]
      : [];
  const teacherRole = staffProfile?.role ?? (user as any).role ?? "teacher";
  const department = staffProfile?.department ?? (tenantProfile as any)?.department ?? "Not assigned";
  const employeeId = staffProfile?.employeeId ?? (tenantProfile as any)?.employeeId ?? "Not assigned";
  const joinedDate = staffProfile?.joinDate
    ? new Date(staffProfile.joinDate).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
    : null;
  const qualification = staffProfile?.qualification ?? "Not recorded";
  const status = staffProfile?.status ?? ((user as any).isActive === false ? "inactive" : "active");

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
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Phone
              </p>
              <p className="text-sm mt-0.5">
                {staffProfile?.phone ?? (user as any).phone ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> Staff Status
              </p>
              <Badge variant={status === "active" ? "default" : "secondary"} className="mt-1 capitalize">
                {status.replace(/_/g, " ")}
              </Badge>
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
              <p className="text-sm mt-0.5 font-mono">{employeeId}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm mt-0.5">{department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Subjects Taught
              </p>
              <p className="text-sm mt-0.5">{subjectList.length > 0 ? subjectList.join(", ") : "Not assigned"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Role</p>
              <p className="text-sm mt-0.5 capitalize">{teacherRole.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Qualification</p>
              <p className="text-sm mt-0.5">{qualification}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Join Date
              </p>
              <p className="text-sm mt-0.5">{joinedDate ?? "Not recorded"}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
