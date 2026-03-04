"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Briefcase, Mail, Phone, Linkedin, GraduationCap, Pencil, Save, X } from "lucide-react";

export default function AlumniProfilePage() {
    const profile = useQuery(api.modules.portal.alumni.queries.getAlumniProfile);
    const updateProfile = useMutation(api.modules.portal.alumni.mutations.updateAlumniProfile);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        currentEmployer: "",
        jobTitle: "",
        linkedIn: "",
        bio: "",
        contactEmail: "",
        contactPhone: "",
    });

    const startEditing = () => {
        if (profile) {
            setFormData({
                currentEmployer: profile.currentEmployer ?? "",
                jobTitle: profile.jobTitle ?? "",
                linkedIn: profile.linkedIn ?? "",
                bio: profile.bio ?? "",
                contactEmail: profile.contactEmail ?? "",
                contactPhone: profile.contactPhone ?? "",
            });
        }
        setIsEditing(true);
        setError("");
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError("");
        try {
            await updateProfile({
                currentEmployer: formData.currentEmployer || undefined,
                jobTitle: formData.jobTitle || undefined,
                linkedIn: formData.linkedIn || undefined,
                bio: formData.bio || undefined,
                contactEmail: formData.contactEmail || undefined,
                contactPhone: formData.contactPhone || undefined,
            });
            setIsEditing(false);
        } catch (err: any) {
            setError(err.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    if (profile === undefined) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        );
    }

    if (profile === null) {
        return (
            <div className="space-y-6">
                <PageHeader title="Profile Not Found" description="Your alumni profile has not been set up yet." />
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <User className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Please contact your school administration to set up your alumni profile.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Profile"
                description="Manage your alumni profile and contact information."
                actions={
                    !isEditing ? (
                        <Button onClick={startEditing}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Profile
                        </Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button onClick={handleSave} disabled={isSaving}>
                                <Save className="mr-2 h-4 w-4" />
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                            <Button variant="outline" onClick={() => setIsEditing(false)}>
                                <X className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    )
                }
            />

            {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <span className="text-2xl font-bold text-primary">
                                {(profile.firstName?.[0] ?? "").toUpperCase()}
                                {(profile.lastName?.[0] ?? "").toUpperCase()}
                            </span>
                        </div>
                        <CardTitle>{profile.firstName} {profile.lastName}</CardTitle>
                        <CardDescription>
                            <Badge variant="outline" className="mt-1">
                                <GraduationCap className="mr-1 h-3 w-3" />
                                Class of {profile.graduationYear}
                            </Badge>
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {profile.program && (
                            <div className="flex items-center gap-2 text-sm">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span>{profile.program}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{profile.contactEmail}</span>
                        </div>
                        {profile.contactPhone && (
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{profile.contactPhone}</span>
                            </div>
                        )}
                        {profile.linkedIn && (
                            <div className="flex items-center gap-2 text-sm">
                                <Linkedin className="h-4 w-4 text-muted-foreground" />
                                <a href={profile.linkedIn} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    LinkedIn
                                </a>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Profile Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isEditing ? (
                            <>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="jobTitle">Job Title</Label>
                                        <Input
                                            id="jobTitle"
                                            value={formData.jobTitle}
                                            onChange={(e) => setFormData(p => ({ ...p, jobTitle: e.target.value }))}
                                            placeholder="e.g., Software Engineer"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="employer">Current Employer</Label>
                                        <Input
                                            id="employer"
                                            value={formData.currentEmployer}
                                            onChange={(e) => setFormData(p => ({ ...p, currentEmployer: e.target.value }))}
                                            placeholder="e.g., Safaricom PLC"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="linkedIn">LinkedIn URL</Label>
                                    <Input
                                        id="linkedIn"
                                        value={formData.linkedIn}
                                        onChange={(e) => setFormData(p => ({ ...p, linkedIn: e.target.value }))}
                                        placeholder="https://linkedin.com/in/..."
                                    />
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contactEmail">Contact Email</Label>
                                        <Input
                                            id="contactEmail"
                                            type="email"
                                            value={formData.contactEmail}
                                            onChange={(e) => setFormData(p => ({ ...p, contactEmail: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contactPhone">Phone Number</Label>
                                        <Input
                                            id="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={(e) => setFormData(p => ({ ...p, contactPhone: e.target.value }))}
                                            placeholder="+254..."
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                                        placeholder="Tell us about yourself..."
                                        rows={4}
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Career</h3>
                                    {profile.jobTitle || profile.currentEmployer ? (
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {profile.jobTitle}
                                                {profile.jobTitle && profile.currentEmployer && " at "}
                                                {profile.currentEmployer}
                                            </span>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">Not specified</p>
                                    )}
                                </div>

                                <Separator />

                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                                    <p className="text-sm whitespace-pre-wrap">
                                        {profile.bio || <span className="text-muted-foreground italic">No bio added yet.</span>}
                                    </p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
