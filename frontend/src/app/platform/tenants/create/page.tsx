"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { TenantProvisioningWizard } from "@/components/platform/TenantProvisioningWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles } from "lucide-react";

export default function CreateTenantPage() {
    const { isLoading, sessionToken } = useAuth();
    const router = useRouter();

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Provision New School"
                description="Create a new tenant with our comprehensive 5-step wizard"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Tenants", href: "/platform/tenants" },
                    { label: "Create" },
                ]}
            />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Welcome Card */}
                <Card className="bg-gradient-to-r from-em-primary/10 to-em-accent/10 border-em-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Sparkles className="h-5 w-5 text-em-primary" />
                            <span>Welcome to EduMyles Tenant Provisioning</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-em-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Building2 className="h-6 w-6 text-em-primary" />
                                </div>
                                <h3 className="font-semibold mb-2">5 Simple Steps</h3>
                                <p className="text-sm text-muted-foreground">
                                    Complete our guided wizard to set up your school in minutes
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-em-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="h-6 w-6 text-em-success" />
                                </div>
                                <h3 className="font-semibold mb-2">Instant Setup</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your school will be ready to use immediately after provisioning
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-em-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="h-6 w-6 text-em-accent-dark" />
                                </div>
                                <h3 className="font-semibold mb-2">Customizable</h3>
                                <p className="text-sm text-muted-foreground">
                                    Choose the modules and features that fit your school's needs
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Provisioning Wizard */}
                <TenantProvisioningWizard />
            </div>
        </div>
    );
}
