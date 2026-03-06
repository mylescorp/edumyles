"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Database, 
  Shield, 
  Bell, 
  Mail,
  Globe,
  Users,
  Building2,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Download,
  Key,
  Lock,
  Eye,
  EyeOff
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";

export default function PlatformSettingsPage() {
    const { isLoading } = useAuth();
    const { hasRole } = usePermissions();
    const isMasterAdmin = hasRole("master_admin");

    if (isLoading) return <LoadingSkeleton variant="page" />;

    if (!isMasterAdmin) {
        return (
            <div>
                <PageHeader
                    title="Platform Settings"
                    description="Platform configuration"
                    breadcrumbs={[
                        { label: "Platform", href: "/platform" },
                        { label: "Settings" },
                    ]}
                />
                <div className="flex min-h-[40vh] items-center justify-center">
                    <p className="text-muted-foreground">Only Master Admins can access platform settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <PageHeader
                title="Platform Settings"
                description="Configure platform-wide settings and defaults"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Settings" },
                ]}
            />

            <div className="grid gap-6 max-w-3xl">
                {/* Platform Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Platform Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Platform</p>
                                <p className="text-sm font-semibold">EduMyles</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Root Domain</p>
                                <p className="text-sm">edumyles.com</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tenant URL Pattern</p>
                                <p className="text-sm font-mono">{"{slug}"}.edumyles.com</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Environment</p>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                                    Production
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Auth Provider</p>
                                <p className="text-sm">WorkOS (Magic Links + SSO)</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Session Expiry</p>
                                <p className="text-sm">30 days</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Audit Retention</p>
                                <p className="text-sm">7 years</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tenant Isolation</p>
                                <Badge variant="secondary" className="bg-green-500/10 text-green-700">
                                    Enforced
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Database */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Database
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Provider</p>
                                <p className="text-sm">Convex (Real-time Serverless)</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Tables</p>
                                <p className="text-sm">27 tables defined</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Integrations */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Integrations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {[
                                { name: "M-Pesa (Daraja)", status: "Configured" },
                                { name: "Stripe", status: "Configured" },
                                { name: "Africa's Talking SMS", status: "Configured" },
                                { name: "Resend Email", status: "Configured" },
                                { name: "Airtel Money", status: "Pending" },
                            ].map((integration) => (
                                <div key={integration.name} className="flex items-center justify-between py-1">
                                    <span className="text-sm">{integration.name}</span>
                                    <Badge
                                        variant="outline"
                                        className={integration.status === "Configured"
                                            ? "bg-green-500/10 text-green-700"
                                            : "bg-yellow-500/10 text-yellow-700"
                                        }
                                    >
                                        {integration.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
