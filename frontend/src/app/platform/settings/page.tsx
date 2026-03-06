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

interface SystemSettings {
  general: {
    platformName: string;
    platformDescription: string;
    defaultLanguage: string;
    timezone: string;
    dateFormat: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorRequired: boolean;
    ipWhitelist: string[];
    allowedDomains: string[];
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUsername: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableSsl: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    backupLocation: string;
    lastBackup: string;
  };
  integrations: {
    paymentGateway: string;
    smsProvider: string;
    cloudStorage: string;
    analyticsEnabled: boolean;
    crmIntegration: boolean;
  };
}

export default function PlatformSettingsPage() {
    const { isLoading } = useAuth();
    const { hasRole } = usePermissions();
    const { toast } = useToast();
    const isMasterAdmin = hasRole("master_admin");
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswords, setShowPasswords] = useState(false);
    const [settings, setSettings] = useState<SystemSettings | null>(null);

    // Mock settings data
    const mockSettings: SystemSettings = {
      general: {
        platformName: "EduMyles",
        platformDescription: "Comprehensive School Management Platform for East Africa",
        defaultLanguage: "English",
        timezone: "Africa/Nairobi",
        dateFormat: "DD/MM/YYYY",
        maintenanceMode: false,
        registrationEnabled: true
      },
      security: {
        passwordMinLength: 8,
        sessionTimeout: 480,
        maxLoginAttempts: 5,
        twoFactorRequired: false,
        ipWhitelist: ["192.168.1.0/24", "10.0.0.0/8"],
        allowedDomains: ["edumyles.com", "school.edu"]
      },
      email: {
        smtpHost: "smtp.edumyles.com",
        smtpPort: 587,
        smtpUsername: "noreply@edumyles.com",
        smtpPassword: "•••••••••••",
        fromEmail: "noreply@edumyles.com",
        fromName: "EduMyles Platform",
        enableSsl: true
      },
      backup: {
        autoBackup: true,
        backupFrequency: "daily",
        retentionDays: 30,
        backupLocation: "cloud",
        lastBackup: "2024-01-15T02:30:00Z"
      },
      integrations: {
        paymentGateway: "stripe",
        smsProvider: "twilio",
        cloudStorage: "aws",
        analyticsEnabled: true,
        crmIntegration: false
      }
    };

  useEffect(() => {
    const loadSettings = async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSettings(mockSettings);
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Settings Saved",
        description: "System settings have been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSettings(mockSettings);
      toast({
        title: "Settings Reset",
        description: "Settings have been reset to default values.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset settings.",
        variant: "destructive",
      });
    }
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `edumyles-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const updateSetting = (category: keyof SystemSettings, field: string, value: any) => {
    if (settings) {
      setSettings({
        ...settings,
        [category]: {
          ...settings[category],
          [field]: value
        }
      });
    }
  };

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

    if (!settings) {
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
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#056C40]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="System Settings"
                description="Configure platform-wide settings and preferences"
                breadcrumbs={[
                    { label: "Dashboard", href: "/platform" },
                    { label: "Settings", href: "/platform/settings" }
                ]}
                actions={
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={handleExportSettings}>
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" onClick={handleReset}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Reset to Default
                        </Button>
                        <Button 
                            className="bg-[#056C40] hover:bg-[#023c24]" 
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                }
            />

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="backup">Backup</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
                </TabsList>

                {/* General Settings */}
                <TabsContent value="general" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5" />
                                Platform Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="platformName">Platform Name</Label>
                                    <Input
                                        id="platformName"
                                        value={settings.general.platformName}
                                        onChange={(e) => updateSetting('general', 'platformName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="defaultLanguage">Default Language</Label>
                                    <Select value={settings.general.defaultLanguage} onValueChange={(value) => updateSetting('general', 'defaultLanguage', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="English">English</SelectItem>
                                            <SelectItem value="Swahili">Swahili</SelectItem>
                                            <SelectItem value="French">French</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="platformDescription">Platform Description</Label>
                                <Textarea
                                    id="platformDescription"
                                    value={settings.general.platformDescription}
                                    onChange={(e) => updateSetting('general', 'platformDescription', e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="timezone">Timezone</Label>
                                    <Select value={settings.general.timezone} onValueChange={(value) => updateSetting('general', 'timezone', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dateFormat">Date Format</Label>
                                    <Select value={settings.general.dateFormat} onValueChange={(value) => updateSetting('general', 'dateFormat', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Maintenance Mode</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Temporarily disable access for all users
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.general.maintenanceMode}
                                        onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>User Registration</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow new users to register
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.general.registrationEnabled}
                                        onCheckedChange={(checked) => updateSetting('general', 'registrationEnabled', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Settings */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Security Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="passwordMinLength">Min Password Length</Label>
                                    <Input
                                        id="passwordMinLength"
                                        type="number"
                                        value={settings.security.passwordMinLength}
                                        onChange={(e) => updateSetting('security', 'passwordMinLength', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                                    <Input
                                        id="sessionTimeout"
                                        type="number"
                                        value={settings.security.sessionTimeout}
                                        onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                                    <Input
                                        id="maxLoginAttempts"
                                        type="number"
                                        value={settings.security.maxLoginAttempts}
                                        onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Two-Factor Authentication</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Require 2FA for all admin users
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.security.twoFactorRequired}
                                        onCheckedChange={(checked) => updateSetting('security', 'twoFactorRequired', checked)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>IP Whitelist</Label>
                                <Textarea
                                    value={settings.security.ipWhitelist.join('\n')}
                                    onChange={(e) => updateSetting('security', 'ipWhitelist', e.target.value.split('\n').filter(ip => ip.trim()))}
                                    rows={4}
                                    placeholder="Enter IP addresses, one per line"
                                />
                            </div>

                            <div className="space-y-4">
                                <Label>Allowed Domains</Label>
                                <Textarea
                                    value={settings.security.allowedDomains.join('\n')}
                                    onChange={(e) => updateSetting('security', 'allowedDomains', e.target.value.split('\n').filter(domain => domain.trim()))}
                                    rows={3}
                                    placeholder="Enter allowed domains, one per line"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Email Settings */}
                <TabsContent value="email" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Email Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpHost">SMTP Host</Label>
                                    <Input
                                        id="smtpHost"
                                        value={settings.email.smtpHost}
                                        onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPort">SMTP Port</Label>
                                    <Input
                                        id="smtpPort"
                                        type="number"
                                        value={settings.email.smtpPort}
                                        onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="smtpUsername">SMTP Username</Label>
                                    <Input
                                        id="smtpUsername"
                                        value={settings.email.smtpUsername}
                                        onChange={(e) => updateSetting('email', 'smtpUsername', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="smtpPassword"
                                            type={showPasswords ? "text" : "password"}
                                            value={settings.email.smtpPassword}
                                            onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="fromEmail">From Email</Label>
                                    <Input
                                        id="fromEmail"
                                        type="email"
                                        value={settings.email.fromEmail}
                                        onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="fromName">From Name</Label>
                                    <Input
                                        id="fromName"
                                        value={settings.email.fromName}
                                        onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable SSL/TLS</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Use secure connection for SMTP
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.email.enableSsl}
                                    onCheckedChange={(checked) => updateSetting('email', 'enableSsl', checked)}
                                />
                            </div>

                            <div className="flex space-x-2">
                                <Button variant="outline">
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Test Connection
                                </Button>
                                <Button variant="outline">
                                    <Mail className="h-4 w-4 mr-2" />
                                    Send Test Email
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Backup Settings */}
                <TabsContent value="backup" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Backup Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Automatic Backup</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable scheduled backups
                                    </p>
                                </div>
                                <Switch
                                    checked={settings.backup.autoBackup}
                                    onCheckedChange={(checked) => updateSetting('backup', 'autoBackup', checked)}
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                                    <Select value={settings.backup.backupFrequency} onValueChange={(value) => updateSetting('backup', 'backupFrequency', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="hourly">Hourly</SelectItem>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="retentionDays">Retention Days</Label>
                                    <Input
                                        id="retentionDays"
                                        type="number"
                                        value={settings.backup.retentionDays}
                                        onChange={(e) => updateSetting('backup', 'retentionDays', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="backupLocation">Backup Location</Label>
                                <Select value={settings.backup.backupLocation} onValueChange={(value) => updateSetting('backup', 'backupLocation', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                                        <SelectItem value="local">Local Storage</SelectItem>
                                        <SelectItem value="hybrid">Hybrid</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Last Backup</Label>
                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                    <span>{new Date(settings.backup.lastBackup).toLocaleString()}</span>
                                    <Badge className="bg-green-100 text-green-800">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Successful
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex space-x-2">
                                <Button variant="outline">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Create Backup Now
                                </Button>
                                <Button variant="outline">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Latest Backup
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integrations Settings */}
                <TabsContent value="integrations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5" />
                                Third-Party Integrations
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="paymentGateway">Payment Gateway</Label>
                                    <Select value={settings.integrations.paymentGateway} onValueChange={(value) => updateSetting('integrations', 'paymentGateway', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="stripe">Stripe</SelectItem>
                                            <SelectItem value="paypal">PayPal</SelectItem>
                                            <SelectItem value="mpesa">M-Pesa</SelectItem>
                                            <SelectItem value="airtel">Airtel Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="smsProvider">SMS Provider</Label>
                                    <Select value={settings.integrations.smsProvider} onValueChange={(value) => updateSetting('integrations', 'smsProvider', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="twilio">Twilio</SelectItem>
                                            <SelectItem value="africastalking">Africa's Talking</SelectItem>
                                            <SelectItem value="infobip">Infobip</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cloudStorage">Cloud Storage Provider</Label>
                                <Select value={settings.integrations.cloudStorage} onValueChange={(value) => updateSetting('integrations', 'cloudStorage', value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="aws">Amazon AWS</SelectItem>
                                        <SelectItem value="azure">Microsoft Azure</SelectItem>
                                        <SelectItem value="google">Google Cloud</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Analytics Integration</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable Google Analytics integration
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.integrations.analyticsEnabled}
                                        onCheckedChange={(checked) => updateSetting('integrations', 'analyticsEnabled', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>CRM Integration</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Connect with external CRM systems
                                        </p>
                                    </div>
                                    <Switch
                                        checked={settings.integrations.crmIntegration}
                                        onCheckedChange={(checked) => updateSetting('integrations', 'crmIntegration', checked)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
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
