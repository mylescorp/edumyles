"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, GraduationCap, Calendar, Hash, BookOpen } from "lucide-react";

export default function StudentProfilePage() {
  const { user, isLoading } = useAuth();

  const myProfile = useQuery(
    api.modules.portal.student.queries.getMyProfile,
    {}
  );

  if (isLoading || myProfile === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !myProfile) {
    return (
      <div>
        <PageHeader
          title="My Profile"
          description="View your student information"
        />
        <p className="text-muted-foreground">No profile found for your account.</p>
      </div>
    );
  }

  const fullName = `${myProfile.firstName ?? ""} ${myProfile.lastName ?? ""}`.trim() || "N/A";

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your student information and enrollment details"
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
              <p className="text-sm font-medium text-muted-foreground">Date of Birth</p>
              <p className="text-sm mt-0.5">
                {(myProfile as any).dateOfBirth
                  ? new Date((myProfile as any).dateOfBirth).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gender</p>
              <p className="text-sm mt-0.5 capitalize">
                {(myProfile as any).gender ?? "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Hash className="h-3.5 w-3.5" /> Student ID
              </p>
              <p className="text-sm mt-0.5 font-mono">
                {(myProfile as any).admissionNumber ?? (myProfile as any).admissionNo ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" /> Class
              </p>
              <p className="text-sm mt-0.5">
                {(myProfile as any).classId ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Grade / Stream</p>
              <p className="text-sm mt-0.5">
                {(myProfile as any).streamId ?? (myProfile as any).grade ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Enrollment Date
              </p>
              <p className="text-sm mt-0.5">
                {(myProfile as any).enrolledAt
                  ? new Date((myProfile as any).enrolledAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrollment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="text-sm mt-0.5 capitalize">
                {(myProfile as any).status ?? "active"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Curriculum</p>
              <p className="text-sm mt-0.5">
                {(myProfile as any).curriculum ?? "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
