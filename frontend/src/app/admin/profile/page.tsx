"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useAction } from "@/hooks/useSSRSafeConvex";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useMutation as useConvexMutation } from "convex/react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Shield,
  Edit,
  Save,
  X,
  Lock,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  KeyRound,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getRoleLabel } from "@/lib/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/convex/_generated/api";

// ─── Change Password Modal ───────────────────────────────────────────────────
function ChangePasswordModal({
  open,
  onOpenChange,
  sessionToken,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessionToken: string | null;
}) {
  const changePassword = useAction((api as any)["actions/auth/password"].changePassword);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!sessionToken) return;
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      await changePassword({ sessionToken, currentPassword, newPassword });
      toast.success("Password changed successfully");
      onOpenChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message ?? "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Current Password</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowCurrent((v) => !v)}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setShowNew((v) => !v)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Change Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Profile Page ───────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const { user, isLoading, sessionToken, logout } = useAuth();
  const updateProfile = useMutation(api.platform.users.mutations.updateUserProfile);
  const generateUploadUrl = useConvexMutation(api.users.generateAvatarUploadUrl);
  const saveAvatar = useConvexMutation(api.users.saveUserAvatar);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const anyUser = user as any;
  const [firstName, setFirstName] = useState(anyUser?.firstName ?? "");
  const [lastName, setLastName] = useState(anyUser?.lastName ?? "");
  const [phone, setPhone] = useState(anyUser?.phone ?? "");

  const sessions = useQuery(
    api.sessions.listUserSessions,
    sessionToken ? { sessionToken } : "skip"
  );
  const activeSessions = Array.isArray(sessions) ? sessions : [];

  if (isLoading) return <LoadingSkeleton variant="page" />;
  if (!user) return null;

  const displayName =
    `${anyUser?.firstName || ""} ${anyUser?.lastName || ""}`.trim() || anyUser?.email || "User";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSave = async () => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
      await updateProfile({ sessionToken, firstName, lastName, phone });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

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

  const handleCancelEdit = () => {
    setFirstName(anyUser?.firstName ?? "");
    setLastName(anyUser?.lastName ?? "");
    setPhone(anyUser?.phone ?? "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your personal information and account security"
        actions={
          isEditing ? (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          )
        }
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
        </TabsList>

        {/* ── Profile Tab ── */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your name and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{displayName}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge variant="secondary" className="mt-1">
                    {getRoleLabel(anyUser?.role ?? "admin")}
                  </Badge>
                  <div className="mt-2">
                    <label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button variant="outline" size="sm" type="button" asChild>
                        <span>Change Photo</span>
                      </Button>
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAvatarUpload(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                    />
                  ) : (
                    <p className="text-sm py-2">{anyUser?.firstName || "—"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Last name"
                    />
                  ) : (
                    <p className="text-sm py-2">{anyUser?.lastName || "—"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label>Email Address</Label>
                  <p className="text-sm py-2 text-muted-foreground">{user.email}</p>
                </div>
                <div className="space-y-1">
                  <Label>Phone Number</Label>
                  {isEditing ? (
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 700 000 000"
                    />
                  ) : (
                    <p className="text-sm py-2">{anyUser?.phone || "—"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Password</p>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your current session
                    </p>
                  </div>
                </div>
                <Button variant="destructive" onClick={logout}>
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sessions Tab ── */}
        <TabsContent value="sessions" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>Devices and browsers currently signed in to your account</CardDescription>
            </CardHeader>
            <CardContent>
              {!sessions ? (
                <LoadingSkeleton variant="list" />
              ) : activeSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No active sessions found.
                </p>
              ) : (
                <div className="space-y-3">
                  {activeSessions.map((session: any) => (
                    <div
                      key={session._id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium">
                            {session.userAgent ?? "Unknown device"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last active:{" "}
                            {session.lastActiveAt
                              ? new Date(session.lastActiveAt).toLocaleString()
                              : "Unknown"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={session.isCurrentSession ? "default" : "outline"}>
                        {session.isCurrentSession ? "Current" : "Active"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showPasswordModal}
        onOpenChange={setShowPasswordModal}
        sessionToken={sessionToken}
      />
    </div>
  );
}
