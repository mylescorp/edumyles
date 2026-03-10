"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building2,
  Users,
  CreditCard,
  MessageSquare,
  Settings,
  Activity,
  Package,
  Mail,
  MapPin,
  Calendar,
  Globe,
  Shield,
  CheckCircle2,
  PauseCircle,
  FlaskConical,
  TrendingUp,
  Download,
  Edit,
  Eye,
  AlertTriangle,
  Clock,
  DollarSign,
  FileText,
  Send,
  Bell,
  Lock,
  Database,
  Zap,
  BarChart3
} from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface TenantDetail {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  email: string;
  phone?: string;
  county: string;
  country: string;
  address?: string;
  createdAt: number;
  modules?: string[];
  userCount?: number;
  lastActive?: number;
  billing?: {
    mrr: number;
    arr: number;
    nextBillingDate: number;
    paymentMethod: string;
    invoiceCount: number;
    totalPaid: number;
  };
  stats?: {
    totalLogins: number;
    totalSessions: number;
    avgSessionDuration: number;
    storageUsed: number;
    apiCalls: number;
  };
}

interface TenantDetailTabsProps {
  tenant: TenantDetail;
  isLoading?: boolean;
  className?: string;
}

export function TenantDetailTabs({ tenant, isLoading = false, className = "" }: TenantDetailTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 bg-muted/30 border-border/50">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="modules" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Modules</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Tickets</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
          <TabsTrigger value="communications" className="flex items-center space-x-2">
            <Mail className="h-4 w-4" />
            <span className="hidden sm:inline">Comms</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>School Information</span>
                  </span>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">School Name</label>
                      <p className="font-semibold">{tenant.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Subdomain</label>
                      <p className="font-semibold">{tenant.subdomain}.edumyles.co.ke</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="font-semibold">{tenant.email}</p>
                    </div>
                    {tenant.phone && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <p className="font-semibold">{tenant.phone}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="font-semibold">{tenant.county}, {tenant.country}</p>
                      {tenant.address && <p className="text-sm text-muted-foreground">{tenant.address}</p>}
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Status</label>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={tenant.status} />
                        {tenant.status === "active" && <CheckCircle2 className="h-4 w-4 text-em-success" />}
                        {tenant.status === "trial" && <FlaskConical className="h-4 w-4 text-em-info" />}
                        {tenant.status === "suspended" && <PauseCircle className="h-4 w-4 text-em-danger" />}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Plan</label>
                      <PlanBadge plan={tenant.plan} />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                      <p className="font-semibold">{formatDate(new Date(tenant.createdAt))}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Quick Stats</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Users</span>
                  <span className="font-semibold">{tenant.userCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Modules</span>
                  <span className="font-semibold">{tenant.modules?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Last Active</span>
                  <span className="font-semibold">
                    {tenant.lastActive ? formatDate(new Date(tenant.lastActive)) : "Never"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Storage Used</span>
                  <span className="font-semibold">{tenant.stats?.storageUsed || 0} GB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">API Calls</span>
                  <span className="font-semibold">{tenant.stats?.apiCalls?.toLocaleString() || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Statistics */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Usage Statistics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-em-primary">{tenant.stats?.totalLogins?.toLocaleString() || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Logins</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-em-success">{tenant.stats?.totalSessions?.toLocaleString() || 0}</div>
                  <p className="text-sm text-muted-foreground">Total Sessions</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-em-info">{Math.round((tenant.stats?.avgSessionDuration || 0) / 60)} min</div>
                  <p className="text-sm text-muted-foreground">Avg Session</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-em-accent-dark">{tenant.stats?.storageUsed || 0} GB</div>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Installed Modules</span>
                </span>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Manage Modules
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenant.modules?.map((module) => (
                  <ModuleCard key={module} moduleName={module} />
                ))}
                {(!tenant.modules || tenant.modules.length === 0) && (
                  <div className="col-span-full text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No modules installed</h3>
                    <p className="text-muted-foreground mb-4">Install modules to enable additional features</p>
                    <Button>
                      <Package className="h-4 w-4 mr-2" />
                      Browse Modules
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>User Management</span>
                </span>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">User Management</h3>
                <p className="text-muted-foreground mb-4">
                  Total {tenant.userCount || 0} users in this tenant
                </p>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Billing Overview */}
            <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Billing Overview</span>
                  </span>
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Invoices
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Monthly Recurring Revenue</label>
                      <p className="text-2xl font-bold text-em-success">
                        KES {(tenant.billing?.mrr || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Annual Recurring Revenue</label>
                      <p className="text-2xl font-bold text-em-info">
                        KES {(tenant.billing?.arr || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                      <p className="font-semibold">{tenant.billing?.paymentMethod || "Not set"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Next Billing Date</label>
                      <p className="font-semibold">
                        {tenant.billing?.nextBillingDate 
                          ? formatDate(new Date(tenant.billing.nextBillingDate))
                          : "Not scheduled"
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Invoices</label>
                      <p className="font-semibold">{tenant.billing?.invoiceCount || 0}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Total Paid</label>
                      <p className="font-semibold text-em-success">
                        KES {(tenant.billing?.totalPaid || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Quick Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button className="w-full" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Statement
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Support Tickets</span>
                </span>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Create Ticket
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Support Tickets</h3>
                <p className="text-muted-foreground mb-4">View and manage support tickets for this tenant</p>
                <Button>
                  <Eye className="h-4 w-4 mr-2" />
                  View All Tickets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Activity Log</span>
                </span>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Activity Log</h3>
                <p className="text-muted-foreground mb-4">View detailed activity history for this tenant</p>
                <Button>
                  <Eye className="h-4 w-4 mr-2" />
                  View Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communications Tab */}
        <TabsContent value="communications" className="space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Mail className="h-5 w-5" />
                  <span>Communications</span>
                </span>
                <Button size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Communications</h3>
                <p className="text-muted-foreground mb-4">Manage email and SMS communications</p>
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Broadcast
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>General Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Tenant Status</p>
                    <p className="text-sm text-muted-foreground">Active, Trial, or Suspended</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Subscription Plan</p>
                    <p className="text-sm text-muted-foreground">Current plan and billing</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Domain Settings</p>
                    <p className="text-sm text-muted-foreground">Custom domain and SSL</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Security Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">Enable 2FA for all users</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Lock className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Session Timeout</p>
                    <p className="text-sm text-muted-foreground">User session duration</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Clock className="h-4 w-4 mr-2" />
                    Set
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Data Retention</p>
                    <p className="text-sm text-muted-foreground">Data deletion policies</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Database className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Danger Zone */}
          <Card className="bg-em-danger-bg/10 border-em-danger/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-em-danger">
                <AlertTriangle className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Suspend Tenant</p>
                  <p className="text-sm text-muted-foreground">Temporarily disable access</p>
                </div>
                <Button variant="destructive" size="sm">
                  <PauseCircle className="h-4 w-4 mr-2" />
                  Suspend
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Tenant</p>
                  <p className="text-sm text-muted-foreground">Permanently delete all data</p>
                </div>
                <Button variant="destructive" size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const colorClass = status === "active"
    ? "bg-em-success-bg/10 text-em-success border-em-success/20"
    : status === "trial"
      ? "bg-em-info-bg/10 text-em-info border-em-info/20"
      : "bg-em-danger-bg/10 text-em-danger border-em-danger/20";

  return (
    <Badge variant="outline" className={colorClass}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// Plan Badge Component
function PlanBadge({ plan }: { plan: string }) {
  const colorClass = plan === "enterprise"
    ? "bg-purple-500/10 text-purple-700 border-purple-200"
    : plan === "pro"
      ? "bg-em-accent-bg/10 text-em-accent-dark border-em-accent/20"
      : plan === "growth"
        ? "bg-em-info-bg/10 text-em-info border-em-info/20"
        : "bg-em-success-bg/10 text-em-success border-em-success/20";

  return (
    <Badge variant="outline" className={colorClass}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </Badge>
  );
}

// Module Card Component
function ModuleCard({ moduleName }: { moduleName: string }) {
  const moduleInfo = {
    academics: { name: "Academics", icon: "📚", color: "bg-em-info-bg/10 text-em-info" },
    communications: { name: "Communications", icon: "📧", color: "bg-em-success-bg/10 text-em-success" },
    billing: { name: "Billing", icon: "💳", color: "bg-em-warning-bg/10 text-em-accent-dark" },
    hr: { name: "HR Management", icon: "👥", color: "bg-em-accent-bg/10 text-em-accent-dark" },
    library: { name: "Library", icon: "📖", color: "bg-purple-500/10 text-purple-700" },
    transport: { name: "Transport", icon: "🚌", color: "bg-em-danger-bg/10 text-em-danger" },
  };

  const info = moduleInfo[moduleName as keyof typeof moduleInfo] || {
    name: moduleName,
    icon: "📦",
    color: "bg-muted/10 text-muted-foreground"
  };

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/50 transition-colors`}>
      <CardContent className="pt-6">
        <div className="text-center space-y-3">
          <div className={`text-4xl ${info.color} rounded-lg w-16 h-16 flex items-center justify-center mx-auto`}>
            {info.icon}
          </div>
          <div>
            <h3 className="font-semibold">{info.name}</h3>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
          <Button variant="outline" size="sm" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
