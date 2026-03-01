"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, FileText, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AlumniDashboardPage() {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Alumni Dashboard"
        description="Access your records and connect with fellow alumni"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Graduation Year" value="--" icon={GraduationCap} />
        <StatCard label="Transcripts" value="--" icon={FileText} />
        <StatCard label="Alumni Network" value="--" icon={Users} />
        <StatCard label="Upcoming Events" value="--" icon={Calendar} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Academic Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and request your academic transcripts.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Alumni events and reunions will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
