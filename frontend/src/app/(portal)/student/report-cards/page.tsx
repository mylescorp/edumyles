"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileText, Calendar } from "lucide-react";

export default function StudentReportCards() {
    const reports = useQuery(api.modules.portal.student.queries.getMyReportCards);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Academic Report Cards"
                description="Download your official termly and yearly academic reports."
            />

            <div className="grid gap-4">
                {reports && reports.length > 0 ? (
                    reports.map((report) => (
                        <Card key={report._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center justify-between p-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">{report.term} Report Card</h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            Published: {new Date(report.publishedAt || report.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <Button variant="outline" className="gap-2">
                                    <FileDown className="h-4 w-4" />
                                    Download PDF
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : reports ? (
                    <Card>
                        <CardContent className="flex h-64 flex-col items-center justify-center text-muted-foreground gap-4">
                            <FileText className="h-12 w-12 opacity-20" />
                            <p className="italic">No published report cards found yet.</p>
                            <p className="text-xs max-w-xs text-center">
                                Report cards are typically published at the end of each academic term by the school administration.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex h-32 items-center justify-center text-muted-foreground italic">
                        Loading report cards...
                    </div>
                )}
            </div>
        </div>
    );
}
