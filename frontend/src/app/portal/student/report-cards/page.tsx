"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, FileDown, GraduationCap } from "lucide-react";

export default function StudentReportCardsPage() {
  const { isLoading } = useAuth();

  const reports = useQuery(api.modules.portal.student.queries.getMyReportCards);

  if (isLoading || reports === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="Report Cards"
        description="Download your official termly and yearly academic reports"
      />

      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-14 w-14 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Report Cards Yet</h3>
              <p className="text-muted-foreground text-center max-w-sm">
                Report cards are published by the school administration at the
                end of each academic term. Check back after your term exams.
              </p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report: any) => (
            <Card
              key={report._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {report.term} Report Card
                      </h3>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Published
                      </Badge>
                    </div>
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {new Date(
                        report.publishedAt || report.createdAt
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {report.academicYear && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Academic Year: {report.academicYear}
                      </p>
                    )}
                  </div>
                </div>

                <Button variant="outline" className="gap-2">
                  <FileDown className="h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
