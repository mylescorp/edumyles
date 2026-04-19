"use client";

import { api } from "@/convex/_generated/api";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

function formatKes(amount?: number) {
  return `KES ${(amount ?? 0).toLocaleString()}`;
}

export default function MarketplaceBillingPage() {
  const { sessionToken, isLoading } = useAuth();
  const data = usePlatformQuery(
    marketplacePlatformApi.getPlatformBillingData,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any;

  if (isLoading || data === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Billing"
        description="Track module invoices, failed-payment exposure, and recent billing activity."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Billing" },
        ]}
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/billing" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Invoices This Month</p><p className="text-3xl font-semibold">{data.stats.invoicesThisMonth}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Revenue This Month</p><p className="text-3xl font-semibold">{formatKes(data.stats.revenueThisMonthKes)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Billable Installs</p><p className="text-3xl font-semibold">{data.stats.activeBillableInstalls}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Failed Payments</p><p className="text-3xl font-semibold">{data.stats.failedPayments}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Module Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentInvoices.map((invoice: any) => (
                  <TableRow key={invoice.invoiceId}>
                    <TableCell>{invoice.tenantName}</TableCell>
                    <TableCell>{invoice.moduleName}</TableCell>
                    <TableCell>{formatKes(invoice.totalAmountKes)}</TableCell>
                    <TableCell><Badge variant="outline">{invoice.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Payment Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Failures</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.failedPayments.map((item: any) => (
                  <TableRow key={item.installId}>
                    <TableCell>{item.tenantName}</TableCell>
                    <TableCell>{item.moduleName}</TableCell>
                    <TableCell><Badge variant="outline">{item.status}</Badge></TableCell>
                    <TableCell>{item.paymentFailureCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
