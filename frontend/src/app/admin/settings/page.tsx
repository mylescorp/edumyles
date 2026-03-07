"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Building2, 
  Globe, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar,
  Settings,
  Bell,
  Shield,
  Database,
  Users,
  Activity
} from "lucide-react";
import { useState } from "react";

export default function SchoolSettingsPage() {
    const { isLoading } = useAuth();
    const { tenant, organization, tier } = useTenant();
    
    const [notificationSettings, setNotificationSettings] = useState({
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: false,
        parentNotifications: true,
    });

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleNotificationChange = (key: string, value: boolean) => {
        setNotificationSettings(prev => ({ ...prev, [key]: value }));
    };

    // Mock system stats
    const systemStats = {
        activeUsers: 1247,
        storageUsed: "2.4 GB",
        uptime: "99.9%",
        lastBackup: "2 hours ago",
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Settings"
                description="Manage school configuration, notifications, and system settings"
            />

            {/* System Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <AdminStatsCard
                    title="Active Users"
                    value={systemStats.activeUsers.toLocaleString()}
                    description="Currently active users"
                    icon={Users}
                    trend={{ value: 8, isPositive: true }}
                />
                <AdminStatsCard
                    title="Storage Used"
                    value={systemStats.storageUsed}
                    description="Database storage"
                    icon={Database}
                    variant="warning"
                />
                <AdminStatsCard
                    title="System Uptime"
                    value={systemStats.uptime}
                    description="Server availability"
                    icon={Activity}
                    variant="success"
                />
                <AdminStatsCard
                    title="Last Backup"
                    value={systemStats.lastBackup}
                    description="Automatic backup"
                    icon={Shield}
                    variant="success"
                />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">School Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <InfoRow icon={Building2} label="School Name" value={tenant?.name ?? "—"} />
                        <InfoRow icon={Globe} label="Subdomain" value={tenant?.subdomain ? `${tenant.subdomain}.edumyles.com` : "—"} />
                        <InfoRow icon={Mail} label="Email" value={tenant?.email ?? "—"} />
                        <InfoRow icon={Phone} label="Phone" value={tenant?.phone ?? "—"} />
                        <InfoRow icon={Globe} label="Country" value={tenant?.country ?? "—"} />
                        <InfoRow icon={Building2} label="County" value={tenant?.county ?? "—"} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Subscription</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Current Plan</span>
                            <Badge variant="default" className="capitalize">{tier ?? tenant?.plan ?? "Free"}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant={tenant?.status === "active" ? "default" : "destructive"}>
                                {tenant?.status ?? "—"}
                            </Badge>
                        </div>
                        {organization && (
                            <InfoRow icon={Building2} label="Organization" value={organization.name} />
                        )}
                        <div className="pt-2">
                            <Button className="w-full">Upgrade Plan</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notification Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="emailNotifications">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send email alerts</p>
                            </div>
                            <Switch
                                id="emailNotifications"
                                checked={notificationSettings.emailNotifications}
                                onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="smsNotifications">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Send SMS alerts</p>
                            </div>
                            <Switch
                                id="smsNotifications"
                                checked={notificationSettings.smsNotifications}
                                onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="pushNotifications">Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">In-app notifications</p>
                            </div>
                            <Switch
                                id="pushNotifications"
                                checked={notificationSettings.pushNotifications}
                                onCheckedChange={(checked) => handleNotificationChange('pushNotifications', checked)}
                            />
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="parentNotifications">Parent Notifications</Label>
                                <p className="text-sm text-muted-foreground">Notify parents</p>
                            </div>
                            <Switch
                                id="parentNotifications"
                                checked={notificationSettings.parentNotifications}
                                onCheckedChange={(checked) => handleNotificationChange('parentNotifications', checked)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Database className="h-4 w-4" />
                            Backup Database
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Users className="h-4 w-4" />
                            Manage Users
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Shield className="h-4 w-4" />
                            Security Settings
                        </Button>
                        <Button variant="outline" className="w-full justify-start gap-2">
                            <Globe className="h-4 w-4" />
                            Export Data
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
