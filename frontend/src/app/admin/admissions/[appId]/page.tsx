"use client";

import { useRef, useCallback } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, UserCircle, Mail, Phone, Calendar, GraduationCap, Upload, FileText, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "@/components/ui/use-toast";

const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    draft: "outline",
    submitted: "default",
    under_review: "secondary",
    accepted: "default",
    rejected: "destructive",
    waitlisted: "outline",
    enrolled: "secondary",
};

const VALID_TRANSITIONS: Record<string, { label: string; status: string; variant?: "default" | "destructive" | "outline" }[]> = {
    draft: [{ label: "Submit", status: "submitted" }],
    submitted: [
        { label: "Start Review", status: "under_review" },
        { label: "Reject", status: "rejected", variant: "destructive" },
    ],
    under_review: [
        { label: "Accept", status: "accepted" },
        { label: "Waitlist", status: "waitlisted", variant: "outline" },
        { label: "Reject", status: "rejected", variant: "destructive" },
    ],
    accepted: [
        { label: "Enroll Student", status: "enrolled" },
        { label: "Reject", status: "rejected", variant: "destructive" },
    ],
    waitlisted: [
        { label: "Accept", status: "accepted" },
        { label: "Reject", status: "rejected", variant: "destructive" },
    ],
};

export default function ApplicationDetailPage() {
    const { appId } = useParams<{ appId: string }>();
    const { isLoading, sessionToken } = useAuth();
    const router = useRouter();
    const [pendingAction, setPendingAction] = useState<{ label: string; status: string } | null>(null);

    const application = useQuery(
        api.modules.admissions.queries.getApplication,
        sessionToken && appId ? { applicationId: appId as Id<"admissionApplications"> } : "skip"
    );

    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateStatus = useMutation(api.modules.admissions.mutations.updateApplicationStatus);
    const enrollFromApplication = useMutation(api.modules.admissions.mutations.enrollFromApplication);
    const generateUploadUrl = useMutation(api.modules.admissions.mutations.generateDocumentUploadUrl);
    const attachDocument = useMutation(api.modules.admissions.mutations.attachDocumentToApplication);
    const removeDocument = useMutation(api.modules.admissions.mutations.removeApplicationDocument);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !appId) return;
        setUploading(true);
        try {
            const uploadUrl: string = await generateUploadUrl({});
            const res = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": file.type }, body: file });
            if (!res.ok) throw new Error("Upload failed");
            const { storageId } = await res.json();
            await attachDocument({
                applicationId: appId as Id<"admissionApplications">,
                storageId,
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size,
            });
            toast({ title: "Document uploaded", description: file.name });
        } catch (err) {
            toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }, [appId, generateUploadUrl, attachDocument]);

    if (isLoading || application === undefined) return <LoadingSkeleton variant="page" />;

    if (!application) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground">Application not found.</p>
                <Link href="/admin/admissions">
                    <Button variant="outline" className="mt-4">Back to Admissions</Button>
                </Link>
            </div>
        );
    }

    const handleAction = async () => {
        if (!pendingAction) return;

        if (pendingAction.status === "enrolled") {
            await enrollFromApplication({
                applicationId: appId as Id<"admissionApplications">,
                admissionNo: application.data?.applicationId,
                classId: application.data?.requestedGrade, // Using requested grade as classId hint
            });
        } else {
            await updateStatus({
                applicationId: appId as Id<"admissionApplications">,
                status: pendingAction.status,
            });
        }
        setPendingAction(null);
    };

    const transitions = VALID_TRANSITIONS[application.data?.status] ?? [];

    return (
        <div>
            <div className="mb-4">
                <Link href="/admin/admissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" /> Back to Admissions
                </Link>
            </div>

            <PageHeader
                title={`${application.data?.firstName} ${application.data?.lastName}`}
                description={`Application ID: ${application.data?.applicationId}`}
                actions={
                    <div className="flex items-center gap-2">
                        <Badge variant={statusColors[application.data?.status] ?? "outline"} className="text-sm px-3 py-1">
                            {application.data?.status.replace("_", " ")}
                        </Badge>
                    </div>
                }
            />

            {/* Action buttons */}
            {transitions.length > 0 && (
                <div className="mt-4 flex gap-2">
                    {transitions.map((t) => (
                        <Button
                            key={t.status}
                            variant={t.variant ?? "default"}
                            onClick={() => setPendingAction(t)}
                        >
                            {t.status === "enrolled" && <GraduationCap className="mr-2 h-4 w-4" />}
                            {t.label}
                        </Button>
                    ))}
                </div>
            )}

            <div className="mt-6 grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Applicant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={UserCircle} label="Full Name" value={`${application.data?.firstName} ${application.data?.lastName}`} />
                        <InfoRow icon={Calendar} label="Date of Birth" value={application.data?.dateOfBirth} />
                        <InfoRow icon={UserCircle} label="Gender" value={application.data?.gender} />
                        <InfoRow icon={GraduationCap} label="Requested Grade" value={application.data?.requestedGrade} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Guardian Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={UserCircle} label="Guardian Name" value={application.data?.guardianName} />
                        <InfoRow icon={Mail} label="Guardian Email" value={application.data?.guardianEmail} />
                        <InfoRow icon={Phone} label="Guardian Phone" value={application.data?.guardianPhone} />
                    </CardContent>
                </Card>

                {application.data?.notes && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-base">Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{application.data?.notes}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Documents */}
                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-base">Supporting Documents</CardTitle>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={handleFileUpload}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                disabled={uploading}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="mr-2 h-4 w-4" />
                                {uploading ? "Uploading..." : "Upload Document"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {!(application as any).documents?.length ? (
                            <p className="text-sm text-muted-foreground">No documents uploaded yet. Upload birth certificates, academic records, or other supporting materials.</p>
                        ) : (
                            <div className="space-y-2">
                                {((application as any).documents ?? []).map((doc: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">{doc.fileName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {(doc.fileSize / 1024).toFixed(0)} KB · {new Date(doc.uploadedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => removeDocument({ applicationId: appId as Id<"admissionApplications">, storageId: doc.storageId })}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Created</span>
                            <span>{new Date(application.data?.createdAt).toLocaleString()}</span>
                        </div>
                        {application.data?.submittedAt && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Submitted</span>
                                <span>{new Date(application.data?.submittedAt).toLocaleString()}</span>
                            </div>
                        )}
                        {application.data?.reviewedAt && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Reviewed</span>
                                <span>{new Date(application.data?.reviewedAt).toLocaleString()}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <ConfirmDialog
                open={!!pendingAction}
                onOpenChange={(open) => !open && setPendingAction(null)}
                title={`${pendingAction?.label} Application`}
                description={`Are you sure you want to ${pendingAction?.label?.toLowerCase()} this application for ${application.data?.firstName} ${application.data?.lastName}?`}
                onConfirm={handleAction}
                confirmLabel={pendingAction?.label ?? "Confirm"}
                variant={pendingAction?.status === "rejected" ? "destructive" : "default"}
            />
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
