"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, GraduationCap, Calendar, Phone, Pencil, Save, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AlumniProfilePage() {
  const { user, isLoading } = useAuth();

  const alumniProfile = useQuery(
    api.modules.portal.alumni.queries.getAlumniProfile,
    {}
  );

  const updateAlumniProfile = useMutation(api.modules.portal.alumni.mutations.updateAlumniProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [currentEmployer, setCurrentEmployer] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");

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

  const handleEdit = () => {
    setPhone((alumniProfile as any).phone ?? (alumniProfile as any).contactPhone ?? "");
    setCurrentEmployer((alumniProfile as any).currentEmployer ?? "");
    setCurrentPosition((alumniProfile as any).currentPosition ?? (alumniProfile as any).jobTitle ?? "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAlumniProfile({
        currentEmployer: currentEmployer || undefined,
        jobTitle: currentPosition || undefined,
        contactPhone: phone || undefined,
      });
      toast.success("Profile updated successfully.");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Your alumni information and contact details"
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Pencil className="h-4 w-4 mr-2" />
              Update Profile
            </Button>
          )
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
              {isEditing ? (
                <div className="mt-1">
                  <Label className="sr-only">Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+254 700 000 000"
                  />
                </div>
              ) : (
                <p className="text-sm mt-0.5">
                  {(alumniProfile as any).phone ?? (alumniProfile as any).contactPhone ?? "N/A"}
                </p>
              )}
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
              {isEditing ? (
                <div className="mt-1">
                  <Label className="sr-only">Current Employer</Label>
                  <Input
                    value={currentEmployer}
                    onChange={(e) => setCurrentEmployer(e.target.value)}
                    placeholder="Company or organisation"
                  />
                </div>
              ) : (
                <p className="text-sm mt-0.5">
                  {(alumniProfile as any).currentEmployer ?? "N/A"}
                </p>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Current Position</p>
              {isEditing ? (
                <div className="mt-1">
                  <Label className="sr-only">Current Position</Label>
                  <Input
                    value={currentPosition}
                    onChange={(e) => setCurrentPosition(e.target.value)}
                    placeholder="Job title or role"
                  />
                </div>
              ) : (
                <p className="text-sm mt-0.5">
                  {(alumniProfile as any).currentPosition ?? (alumniProfile as any).jobTitle ?? "N/A"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
