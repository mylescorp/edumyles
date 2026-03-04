"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RequestTranscriptPage() {
    const router = useRouter();
    const requestTranscript = useMutation(api.modules.portal.alumni.mutations.requestTranscript);

    const [type, setType] = useState<"official" | "unofficial">("official");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError("");

        try {
            await requestTranscript({
                type,
                notes: notes || undefined,
            });
            router.push("/portal/alumni/transcripts");
        } catch (err: any) {
            setError(err.message || "Failed to submit request");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Request Transcript"
                description="Submit a request for an official or unofficial transcript."
                actions={
                    <Link href="/portal/alumni/transcripts">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Transcripts
                        </Button>
                    </Link>
                }
            />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Transcript Request Form
                    </CardTitle>
                    <CardDescription>
                        Official transcripts are sealed and can be sent to institutions.
                        Unofficial transcripts are for personal use.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="type">Transcript Type</Label>
                            <Select value={type} onValueChange={(v) => setType(v as "official" | "unofficial")}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="official">Official Transcript</SelectItem>
                                    <SelectItem value="unofficial">Unofficial Transcript</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Additional Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="e.g., Send to University of Nairobi, Admissions Office..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {error && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? "Submitting..." : "Submit Request"}
                            </Button>
                            <Link href="/portal/alumni/transcripts">
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
