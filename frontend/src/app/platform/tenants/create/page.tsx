"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { TenantProvisioningWizard } from "@/components/platform/TenantProvisioningWizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Sparkles } from "lucide-react";

export default function CreateTenantPage() {
    const { isLoading } = useAuth();

    if (isLoading) return <LoadingSkeleton variant="page" />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Provision New School"
                description="Create a new tenant with the live 6-step platform provisioning wizard"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Tenants", href: "/platform/tenants" },
                    { label: "Create" },
                ]}
            />

            <div className="max-w-4xl mx-auto space-y-6">
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
                                <h3 className="font-semibold mb-2">6 Guided Steps</h3>
                                <p className="text-sm text-muted-foreground">
                                    Configure school profile, admin access, subscription, domains, modules, and welcome flow
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-em-success/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="h-6 w-6 text-em-success" />
                                </div>
                                <h3 className="font-semibold mb-2">Convex-backed Provisioning</h3>
                                <p className="text-sm text-muted-foreground">
                                    Tenant, subscription, onboarding, modules, and invite state are all created from live backend workflows
                                </p>
                            </div>
                            <div className="text-center">
                                <div className="w-12 h-12 bg-em-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="h-6 w-6 text-em-accent-dark" />
                                </div>
                                <h3 className="font-semibold mb-2">Marketplace-aware</h3>
                                <p className="text-sm text-muted-foreground">
                                    Select bundled modules, optional pilot grants, currency, and welcome settings before launch
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <TenantProvisioningWizard />
            </div>
        </div>
    );
}
