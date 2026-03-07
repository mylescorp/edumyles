"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { getRoleLabel } from "@/lib/routes";
import { Calendar, Shield, Lock, Bell, AlertCircle, CheckCircle2, X, Edit, Save } from "lucide-react";

type ProfileState = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  location?: string;
  timezone: string;
  language: string;
  createdAt: number;
  preferences: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    twoFactorAuth: boolean;
    marketingEmails: boolean;
    weeklyDigest: boolean;
  };
};

const DEFAULT_PREFS: ProfileState["preferences"] = {
  emailNotifications: true,
  pushNotifications: true,
  twoFactorAuth: false,
  marketingEmails: false,
  weeklyDigest: true,
};

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const { hasRole } = usePermissions();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);

  const platformAdmins = useQuery(
    api.platform.users.queries.listPlatformAdmins,
    hasRole("master_admin", "super_admin") ? {} : "skip"
  ) as any[] | undefined;

  const liveProfile = useMemo<ProfileState | null>(() => {
    if (!user) return null;
    const dbMatch = (platformAdmins ?? []).find((p) => p.email === user.email);

    return {
      firstName: dbMatch?.firstName ?? user.firstName ?? "",
      lastName: dbMatch?.lastName ?? user.lastName ?? "",
      email: user.email,
      role: String(dbMatch?.role ?? user.role ?? ""),
      avatarUrl: dbMatch?.avatarUrl ?? user.avatarUrl,
      phone: dbMatch?.phone,
      bio: "",
      location: "",
      timezone: "Africa/Nairobi",
      language: "English",
      createdAt: Number(dbMatch?.createdAt ?? Date.now()),
      preferences: prefs,
    };
  }, [user, platformAdmins, prefs]);

  const [draft, setDraft] = useState<ProfileState | null>(null);

  const profile = isEditing ? draft ?? liveProfile : liveProfile;

  if (isLoading || !profile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="text-muted-foreground">Loading profile...</span>
      </div>
    );
  }

  const initials = `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase() || "U";

  const beginEdit = () => {
    setDraft({ ...profile });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setIsEditing(false);
  };

  const saveEdit = () => {
    if (draft) {
      setPrefs(draft.preferences);
    }
    setIsEditing(false);
    setDraft(null);
    toast({
      title: "Draft saved locally",
      description: "Profile edit API is not implemented yet; changes are local-only for this session.",
    });
  };

  const setField = <K extends keyof ProfileState>(key: K, value: ProfileState[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [key]: value });
  };

  const setPref = (key: keyof ProfileState["preferences"], value: boolean) => {
    if (isEditing && draft) {
      setDraft({ ...draft, preferences: { ...draft.preferences, [key]: value } });
    } else {
      setPrefs((prev) => ({ ...prev, [key]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Management"
        description="Manage your account information and preferences"
        breadcrumbs={[
          { label: "Dashboard", href: "/platform" },
          { label: "Profile", href: "/platform/profile" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button className="bg-[#056C40] hover:bg-[#023c24]" onClick={saveEdit}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
              </>
            ) : (
              <Button onClick={beginEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl} alt={profile.firstName} />
                <AvatarFallback className="bg-[#056C40] text-2xl text-white">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{profile.firstName} {profile.lastName}</h2>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <Badge className="mt-2 bg-purple-100 text-purple-800">{getRoleLabel(profile.role)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span>Role: {getRoleLabel(profile.role)}</span>
            </div>
            <div className="pt-3">
              <Button variant="outline" className="w-full justify-start" onClick={logout}>
                <X className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="personal" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="personal">
              <Card>
                <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setField("firstName", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setField("lastName", e.target.value)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={profile.email} disabled className="bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={profile.phone ?? ""}
                      onChange={(e) => setField("phone", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    <Textarea
                      rows={4}
                      value={profile.bio ?? ""}
                      onChange={(e) => setField("bio", e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardHeader><CardTitle>Notification Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  {[
                    ["emailNotifications", "Email Notifications"],
                    ["pushNotifications", "Push Notifications"],
                    ["twoFactorAuth", "Two-Factor Authentication"],
                    ["marketingEmails", "Marketing Emails"],
                    ["weeklyDigest", "Weekly Digest"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={profile.preferences[key as keyof ProfileState["preferences"]]}
                        onCheckedChange={(checked) => setPref(key as keyof ProfileState["preferences"], checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader><CardTitle>Security</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Security and session APIs are pending implementation.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">Session Active</p>
                      <p className="text-sm text-muted-foreground">You are currently signed in as {profile.email}.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                    <Bell className="mt-0.5 h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Role Permissions Applied</p>
                      <p className="text-sm text-muted-foreground">Access level: {getRoleLabel(profile.role)}.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                    <div>
                      <p className="font-medium">Pending API Work</p>
                      <p className="text-sm text-muted-foreground">Profile persistence endpoint has not been implemented.</p>
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
