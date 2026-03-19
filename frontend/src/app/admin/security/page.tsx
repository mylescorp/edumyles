"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Key,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function SecurityPage() {
  const { isLoading, sessionToken } = useAuth();

  const auditLogs = useQuery(
    api.platform.audit.queries.listTenantAuditLogs,
    sessionToken ? { sessionToken, limit: 20 } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const logs = (auditLogs as any[]) ?? [];
  const securityEvents = logs.filter(
    (l) =>
      l.action.includes("login") ||
      l.action.includes("logout") ||
      l.action.includes("password") ||
      l.action.includes("permission") ||
      l.action.includes("impersonation") ||
      l.action.includes("security")
  );

  const failedLogins = logs.filter((l) => l.action.includes("failed")).length;
  const recentLogins = logs.filter((l) => l.action.includes("login")).length;
  const passwordChanges = logs.filter((l) => l.action.includes("password")).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security Vault"
        description="Monitor security events, access logs, and account protection"
      />

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{recentLogins}</p>
              <p className="text-sm text-muted-foreground">Login Events</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <ShieldAlert className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{failedLogins}</p>
              <p className="text-sm text-muted-foreground">Failed Attempts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Key className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{passwordChanges}</p>
              <p className="text-sm text-muted-foreground">Password Changes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Checklist
          </CardTitle>
          <CardDescription>Recommended security practices for your school account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              label: "Strong password policy enabled",
              status: true,
              description: "Minimum 8 characters required for all users",
            },
            {
              label: "Audit logging active",
              status: true,
              description: "All admin actions are recorded in the audit log",
            },
            {
              label: "Role-based access control",
              status: true,
              description: "Users have appropriate permissions based on their role",
            },
            {
              label: "Session timeout configured",
              status: true,
              description: "Sessions expire after inactivity",
            },
            {
              label: "Two-factor authentication",
              status: false,
              description: "Enable 2FA for additional account security",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                {item.status ? (
                  <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              </div>
              <Badge variant={item.status ? "default" : "outline"}>
                {item.status ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Security Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/audit" className="flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No security events recorded yet.
            </p>
          ) : (
            <div className="space-y-3">
              {securityEvents.slice(0, 10).map((log: any, i: number) => (
                <div
                  key={log._id ?? i}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        {log.action.replace(/\./g, " ").replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.userName ?? log.actorId} •{" "}
                        {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      log.action.includes("failed") ? "destructive" : "outline"
                    }
                    className="text-xs"
                  >
                    {log.action.includes("failed") ? "Failed" : "Success"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
