"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Mail, Phone, MapPin, Calendar, Fingerprint } from "lucide-react";

export default function StudentProfile() {
    const profile = useQuery(api.modules.portal.student.queries.getMyProfile);

    if (!profile) {
        return (
            <div className="flex h-64 items-center justify-center text-muted-foreground italic">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Profile"
                description="View and manage your personal information."
            />

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 text-center">
                        <div className="flex flex-col items-center">
                            <Avatar className="h-32 w-32 border-4 border-primary/10">
                                <AvatarImage src={profile.photo} />
                                <AvatarFallback className="text-3xl bg-primary/5">
                                    {profile.firstName[0]}{profile.lastName[0]}
                                </AvatarFallback>
                            </Avatar>
                            <h2 className="mt-4 text-2xl font-bold">{profile.firstName} {profile.lastName}</h2>
                            <p className="text-muted-foreground">Admission No: {profile.admissionNo}</p>
                            <div className="mt-4 flex gap-2">
                                <Badge variant="outline" className="bg-primary/5">
                                    {profile.curriculum}
                                </Badge>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                    {profile.status.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <div className="mt-8 space-y-4 text-left">
                            <div className="flex items-center gap-3 text-sm">
                                <Fingerprint className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">ID: {profile._id}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="text-muted-foreground">Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            Academic & Personal Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">First Name</Label>
                                <p className="font-medium">{profile.firstName}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Last Name</Label>
                                <p className="font-medium">{profile.lastName}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Gender</Label>
                                <p className="font-medium capitalize">{profile.gender}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                                <p className="font-medium">{profile.dateOfBirth}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Class ID</Label>
                                <p className="font-medium">{profile.classId || "Not assigned"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">Curriculum Code</Label>
                                <p className="font-medium">{profile.curriculum}</p>
                            </div>
                        </div>

                        <div className="pt-6 border-t">
                            <h3 className="font-semibold mb-4">Guardians</h3>
                            <div className="space-y-3">
                                {profile.guardianIds.length > 0 ? (
                                    profile.guardianIds.map((gid) => (
                                        <div key={gid} className="flex items-center justify-between p-3 rounded bg-muted/30">
                                            <span className="text-sm">Guardian ID: {gid}</span>
                                            <Badge variant="secondary" className="text-[10px]">Linked</Badge>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No guardians linked.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
