"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UserProfile } from "@/components/shared/UserProfile";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export default function StudentProfile() {
    const { user, isLoading, studentProfile, sessionToken } = useAuth();
    const updateProfile = useMutation(api.modules.portal.student.mutations.updateStudentProfile);

    const handleProfileUpdate = async (data: any) => {
        if (!sessionToken) return;
        
        await updateProfile({
            sessionToken,
            firstName: data.firstName,
            lastName: data.lastName,
            phone: data.phone,
            bio: data.bio,
            location: data.location,
        });
    };

    const handleAvatarUpload = async (file: File) => {
        // TODO: Implement avatar upload for students
        console.log("Avatar upload not yet implemented for students");
    };

    if (isLoading) {
        return <LoadingSkeleton variant="page" />;
    }

    if (!user || !studentProfile) {
        return (
            <div>
                <PageHeader title="My Profile" description="View and manage your personal information." />
                <p className="text-muted-foreground">No profile found for your account.</p>
            </div>
        );
    }

    // Convert student profile to UserProfile format
    const userProfileData = {
        ...user,
        ...studentProfile,
        firstName: (studentProfile as any)?.firstName || (user as any)?.firstName || "",
        lastName: (studentProfile as any)?.lastName || (user as any)?.lastName || "",
        phone: (studentProfile as any)?.phone || (user as any)?.phone || "",
        avatarUrl: (studentProfile as any)?.photo || (user as any)?.avatarUrl,
    };

    return (
        <div>
            <PageHeader
                title="My Profile"
                description="View and manage your personal information."
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
