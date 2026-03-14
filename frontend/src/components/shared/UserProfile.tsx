"use client";

import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Camera, 
  Edit, 
  Save, 
  X, 
  Loader2, 
  MapPin, 
  Calendar, 
  Shield,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface UserProfileData {
  _id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: number;
  // Role-specific fields
  admissionNo?: string;
  curriculum?: string;
  status?: string;
  classId?: string;
  dateOfBirth?: string;
  gender?: string;
  guardianIds?: string[];
  organizationName?: string;
  organizationType?: string;
  contactEmail?: string;
  contactPhone?: string;
  sponsorshipTerms?: string;
}

export interface UserProfileProps {
  profile: UserProfileData;
  onUpdate?: (data: Partial<UserProfileData>) => Promise<void>;
  onAvatarUpload?: (file: File) => Promise<void>;
  editable?: boolean;
  showTabs?: boolean;
  variant?: "full" | "compact" | "card";
  className?: string;
}

export function UserProfile({
  profile,
  onUpdate,
  onAvatarUpload,
  editable = true,
  variant = "full",
  className
}: UserProfileProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfileData> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const firstName = isEditing ? (editForm?.firstName ?? "") : (profile.firstName ?? "");
  const lastName = isEditing ? (editForm?.lastName ?? "") : (profile.lastName ?? "");
  const email = profile.email;
  const avatarUrl = isEditing ? editForm?.avatarUrl : profile.avatarUrl;

  const initials = 
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() ||
    email[0]?.toUpperCase() ||
    "U";

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: profile.firstName ?? "",
      lastName: profile.lastName ?? "",
      phone: profile.phone ?? "",
      bio: profile.bio ?? "",
      location: profile.location ?? "",
      avatarUrl: profile.avatarUrl ?? "",
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const handleSave = async () => {
    if (!editForm || !onUpdate) return;
    
    setIsSaving(true);
    try {
      await onUpdate(editForm);
      setIsEditing(false);
      setEditForm(null);
      toast({ 
        title: "Profile Updated", 
        description: "Your profile has been saved successfully." 
      });
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
    if (!file || !onAvatarUpload) return;
    
    setIsUploadingAvatar(true);
    try {
      await onAvatarUpload(file);
      toast({ 
        title: "Photo Updated", 
        description: "Your avatar has been updated." 
      });
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

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      master_admin: "Master Admin",
      super_admin: "Super Admin",
      school_admin: "School Admin",
      principal: "Principal",
      teacher: "Teacher",
      bursar: "Bursar",
      hr_manager: "HR Manager",
      parent: "Parent",
      student: "Student",
      partner: "Partner",
    };
    return roleLabels[role] || role;
  };

  if (variant === "compact") {
    return (
      <div className={cn("flex items-center space-x-3", className)}>
        <Avatar className="h-10 w-10">
          <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {[firstName, lastName].filter(Boolean).join(" ") || email}
          </p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {getRoleLabel(profile.role)}
        </Badge>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">
                {[firstName, lastName].filter(Boolean).join(" ") || email}
              </h3>
              <p className="text-sm text-muted-foreground">{email}</p>
              <Badge variant="outline" className="mt-2">
                {getRoleLabel(profile.role)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <div className={cn("space-y-6", className)}>
      {/* Profile Overview Card */}
      <Card className="overflow-hidden">
        {/* Gradient banner */}
        <div className="h-20 bg-gradient-to-br from-primary to-primary-dark" />
        <CardHeader className="text-center -mt-10">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-white ring-offset-0">
                <AvatarImage src={avatarUrl} alt={`${firstName} ${lastName}`} />
                <AvatarFallback className="text-2xl bg-primary text-white">
                  {isUploadingAvatar ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : (
                    initials
                  )}
                </AvatarFallback>
              </Avatar>
              {isEditing && onAvatarUpload && (
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
                  {getRoleLabel(profile.role)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.location && (
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{profile.location}</span>
            </div>
          )}
          {profile.createdAt && (
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>{getRoleLabel(profile.role)}</span>
          </div>

          {editable && (
            <div className="pt-4 border-t space-y-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    className="w-full bg-primary hover:bg-primary-dark"
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
                <Button onClick={handleEdit} className="w-full">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Information */}
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
                value={isEditing ? (editForm?.firstName ?? "") : (profile.firstName ?? "")}
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
                value={isEditing ? (editForm?.lastName ?? "") : (profile.lastName ?? "")}
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
              value={isEditing ? (editForm?.phone ?? "") : (profile.phone ?? "")}
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
              value={isEditing ? (editForm?.bio ?? "") : (profile.bio ?? "")}
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
              value={isEditing ? (editForm?.location ?? "") : (profile.location ?? "")}
              onChange={(e) =>
                setEditForm((f) => (f ? { ...f, location: e.target.value } : f))
              }
              disabled={!isEditing}
              placeholder="Nairobi, Kenya"
            />
          </div>
        </CardContent>
      </Card>

      {/* Role-specific information */}
      {profile.role === "student" && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Admission Number</Label>
                <p className="font-medium">{profile.admissionNo || "Not assigned"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Curriculum</Label>
                <p className="font-medium">{profile.curriculum || "Not assigned"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Class</Label>
                <p className="font-medium">{profile.classId || "Not assigned"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Badge variant={profile.status === "active" ? "default" : "secondary"}>
                  {profile.status?.toUpperCase() || "UNKNOWN"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {profile.role === "partner" && (
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={isEditing ? (editForm?.organizationName ?? "") : (profile.organizationName ?? "")}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, organizationName: e.target.value } : f))
                }
                disabled={!isEditing}
                placeholder="e.g. Acme Foundation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgType">Organization Type</Label>
              <Input
                id="orgType"
                value={isEditing ? (editForm?.organizationType ?? "") : (profile.organizationType ?? "")}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, organizationType: e.target.value } : f))
                }
                disabled={!isEditing}
                placeholder="e.g. NGO, corporate, individual"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={isEditing ? (editForm?.contactEmail ?? "") : (profile.contactEmail ?? "")}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, contactEmail: e.target.value } : f))
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={isEditing ? (editForm?.contactPhone ?? "") : (profile.contactPhone ?? "")}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, contactPhone: e.target.value } : f))
                }
                disabled={!isEditing}
                placeholder="+254..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sponsorshipTerms">Sponsorship Terms</Label>
              <Textarea
                id="sponsorshipTerms"
                value={isEditing ? (editForm?.sponsorshipTerms ?? "") : (profile.sponsorshipTerms ?? "")}
                onChange={(e) =>
                  setEditForm((f) => (f ? { ...f, sponsorshipTerms: e.target.value } : f))
                }
                disabled={!isEditing}
                rows={3}
                placeholder="Optional notes about sponsorship terms"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
