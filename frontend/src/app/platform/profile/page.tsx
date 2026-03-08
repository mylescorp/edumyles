"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Shield,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Lock,
  Globe,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { getRoleLabel } from "@/lib/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";

export default function ProfilePage() {
  const { user: sessionUser, sessionToken, logout } = useAuth();
  const { toast } = useToast();

  const profileData = usePlatformQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken },
    !!sessionToken
  ) as any;

  const updateProfile = useMutation(api.platform.users.mutations.updateUserProfile);
  const generateUploadUrl = useMutation(api.platform.users.mutations.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.platform.users.mutations.saveUserAvatar);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState<{
    firstName: string;
    lastName: string;
    phone: string;
    bio: string;
    location: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = profileData === undefined && !!sessionToken;

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: profileData?.firstName ?? "",
      lastName: profileData?.lastName ?? "",
      phone: profileData?.phone ?? "",
      bio: profileData?.bio ?? "",
      location: profileData?.location ?? "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || !sessionToken) return;
    setIsSaving(true);
    try {
      await updateProfile({
        sessionToken,
        firstName: editForm.firstName || undefined,
        lastName: editForm.lastName || undefined,
        phone: editForm.phone || undefined,
        bio: editForm.bio || undefined,
        location: editForm.location || undefined,
      });
      setIsEditing(false);
      setEditForm(null);
      toast({ title: "Profile Updated", description: "Your profile has been saved." });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionToken) return;
    setIsUploadingAvatar(true);
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken });
      const result = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!result.ok) throw new Error("Upload failed");
      const { storageId } = await result.json();
      await saveAvatar({ sessionToken, storageId });
      toast({ title: "Photo Updated", description: "Your avatar has been updated." });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const firstName = isEditing ? (editForm?.firstName ?? "") : (profileData?.firstName ?? sessionUser?.firstName ?? "");
  const lastName = isEditing ? (editForm?.lastName ?? "") : (profileData?.lastName ?? sessionUser?.lastName ?? "");
  const email = profileData?.email ?? sessionUser?.email ?? "";
  const role = profileData?.role ?? sessionUser?.role ?? "";
  const avatarUrl = profileData?.avatarUrl ?? sessionUser?.avatarUrl;
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() ||
    email[0]?.toUpperCase() ||
    "U";
  const createdAt = profileData?.createdAt ? new Date(profileData.createdAt) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Management"
        description="Manage your account settings and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Profile", href: "/platform/profile" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-[#056C40] hover:bg-[#023c24]"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Overview Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={firstName} />
                    <AvatarFallback className="text-2xl bg-[#056C40] text-white">
                      {isUploadingAvatar ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        initials
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                      <Button
                        size="sm"
                        className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {[firstName, lastName].filter(Boolean).join(" ") || email}
                  </h2>
                  <p className="text-sm text-muted-foreground">{email}</p>
                  <div className="mt-2">
                    <Badge className="bg-purple-100 text-purple-800">
                      {getRoleLabel(role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {(isEditing ? editForm?.location : profileData?.location) && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{isEditing ? editForm?.location : profileData?.location}</span>
                </div>
              )}
              {createdAt && (
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined {createdAt.toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span>{getRoleLabel(role)}</span>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={logout}
                >
                  <X className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={isEditing ? (editForm?.firstName ?? "") : (profileData?.firstName ?? "")}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, firstName: e.target.value } : f))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={isEditing ? (editForm?.lastName ?? "") : (profileData?.lastName ?? "")}
                        onChange={(e) =>
                          setEditForm((f) => (f ? { ...f, lastName: e.target.value } : f))
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={isEditing ? (editForm?.phone ?? "") : (profileData?.phone ?? "")}
                      onChange={(e) =>
                        setEditForm((f) => (f ? { ...f, phone: e.target.value } : f))
                      }
                      disabled={!isEditing}
                      placeholder="+254 712 345 678"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={isEditing ? (editForm?.bio ?? "") : (profileData?.bio ?? "")}
                      onChange={(e) =>
                        setEditForm((f) => (f ? { ...f, bio: e.target.value } : f))
                      }
                      disabled={!isEditing}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={isEditing ? (editForm?.location ?? "") : (profileData?.location ?? "")}
                      onChange={(e) =>
                        setEditForm((f) => (f ? { ...f, location: e.target.value } : f))
                      }
                      disabled={!isEditing}
                      placeholder="Nairobi, Kenya"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Globe className="h-4 w-4 mr-2" />
                      View Active Sessions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50">
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Logged In</p>
                        <p className="text-sm text-muted-foreground">
                          Currently logged in as {getRoleLabel(role)}
                        </p>
                      </div>
                    </div>
                    <div className="text-center py-4">
                      <Button variant="outline" asChild>
                        <a href="/platform/audit">View Full Audit Log</a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
