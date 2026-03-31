"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useInstalledModules } from "@/hooks/useInstalledModules";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { GraduationCap, DollarSign, FileText, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
      <div>
        <PageHeader title="Partner Dashboard" description="Partner access" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No active partner profile is linked to your account. Please contact your school to set up sponsorship access.
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
    <div>
      <PageHeader
        title="Partner Dashboard"
        description={`${profile.organizationName} — monitor sponsored students and reports`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sponsored Students"
          value={sisEnabled ? sponsoredStudents.length.toString() : "Module Off"}
          icon={GraduationCap}
        />
        <StatCard
          label="Total Invested"
          value={financeEnabled ? formatCurrency(totalInvestedCents, totalInvestedCurrency) : "Module Off"}
          icon={DollarSign}
        />
        <StatCard
          label="Students in Report"
          value={financeEnabled ? reportsCount.toString() : "Module Off"}
          icon={FileText}
        />
        <StatCard
          label="Payment Records"
          value={financeEnabled ? paymentRecordsCount.toString() : "Module Off"}
          icon={MessageSquare}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {financeEnabled && report?.summary?.averageScore != null ? (
              <p className="text-sm text-muted-foreground">
                Average score (reported students): {report.summary.averageScore.toFixed(1)}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {financeEnabled
                  ? "Aggregate performance for your sponsored students appears in Reports."
                  : "Finance-powered reporting appears here when the Finance module is enabled."}
              </p>
            )}
            {financeEnabled && (
              <Button asChild variant="outline" size="sm">
                <Link href="/portal/partner/reports">View reports</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              You sponsor {sponsoredStudents.length} student(s). View their academic and attendance reports in Students, and payment history in Payments.
            </p>
            {sisEnabled && (
              <Button asChild variant="outline" size="sm">
                <Link href="/portal/partner/students">View students</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
