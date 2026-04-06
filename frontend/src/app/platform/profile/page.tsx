"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation, useAction } from "@/hooks/useSSRSafeConvex";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Monitor,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  LogOut,
  Clock,
  ShieldCheck,
  KeyRound,
  Plus,
  Check,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
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

// ─── Change Password Modal ──────────────────────────────────────────────────
function ChangePasswordModal({
  open,
  onOpenChange,
  sessionToken,
  hasExistingPassword,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
  hasExistingPassword: boolean;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const changePassword = useAction(api.actions.auth.password.changePassword);
  const setInitialPassword = useAction(api.actions.auth.password.setInitialPassword);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setShowCurrent(false);
    setShowNew(false);
  };

  const handleSubmit = async () => {
    setError("");

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (hasExistingPassword && !currentPassword) {
      setError("Current password is required");
      return;
    }

    setIsSubmitting(true);
    try {
      if (hasExistingPassword) {
        await changePassword({ sessionToken, currentPassword, newPassword });
      } else {
        await setInitialPassword({ sessionToken, newPassword });
      }
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully. Other sessions have been signed out.",
      });
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            {hasExistingPassword ? "Change Password" : "Set Password"}
          </DialogTitle>
          <DialogDescription>
            {hasExistingPassword
              ? "Enter your current password and choose a new one."
              : "Set a password for your account. You can use this to log in directly."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {hasExistingPassword && (
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNew(!showNew)}
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-red-500">Must be at least 8 characters</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {hasExistingPassword ? "Change Password" : "Set Password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Active Sessions Modal ──────────────────────────────────────────────────
function ActiveSessionsModal({
  open,
  onOpenChange,
  sessionToken,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
}) {
  const { toast } = useToast();

  const sessions = useQuery(
    api.sessions.listUserSessions,
    sessionToken ? { sessionToken } : "skip"
  );

  const deleteSessionById = useMutation(api.sessions.deleteSessionById);
  const deleteAllSessions = useMutation(api.sessions.deleteAllUserSessions);

  const [terminatingId, setTerminatingId] = useState<string | null>(null);
  const [terminatingAll, setTerminatingAll] = useState(false);

  const handleTerminate = async (targetSessionId: any) => {
    setTerminatingId(targetSessionId);
    try {
      await deleteSessionById({ sessionToken, targetSessionId });
      toast({ title: "Session Terminated", description: "The session has been ended." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTerminatingId(null);
    }
  };

  const handleTerminateAll = async () => {
    setTerminatingAll(true);
    try {
      await deleteAllSessions({ sessionToken, exceptCurrent: true });
      toast({
        title: "All Other Sessions Terminated",
        description: "All other sessions have been signed out.",
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTerminatingAll(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </DialogTitle>
          <DialogDescription>
            Manage your active login sessions across devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
          {!sessions ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Monitor}
              title="No active sessions found"
              description="There are no additional saved sessions available for this account right now."
              className="py-6"
            />
          ) : (
            sessions.map((s: any) => (
              <div
                key={s._id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  s.isCurrent ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {s.deviceInfo || "Unknown Device"}
                      {s.isCurrent && (
                        <Badge variant="outline" className="text-xs text-primary border-primary">
                          Current
                        </Badge>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Created {new Date(s.createdAt).toLocaleDateString()} at{" "}
                      {new Date(s.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                {!s.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleTerminate(s._id)}
                    disabled={terminatingId === s._id}
                  >
                    {terminatingId === s._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            onClick={handleTerminateAll}
            disabled={terminatingAll || !sessions || sessions.length <= 1}
            className="w-full sm:w-auto"
          >
            {terminatingAll ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogOut className="h-4 w-4 mr-2" />}
            Sign Out All Other Sessions
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Two-Factor Auth Modal ──────────────────────────────────────────────────
function TwoFactorModal({
  open,
  onOpenChange,
  sessionToken,
  twoFactorEnabled,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
  twoFactorEnabled: boolean;
  onSuccess?: () => void;
}) {
  const { toast } = useToast();
  const generateSecret = useAction(api.actions.auth.twoFactor.generateTwoFactorSecret);
  const enableTwoFactor = useAction(api.actions.auth.twoFactor.enableTwoFactor);
  const disableTwoFactor = useAction(api.actions.auth.twoFactor.disableTwoFactor);

  const [setupStep, setSetupStep] = useState<"info" | "setup" | "verify">("info");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resetSetup = () => {
    setSetupStep("info");
    setQrCode("");
    setSecret("");
    setBackupCodes([]);
    setVerificationCode("");
    setError("");
  };

  const handleStartSetup = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      const result = await generateSecret({ sessionToken });
      setQrCode(result.qrCode);
      setSecret(result.secret);
      setBackupCodes(result.backupCodes);
      setSetupStep("setup");
    } catch (err: any) {
      setError(err.message || "Failed to generate 2FA secret");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnableTwoFactor = async () => {
    if (!verificationCode) {
      setError("Please enter the verification code");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await enableTwoFactor({ sessionToken, token: verificationCode });
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been enabled for your account.",
      });
      resetSetup();
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to enable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    if (!disablePassword) {
      setError("Please enter your password to disable 2FA");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await disableTwoFactor({ sessionToken, password: disablePassword });
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      });
      setDisablePassword("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "Failed to disable 2FA");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetSetup(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            {twoFactorEnabled
              ? "Two-factor authentication is currently enabled on your account."
              : "Add an extra layer of security to your account."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="py-4">
          {twoFactorEnabled ? (
            // Disable 2FA flow
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-100">
                <div className="p-2 rounded-full bg-green-100">
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-green-800">2FA is Active</p>
                  <p className="text-xs text-green-600">Your account is protected with an authenticator app.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="disablePassword">Password</Label>
                <Input
                  id="disablePassword"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Enter your password to disable 2FA"
                />
                <p className="text-xs text-muted-foreground">
                  For security, you must enter your password to disable two-factor authentication.
                </p>
              </div>

              <Button 
                variant="destructive" 
                onClick={handleDisableTwoFactor}
                disabled={isSubmitting || !disablePassword}
                className="w-full"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                Disable 2FA
              </Button>
            </div>
          ) : (
            // Enable 2FA flow
            <div className="space-y-4">
              {setupStep === "info" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-yellow-50 border border-yellow-100">
                    <div className="p-2 rounded-full bg-yellow-100">
                      <Shield className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-yellow-800">2FA is Not Enabled</p>
                      <p className="text-xs text-yellow-600">Enable 2FA using an authenticator app for added security.</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>Two-factor authentication adds an extra layer of security by requiring:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Something you know (your password)</li>
                      <li>Something you have (your phone with authenticator app)</li>
                    </ul>
                  </div>

                  <Button onClick={handleStartSetup} disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Enable 2FA
                  </Button>
                </div>
              )}

              {setupStep === "setup" && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">Step 1: Scan QR Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Use your authenticator app (Google Authenticator, Authy, etc.) to scan this QR code
                    </p>
                  </div>

                  {qrCode && (
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg border">
                        <Image src={qrCode} alt="2FA QR Code" width={192} height={192} className="w-48 h-48" unoptimized />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Manual Entry Key</Label>
                    <div className="p-2 bg-muted rounded font-mono text-xs break-all">
                      {secret}
                    </div>
                  </div>

                  <Button onClick={() => setSetupStep("verify")} className="w-full">
                    Continue to Verification
                  </Button>
                </div>
              )}

              {setupStep === "verify" && (
                <div className="space-y-4">
                  <div className="text-center space-y-2">
                    <h3 className="font-medium">Step 2: Verify Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter the 6-digit code from your authenticator app
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="verificationCode">Authentication Code</Label>
                    <Input
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center text-lg font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Backup Codes</Label>
                    <p className="text-xs text-muted-foreground">
                      Save these backup codes securely. You can use them if you lose access to your authenticator app.
                    </p>
                    <div className="p-3 bg-muted rounded">
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="bg-background p-2 rounded border">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setSetupStep("setup")} className="flex-1">
                      Back
                    </Button>
                    <Button 
                      onClick={handleEnableTwoFactor}
                      disabled={isSubmitting || verificationCode.length !== 6}
                      className="flex-1"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                      Enable 2FA
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetSetup(); onOpenChange(false); }}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Profile Page ──────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user: sessionUser, sessionToken, logout } = useAuth();
  const { toast } = useToast();
  const [isRefreshing, startRefreshing] = useTransition();

  const profileData = usePlatformQuery(
    api.platform.users.queries.getCurrentPlatformUser,
    { sessionToken },
    !!sessionToken
  ) as any;

  const updateProfile = useMutation(api.platform.users.mutations.updateUserProfile);
  const generateUploadUrl = useMutation(api.platform.users.mutations.generateAvatarUploadUrl);
  const saveAvatar = useMutation(api.platform.users.mutations.saveUserAvatar);

  // Activity log for current user
  const activityLog = usePlatformQuery(
    api.platform.audit.queries.listAuditLogs,
    { sessionToken, limit: 10 },
    !!sessionToken
  ) as any;

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

  // Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);

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
      router.refresh();
    } catch (error: any) {
      console.error("handleSave error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Extract variables for JSX use
  const anySessionUser = sessionUser as any;
  const firstName = isEditing ? (editForm?.firstName ?? "") : (profileData?.firstName ?? anySessionUser?.firstName ?? "");
  const lastName = isEditing ? (editForm?.lastName ?? "") : (profileData?.lastName ?? anySessionUser?.lastName ?? "");
  const email = profileData?.email ?? anySessionUser?.email ?? "";
  const role = profileData?.role ?? anySessionUser?.role ?? "";
  const avatarUrl = profileData?.avatarUrl ?? anySessionUser?.avatarUrl;
  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() ||
    email[0]?.toUpperCase() ||
    "U";
  const createdAt = profileData?.createdAt ? new Date(profileData.createdAt) : null;
  const hasExistingPassword = !!profileData?.passwordHash;
  const twoFactorEnabled = !!profileData?.twoFactorEnabled;

  const profileFields = [
    profileData?.firstName,
    profileData?.lastName,
    profileData?.phone,
    profileData?.bio,
    profileData?.location,
  ];
  const filledCount = profileFields.filter(Boolean).length;
  const completeness = Math.round((filledCount / profileFields.length) * 100);

  // Filter activity logs for current user
  const userActivity = Array.isArray(activityLog)
    ? activityLog.filter((log: any) => log.actorId === sessionUser?._id).slice(0, 10)
    : [];

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sessionToken) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file for your avatar.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Avatar images must be 5MB or smaller.",
        variant: "destructive",
      });
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const uploadUrl = await generateUploadUrl({ sessionToken });

      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      if (!result.ok) {
        const errorText = await result.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Upload failed: ${errorText}`);
      }
      
      const { storageId } = await result.json();
      
      await saveAvatar({ sessionToken, storageId });
      toast({ title: "Photo Updated", description: "Your avatar has been updated." });
      router.refresh();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload photo.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

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
            <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing || isSaving}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary-dark"
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
          <Card className="overflow-hidden">
            {/* Gradient banner */}
            <div className="h-20 bg-gradient-to-br from-primary to-primary-dark" />
            <CardHeader className="text-center -mt-10">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 ring-4 ring-white ring-offset-0">
                    <AvatarImage src={avatarUrl} alt={firstName} />
                    <AvatarFallback className="text-2xl bg-primary text-white">
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
                    <Badge className="bg-[#EDE9FE] text-role-student">
                      {getRoleLabel(role)}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile completeness */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Profile Completeness</span>
                  <span className="text-sm text-muted-foreground">{completeness}%</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{filledCount} of {profileFields.length} fields complete</p>
              </div>
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

              {/* Security quick actions */}
              <div className="pt-4 border-t space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordModal(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  {hasExistingPassword ? "Change Password" : "Set Password"}
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
                      className="bg-muted"
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
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    {hasExistingPassword
                      ? "Your account is secured with a password."
                      : "No password set yet. Set one to enable direct login."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowPasswordModal(true)}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {hasExistingPassword ? "Change Password" : "Set Password"}
                  </Button>
                  {profileData?.lastPasswordChangeAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last changed: {new Date(profileData.lastPasswordChangeAt).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>
                    Add an extra layer of security to your account.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {twoFactorEnabled ? (
                        <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                      ) : (
                        <Badge variant="outline">Disabled</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowTwoFactorModal(true)}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      {twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    View and manage your active login sessions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setShowSessionsModal(true)}
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Active Sessions
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">Danger Zone</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    className="w-full justify-start"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent actions on the platform.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Current session indicator */}
                    <div className="flex items-start space-x-3 p-3 rounded-lg bg-green-50 border border-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Currently Logged In</p>
                        <p className="text-xs text-muted-foreground">
                          Active session as {getRoleLabel(role)}
                        </p>
                      </div>
                    </div>

                    {/* Real activity log entries */}
                    {userActivity.length > 0 ? (
                      userActivity.map((log: any, i: number) => (
                        <div key={log._id || i} className="flex items-start space-x-3 p-3 rounded-lg border">
                          <div className="p-1.5 rounded-full bg-muted">
                            {log.action?.includes("login") || log.action?.includes("logout") ? (
                              <LogOut className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : log.action?.includes("updated") ? (
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{log.action?.replace(/\./g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.entityType} &middot; {new Date(log.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        icon={Clock}
                        title="No recent activity recorded"
                        description="Audit activity for this profile will appear here once account actions are logged."
                        className="py-4"
                      />
                    )}

                    <div className="text-center pt-2">
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

      {/* Modals */}
      {sessionToken && (
        <>
          <ChangePasswordModal
            open={showPasswordModal}
            onOpenChange={setShowPasswordModal}
            sessionToken={sessionToken}
            hasExistingPassword={hasExistingPassword}
            onSuccess={() => router.refresh()}
          />
          <ActiveSessionsModal
            open={showSessionsModal}
            onOpenChange={setShowSessionsModal}
            sessionToken={sessionToken}
          />
          <TwoFactorModal
            open={showTwoFactorModal}
            onOpenChange={setShowTwoFactorModal}
            sessionToken={sessionToken}
            twoFactorEnabled={twoFactorEnabled}
            onSuccess={() => router.refresh()}
          />
        </>
      )}
    </div>
  );
}
