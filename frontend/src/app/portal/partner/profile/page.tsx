"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

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

  const generateUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.users.saveUserAvatar);

  const handleAvatarUpload = async (file: File) => {
    if (!sessionToken) return;
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken });
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await saveAvatar({ sessionToken, storageId });
      toast.success("Profile photo updated successfully.");
    } catch {
      toast.error("Failed to upload profile photo. Please try again.");
    }
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
