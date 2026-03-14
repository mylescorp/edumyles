"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function PartnerProfilePage() {
  const { user, isLoading, partnerProfile, sessionToken } = useAuth();
  const updateProfile = useMutation(api.modules.portal.partner.mutations.updatePartnerProfile);

  const handleProfileUpdate = async (data: any) => {
    if (!sessionToken) return;
    
    await updateProfile({
      sessionToken,
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      sponsorshipTerms: data.sponsorshipTerms,
    });
  };

  const handleAvatarUpload = async (file: File) => {
    // TODO: Implement avatar upload for partners
    console.log("Avatar upload not yet implemented for partners");
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!user || !partnerProfile) {
    return (
      <div>
        <PageHeader title="Partner profile" description="Organization profile" />
        <p className="text-muted-foreground">No partner profile found for your account.</p>
      </div>
    );
  }

  // Convert partner profile to UserProfile format
  const userProfileData = {
    ...user,
    ...partnerProfile,
    firstName: (partnerProfile as any)?.organizationName || (user as any)?.firstName || "",
    lastName: "",
    phone: (partnerProfile as any)?.contactPhone || (user as any)?.phone || "",
  };

  return (
    <div>
      <PageHeader
        title="Partner profile"
        description="Update your organization details and sponsorship terms"
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
