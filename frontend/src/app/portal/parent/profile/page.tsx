"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function ParentProfilePage() {
  const { user, isLoading, parentProfile, sessionToken } = useAuth();
  const updateProfile = useMutation(api.modules.portal.parent.mutations.updateParentProfile);

  const handleProfileUpdate = async (data: any) => {
    if (!sessionToken) return;
    
    await updateProfile({
      sessionToken,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      occupation: data.occupation,
      employer: data.employer,
      workPhone: data.workPhone,
    });
  };

  const handleAvatarUpload = async (file: File) => {
    // TODO: Implement avatar upload for parents
    console.log("Avatar upload not yet implemented for parents");
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !parentProfile) {
    return (
      <div>
        <PageHeader title="My Profile" description="Manage your contact information and notification preferences" />
        <p className="text-muted-foreground">No profile found for your account.</p>
      </div>
    );
  }

  // Convert parent profile to UserProfile format
  const userProfileData = {
    ...user,
    ...parentProfile,
    firstName: (parentProfile as any)?.firstName || (user as any)?.firstName,
    lastName: (parentProfile as any)?.lastName || (user as any)?.lastName,
    phone: (parentProfile as any)?.phone || (user as any)?.phone,
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        description="Manage your contact information and notification preferences"
      />

      <UserProfile
        profile={userProfileData}
        onUpdate={handleProfileUpdate}
        onAvatarUpload={handleAvatarUpload}
        editable={true}
        showTabs={false}
        variant="full"
      />
    </div>
  );
}

