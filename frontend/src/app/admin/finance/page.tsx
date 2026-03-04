"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { StatCard } from "@/components/shared/StatCard";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, Receipt, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatPercentage } from "@/lib/formatters";

export default function FinanceDashboardPage() {
    const { isLoading, sessionToken } = useAuth();

    const report = useQuery(
        api.modules.finance.queries.getFinancialReport,
        sessionToken ? {} : "skip"
    );

    if (isLoading || !report) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Finance Dashboard"
                description="Monitor fee collection and financial health"
            />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    label="Total Billed"
                    value={formatCurrency(report.totalBilled)}
                    icon={FileText}
                />
                <StatCard
                    label="Total Collected"
                    value={formatCurrency(report.totalPaid)}
                    icon={Receipt}
                />
                <StatCard
                    label="Outstanding"
                    value={formatCurrency(report.outstanding)}
                    icon={DollarSign}
                />
                <StatCard
                    label="Collection Rate"
                    value={formatPercentage(report.collectionRate)}
                    icon={ArrowRight}
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Link href="/admin/finance/invoices">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <Receipt className="h-4 w-4" />
                                Manage Invoices
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                        <Link href="/admin/finance/fees">
                            <Button className="w-full justify-start gap-2" variant="outline">
                                <DollarSign className="h-4 w-4" />
                                Fee Structures
                                <ArrowRight className="ml-auto h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(report.byStatus as Record<string, number>).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between">
                                    <span className="capitalize text-sm font-medium">{status}</span>
                                    <span className="text-sm font-bold">{count}</span>
                                </div>
                            ))}
                            {Object.keys(report.byStatus as Record<string, number>).length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No invoices generated yet.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
