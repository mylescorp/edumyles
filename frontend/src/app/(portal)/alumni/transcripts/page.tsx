"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Plus } from "lucide-react";
import Link from "next/link";

export default function TranscriptsPage() {
    const transcripts = useQuery(api.modules.portal.alumni.queries.getTranscripts);

    const grades = transcripts?.grades ?? [];
    const reportCards = transcripts?.reportCards ?? [];
    const requests = transcripts?.requests ?? [];

    // Group grades by academic year and term
    const gradesByYear = grades.reduce((acc: Record<string, any[]>, g: any) => {
        const key = `${g.academicYear} - ${g.term}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(g);
        return acc;
    }, {});

    const statusColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        pending: "secondary",
        processing: "default",
        ready: "outline",
        rejected: "destructive",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Academic Transcripts"
                description="View your academic records and request official transcripts."
                actions={
                    <Link href="/portal/alumni/transcripts/request">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Request Transcript
                        </Button>
                    </Link>
                }
            />

            <Tabs defaultValue="records" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="records">Academic Records</TabsTrigger>
                    <TabsTrigger value="reports">Report Cards</TabsTrigger>
                    <TabsTrigger value="requests">My Requests ({requests.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="records" className="space-y-4">
                    {Object.keys(gradesByYear).length > 0 ? (
                        Object.entries(gradesByYear).map(([period, periodGrades]) => (
                            <Card key={period}>
                                <CardHeader>
                                    <CardTitle className="text-lg">{period}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Subject</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Grade</TableHead>
                                                <TableHead>Remarks</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(periodGrades as any[]).map((g: any) => (
                                                <TableRow key={g._id}>
                                                    <TableCell className="font-medium">{g.subjectId}</TableCell>
                                                    <TableCell>{g.score}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{g.grade}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {g.remarks ?? "—"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No academic records available.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    {reportCards.length > 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Term</TableHead>
                                            <TableHead>Academic Year</TableHead>
                                            <TableHead>GPA</TableHead>
                                            <TableHead>Rank</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {reportCards.map((rc: any) => (
                                            <TableRow key={rc._id}>
                                                <TableCell className="font-medium">{rc.term}</TableCell>
                                                <TableCell>{rc.academicYear}</TableCell>
                                                <TableCell>{rc.gpa?.toFixed(2) ?? "—"}</TableCell>
                                                <TableCell>{rc.rank ?? "—"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{rc.status}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {rc.fileUrl ? (
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">N/A</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No report cards available.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="requests" className="space-y-4">
                    {requests.length > 0 ? (
                        <Card>
                            <CardContent className="pt-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Requested</TableHead>
                                            <TableHead>Issued</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {requests.map((req: any) => (
                                            <TableRow key={req._id}>
                                                <TableCell className="font-medium capitalize">
                                                    {req.type} transcript
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusColors[req.status] ?? "default"}>
                                                        {req.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(req.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {req.issuedDate
                                                        ? new Date(req.issuedDate).toLocaleDateString()
                                                        : "—"}
                                                </TableCell>
                                                <TableCell>
                                                    {req.fileUrl ? (
                                                        <Button variant="ghost" size="sm">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Pending</span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No transcript requests yet.</p>
                                <Link href="/portal/alumni/transcripts/request">
                                    <Button className="mt-4" variant="outline">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Request Your First Transcript
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
