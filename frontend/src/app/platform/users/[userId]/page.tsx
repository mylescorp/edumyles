"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Edit,
  Mail,
  Phone,
  Calendar,
  Shield,
  MapPin,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  Key,
  Lock,
  Unlock,
  Activity,
  Settings,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Smartphone,
  MailOpen,
  Bell,
  FileText,
  Users,
  History,
  X
} from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface UserDetail {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  status?: string;
  tenantId?: string;
  location?: string;
  department?: string;
  createdAt: number;
  createdBy?: string;
  lastLogin?: number;
  emailVerified?: boolean;
  permissions: string[];
  twoFactorEnabled: boolean;
  loginHistory: LoginRecord[];
  sessions: ActiveSession[];
  securitySettings: SecuritySettings;
  activityLogs: ActivityLog[];
}

interface LoginRecord {
  _id: string;
  timestamp: number;
  ipAddress: string;
  userAgent: string;
  location: string;
  success: boolean;
  failureReason?: string;
}

interface ActiveSession {
  _id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActivity: number;
  createdAt: number;
}

interface SecuritySettings {
  passwordChangedAt: number;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  backupCodes: string[];
  trustedDevices: TrustedDevice[];
  loginNotifications: boolean;
}

interface TrustedDevice {
  _id: string;
  deviceName: string;
  deviceType: string;
  lastUsed: number;
  addedAt: number;
}

interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  timestamp: number;
}

function normalizeUserDetail(input: Partial<UserDetail>): UserDetail {
  return {
    _id: input._id ?? "",
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    email: input.email ?? "",
    phone: input.phone,
    role: input.role ?? "viewer",
    isActive: input.isActive ?? false,
    status: input.status ?? "inactive",
    tenantId: input.tenantId,
    location: input.location,
    department: input.department,
    createdAt: input.createdAt ?? Date.now(),
    createdBy: input.createdBy,
    lastLogin: input.lastLogin,
    emailVerified: input.emailVerified,
    permissions: input.permissions ?? [],
    twoFactorEnabled: input.twoFactorEnabled ?? false,
    loginHistory: input.loginHistory ?? [],
    sessions: input.sessions ?? [],
    securitySettings: {
      passwordChangedAt: input.securitySettings?.passwordChangedAt ?? Date.now(),
      twoFactorEnabled: input.securitySettings?.twoFactorEnabled ?? false,
      twoFactorSecret: input.securitySettings?.twoFactorSecret,
      backupCodes: input.securitySettings?.backupCodes ?? [],
      trustedDevices: input.securitySettings?.trustedDevices ?? [],
      loginNotifications: input.securitySettings?.loginNotifications ?? false,
    },
    activityLogs: input.activityLogs ?? [],
  };
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { sessionToken } = useAuth();

  const userData = usePlatformQuery(
    api.platform.users.queries.getUserById,
    { sessionToken: sessionToken || "", userId },
    !!sessionToken
  );

  const updateProfile = useMutation(api.platform.users.mutations.updateUserProfile);
  const deactivateUser = useMutation(api.platform.users.mutations.deactivatePlatformAdmin);

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLocation, setEditLocation] = useState("");

  useEffect(() => {
    if (!userData) return;
    const normalizedUser = normalizeUserDetail(userData as Partial<UserDetail>);
    setUser(normalizedUser);
    setEditFirstName(normalizedUser.firstName);
    setEditLastName(normalizedUser.lastName);
    setEditPhone(normalizedUser.phone ?? "");
    setEditLocation(normalizedUser.location ?? "");
  }, [userData]);

  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-blue-100 text-blue-800";
      case "manager": return "bg-green-100 text-green-800";
      case "agent": return "bg-yellow-100 text-yellow-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-KE');
  };

  const handleUpdateUser = async () => {
    if (!sessionToken) return;
    setIsSaving(true);
    try {
      await updateProfile({
        sessionToken,
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        phone: editPhone || undefined,
        location: editLocation || undefined,
      });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = () => {
    // Reset password logic here
    setIsPasswordDialogOpen(false);
  };

  const handleToggle2FA = () => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return {
        ...currentUser,
        twoFactorEnabled: !currentUser.twoFactorEnabled,
        securitySettings: {
          ...currentUser.securitySettings,
          twoFactorEnabled: !currentUser.twoFactorEnabled
        }
      };
    });
    setIs2FADialogOpen(false);
  };

  const handleRevokeSession = (sessionId: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return {
        ...currentUser,
        sessions: currentUser.sessions.filter(session => session._id !== sessionId)
      };
    });
  };

  const handleRemoveTrustedDevice = (deviceId: string) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;
      return {
        ...currentUser,
        securitySettings: {
          ...currentUser.securitySettings,
          trustedDevices: currentUser.securitySettings.trustedDevices.filter(device => device._id !== deviceId)
        }
      };
    });
  };

  if (!user) return <div className="p-6 text-center text-muted-foreground">Loading user details...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${user.firstName} ${user.lastName}`} 
        description="User profile and security management"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: `${user.firstName} ${user.lastName}`, href: `/platform/users/${userId}` }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* User Profile */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <CardTitle className="text-xl">{user.firstName} {user.lastName}</CardTitle>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace("_", " ")}
                      </Badge>
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status ?? "inactive")}`}>
                        <span>{(user.status ?? "inactive").charAt(0).toUpperCase() + (user.status ?? "inactive").slice(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Profile
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Phone</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{user.phone || "Not provided"}</span>
                  </div>
                </div>
                <div>
                  <Label>Department</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{user.department || "Not assigned"}</span>
                  </div>
                </div>
                <div>
                  <Label>Location</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.location || "Not specified"}</span>
                  </div>
                </div>
                <div>
                  <Label>Member Since</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(user.createdAt)}</span>
                  </div>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{user.lastLogin ? formatDateTime(user.lastLogin) : "Never"}</span>
                  </div>
                </div>
                <div>
                  <Label>Created By</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{user.createdBy}</span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {user.permissions.map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">Email Verification</div>
                      <div className="text-sm text-muted-foreground">
                        {user.emailVerified ? "Verified" : "Not verified"}
                      </div>
                    </div>
                  </div>
                  {user.emailVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">
                        {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIs2FADialogOpen(true)}
                  >
                    {user.twoFactorEnabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Password Management</Label>
                  <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)}>
                    <Key className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Login Notifications</Label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={user.securitySettings.loginNotifications}
                      onChange={(e) => setUser({
                        ...user,
                        securitySettings: {
                          ...user.securitySettings,
                          loginNotifications: e.target.checked
                        }
                      })}
                      className="rounded"
                    />
                    <span className="text-sm text-muted-foreground">
                      {user.securitySettings.loginNotifications ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {user.sessions.map((session) => (
                <div key={session._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{session.device}</div>
                      <div className="text-sm text-muted-foreground">
                        {session.location} • {session.ipAddress}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last active: {formatDateTime(session.lastActivity)}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRevokeSession(session._id)}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    Revoke
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Bell className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Export Profile
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <History className="h-4 w-4 mr-2" />
                View History
              </Button>
              {user.isActive !== false && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={async () => {
                    if (!sessionToken) return;
                    try { await deactivateUser({ sessionToken, userId: userId as any }); }
                    catch (err) { console.error(err); }
                  }}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Deactivate User
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Logins
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.loginHistory.slice(0, 5).map((login) => (
                <div key={login._id} className="flex items-center gap-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${login.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div className="flex-1">
                    <div className="font-medium">{login.location}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(login.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trusted Devices */}
          <Card>
            <CardHeader>
              <CardTitle>Trusted Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {user.securitySettings.trustedDevices.map((device) => (
                <div key={device._id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <Smartphone className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{device.deviceName}</div>
                      <div className="text-xs text-muted-foreground">{device.deviceType}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleRemoveTrustedDevice(device._id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" defaultValue={user.department} disabled />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser} disabled={isSaving}>
                <Edit className="h-4 w-4 mr-1" />
                {isSaving ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Send a password reset link to {user.email}
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPassword}>
                <Mail className="h-4 w-4 mr-1" />
                Send Reset Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog open={is2FADialogOpen} onOpenChange={setIs2FADialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {user.twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              {user.twoFactorEnabled 
                ? "Disabling 2FA will make your account less secure. Are you sure?"
                : "Enable two-factor authentication to add an extra layer of security to your account."
              }
            </p>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIs2FADialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleToggle2FA}>
                {user.twoFactorEnabled ? (
                  <>
                    <Unlock className="h-4 w-4 mr-1" />
                    Disable 2FA
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-1" />
                    Enable 2FA
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
