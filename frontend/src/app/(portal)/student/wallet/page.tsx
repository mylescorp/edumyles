"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, ArrowUpCircle, ArrowDownCircle, History } from "lucide-react";

export default function StudentWallet() {
    const wallet = useQuery(api.modules.portal.student.queries.getMyWalletBalance);

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Digital Wallet"
                description="Manage your school funds for cafeteria and shop purchases."
            />

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="h-5 w-5" />
                            Current Balance
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/70">Available for use in school</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {wallet ? `KES ${(wallet.balanceCents / 100).toLocaleString()}` : "KES 0"}
                        </div>
                        <p className="mt-2 text-sm text-primary-foreground/80">
                            Valid at: School Canteen & Uniform Shop
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Recent Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex h-32 items-center justify-center text-muted-foreground italic border-2 border-dashed rounded-lg">
                                No recent transactions.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed">
                    <CardHeader>
                        <ArrowUpCircle className="h-8 w-8 text-green-500 mb-2" />
                        <CardTitle>Top-Up Wallet</CardTitle>
                        <CardDescription>Add funds using M-Pesa or Student Card.</CardDescription>
                    </CardHeader>
                </Card>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-dashed">
                    <CardHeader>
                        <ArrowDownCircle className="h-8 w-8 text-blue-500 mb-2" />
                        <CardTitle>Transfer / Send</CardTitle>
                        <CardDescription>Send funds to another student or club.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </div>
    );
}
