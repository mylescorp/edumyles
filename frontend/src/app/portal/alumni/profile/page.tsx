"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, GraduationCap, Calendar, Phone, Pencil } from "lucide-react";

export default function AlumniProfilePage() {
  const { user, isLoading } = useAuth();

  const alumniProfile = useQuery(
    api.modules.portal.alumni.queries.getAlumniProfile,
    {}
  );

  if (isLoading || alumniProfile === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !alumniProfile) {
    return (
      <div>
        <PageHeader
          title="My Profile"
          description="View your alumni information"
        />
        <p className="text-muted-foreground">No profile found for your account.</p>
      </div>
    );
  }

  const fullName =
    `${alumniProfile.firstName ?? ""} ${alumniProfile.lastName ?? ""}`.trim() || user.email;

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your alumni information and contact details"
        actions={
          <Button variant="outline" size="sm" disabled>
            <Pencil className="h-4 w-4 mr-2" />
            Update Profile
          </Button>
        }
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
                {(alumniProfile as any).phone ?? "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Academic History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Academic History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Graduation Year
              </p>
              <p className="text-sm mt-0.5">
                {(alumniProfile as any).graduationYear ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Class / Program</p>
              <p className="text-sm mt-0.5">
                {(alumniProfile as any).program ??
                  (alumniProfile as any).lastClass ??
                  "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Employer</p>
              <p className="text-sm mt-0.5">
                {(alumniProfile as any).currentEmployer ?? "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Position</p>
              <p className="text-sm mt-0.5">
                {(alumniProfile as any).currentPosition ?? "N/A"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
