"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  GraduationCap,
  DollarSign,
  FileText,
  TrendingUp,
  ArrowRight,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatCurrency(cents: number, currency: string) {
  return `${currency} ${(cents / 100).toLocaleString()}`;
}

export default function PartnerDashboardPage() {
  const { isLoading } = useAuth();
  const { isModuleInstalled, isLoading: modulesLoading } = useInstalledModules();
  const sisEnabled = isModuleInstalled("sis");
  const financeEnabled = isModuleInstalled("finance");

  const profile = useQuery(api.modules.portal.partner.queries.getPartnerProfile, {});
  const sponsored = useQuery(api.modules.portal.partner.queries.getSponsoredStudents, sisEnabled ? {} : "skip");
  const report = useQuery(api.modules.portal.partner.queries.getSponsorshipReport, financeEnabled ? {} : "skip");
  const paymentsData = useQuery(api.modules.portal.partner.queries.getPartnerPayments, financeEnabled ? {} : "skip");

  if (
    isLoading ||
    modulesLoading ||
    profile === undefined ||
    (sisEnabled && sponsored === undefined) ||
    (financeEnabled && (report === undefined || paymentsData === undefined))
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageHeader title="Partner Dashboard" description="Partner access portal" />
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">No partner profile linked</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Contact your school to set up sponsorship access for your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sponsoredStudents = sponsored ?? [];
  const totalInvestedCents = report?.totalInvestedCents ?? 0;
  const totalInvestedCurrency = sponsoredStudents?.[0]?.sponsorshipCurrency ?? "KES";
  const reportsCount = report?.students?.length ?? 0;
  const paymentRecordsCount = paymentsData?.payments?.length ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Dashboard"
        description={`${profile.organizationName} — monitor sponsored students and reports`}
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sponsored Students"
          value={sisEnabled ? sponsoredStudents.length : "—"}
          icon={GraduationCap}
          variant="default"
        />
        <StatCard
          label="Total Invested"
          value={financeEnabled ? formatCurrency(totalInvestedCents, totalInvestedCurrency) : "—"}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          label="Students in Report"
          value={financeEnabled ? reportsCount : "—"}
          icon={FileText}
          variant="info"
        />
        <StatCard
          label="Payment Records"
          value={financeEnabled ? paymentRecordsCount : "—"}
          icon={TrendingUp}
          variant="default"
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Summary */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="h-4 w-4 text-[#26A65B]" />
              Performance Summary
            </CardTitle>
            {financeEnabled && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/partner/reports" className="flex items-center gap-1">
                  Full report <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!financeEnabled ? (
              <div className="p-3 rounded-lg border border-[rgba(232,160,32,0.2)] bg-[rgba(232,160,32,0.05)]">
                <p className="text-sm text-muted-foreground">
                  Finance-powered reporting appears here when the Finance module is enabled.
                </p>
              </div>
            ) : report?.summary?.averageScore != null ? (
              <div className="space-y-3">
                <div className="p-4 rounded-lg border border-[rgba(38,166,91,0.2)] bg-[rgba(38,166,91,0.05)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-[#26A65B]">{report.summary.averageScore.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Across {reportsCount} sponsored student{reportsCount !== 1 ? "s" : ""}</p>
                </div>
                {report.summary.attendanceRate != null && (
                  <div className="p-4 rounded-lg border border-[rgba(21,101,192,0.2)] bg-[rgba(21,101,192,0.05)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Attendance Rate</p>
                    <p className="text-2xl font-bold text-[#1565C0]">{report.summary.attendanceRate.toFixed(1)}%</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aggregate performance appears in Reports.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Sponsored Students */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5 px-5">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-[#0F4C2A]" />
              Sponsored Students
            </CardTitle>
            {sisEnabled && sponsoredStudents.length > 3 && (
              <Button asChild size="sm" variant="ghost" className="h-7 text-xs">
                <Link href="/portal/partner/students" className="flex items-center gap-1">
                  View all <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-5 pb-5">
            {!sisEnabled ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                SIS module not active — student data unavailable.
              </p>
            ) : sponsoredStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No sponsored students linked yet.
              </p>
            ) : (
              <div className="space-y-2">
                {sponsoredStudents.slice(0, 4).map((student: any) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgba(15,76,42,0.1)] flex-shrink-0">
                        <span className="text-xs font-bold text-[#0F4C2A]">
                          {(student.firstName?.[0] ?? "?").toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {student.firstName} {student.lastName}
                        </p>
                        {student.grade && (
                          <p className="text-xs text-muted-foreground">Grade {student.grade}</p>
                        )}
                      </div>
                    </div>
                    {student.sponsorshipCurrency && student.sponsorshipAmount != null && (
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0 text-[#26A65B] border-[#26A65B]/30 bg-[rgba(38,166,91,0.07)]"
                      >
                        {student.sponsorshipCurrency} {student.sponsorshipAmount.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                ))}
                {sponsoredStudents.length > 4 && (
                  <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs mt-1">
                    <Link href="/portal/partner/students">
                      View all {sponsoredStudents.length} students
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
