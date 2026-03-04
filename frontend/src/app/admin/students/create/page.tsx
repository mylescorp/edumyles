"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { ArrowLeft, Upload, User, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

// Form validation schema
const validateStudentForm = (form: any) => {
  const errors: string[] = [];
  
  if (!form.firstName?.trim()) errors.push("First name is required");
  if (!form.lastName?.trim()) errors.push("Last name is required");
  if (!form.dateOfBirth) errors.push("Date of birth is required");
  else {
    const dob = new Date(form.dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();
    if (age < 4 || age > 25) errors.push("Student age should be between 4 and 25 years");
  }
  
  if (form.guardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guardianEmail)) {
    errors.push("Invalid guardian email format");
  }
  
  if (form.guardianPhone && !/^\+?[1-9]\d{1,14}$/.test(form.guardianPhone.replace(/\s/g, ""))) {
    errors.push("Invalid phone number format");
  }
  
  return errors;
};

// Generate admission number
const generateAdmissionNumber = (classId?: string) => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const classCode = classId ? classId.slice(-2).toUpperCase() : 'ST';
  return `${year}/${classCode}/${random}`;
};

export default function CreateStudentPage() {
    const { isLoading, sessionToken } = useAuth();
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const classes = useQuery(
        api.modules.sis.queries.listClasses,
        sessionToken ? {} : "skip"
    );

    const createStudent = useMutation(api.modules.sis.mutations.createStudent);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        gender: "male",
        classId: "",
        admissionNumber: "",
        guardianName: "",
        guardianEmail: "",
        guardianPhone: "",
        guardianRelationship: "guardian",
    });

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        
        // Auto-generate admission number when class is selected and admission number is empty
        if (field === 'classId' && value && !form.admissionNumber) {
            setForm((prev) => ({ 
                ...prev, 
                [field]: value,
                admissionNumber: generateAdmissionNumber(value)
            }));
        }
    };

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    title: "Error",
                    description: "Photo size should be less than 5MB",
                    variant: "destructive"
                });
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                toast({
                    title: "Error", 
                    description: "Please upload an image file",
                    variant: "destructive"
                });
                return;
            }
            
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setPhotoPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate form
            const validationErrors = validateStudentForm(form);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors.join(', '));
            }

            // Generate admission number if not provided
            const admissionNumber = form.admissionNumber || generateAdmissionNumber(form.classId);

            const studentData = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                dateOfBirth: form.dateOfBirth,
                gender: form.gender,
                classId: form.classId || undefined,
                admissionNumber,
                guardianName: form.guardianName?.trim() || undefined,
                guardianEmail: form.guardianEmail?.trim() || undefined,
                guardianPhone: form.guardianPhone?.trim() || undefined,
                guardianRelationship: form.guardianRelationship || undefined,
                photoUrl: photoPreview || undefined,
            };

            await createStudent(studentData);
            
            toast({
                title: "Success",
                description: "Student enrolled successfully!",
            });

            router.push("/admin/students");
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create student";
            setError(errorMessage);
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/students" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Students
                </Link>
            </div>

            <PageHeader
                title="Enroll New Student"
                description="Add a new student to the school"
            />

            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                {error && (
                    <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                        {error}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Student Photo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                {photoPreview ? (
                                    <img 
                                        src={photoPreview} 
                                        alt="Student photo" 
                                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border">
                                        <User className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                </Button>
                                <p className="text-xs text-muted-foreground mt-1">
                                    JPG, PNG up to 5MB
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Student Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input
                                id="firstName"
                                value={form.firstName}
                                onChange={(e) => updateField("firstName", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input
                                id="lastName"
                                value={form.lastName}
                                onChange={(e) => updateField("lastName", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                            <Input
                                id="dateOfBirth"
                                type="date"
                                value={form.dateOfBirth}
                                onChange={(e) => updateField("dateOfBirth", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gender">Gender *</Label>
                            <Select value={form.gender} onValueChange={(v) => updateField("gender", v)}>
                                <SelectTrigger id="gender">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="classId">Class</Label>
                            <Select value={form.classId} onValueChange={(v) => updateField("classId", v)}>
                                <SelectTrigger id="classId">
                                    <SelectValue placeholder="Select a class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes?.map((c) => (
                                        <SelectItem key={c._id} value={c._id}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="admissionNumber">Admission Number (auto-generated if empty)</Label>
                            <Input
                                id="admissionNumber"
                                value={form.admissionNumber}
                                onChange={(e) => updateField("admissionNumber", e.target.value)}
                                placeholder="Leave blank to auto-generate"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Guardian Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="guardianName">Guardian Name</Label>
                            <Input
                                id="guardianName"
                                value={form.guardianName}
                                onChange={(e) => updateField("guardianName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianRelationship">Relationship</Label>
                            <Select
                                value={form.guardianRelationship}
                                onValueChange={(v) => updateField("guardianRelationship", v)}
                            >
                                <SelectTrigger id="guardianRelationship">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="father">Father</SelectItem>
                                    <SelectItem value="mother">Mother</SelectItem>
                                    <SelectItem value="guardian">Guardian</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianEmail">Guardian Email</Label>
                            <Input
                                id="guardianEmail"
                                type="email"
                                value={form.guardianEmail}
                                onChange={(e) => updateField("guardianEmail", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="guardianPhone">Guardian Phone</Label>
                            <Input
                                id="guardianPhone"
                                type="tel"
                                value={form.guardianPhone}
                                onChange={(e) => updateField("guardianPhone", e.target.value)}
                                placeholder="+254..."
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Link href="/admin/students">
                        <Button type="button" variant="outline">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? "Enrolling..." : "Enroll Student"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
