"use client";

import { useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface ActivityLog {
  _id: string;
  userId: string;
  action: string;
  details: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: number;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

const ACTIVITY_TYPES = [
  { value: "all", label: "All Activities" },
  { value: "login", label: "Login" },
  { value: "logout", label: "Logout" },
  { value: "session_revoked", label: "Session Revoked" },
  { value: "bulk_sessions_revoked", label: "Bulk Sessions Revoked" },
  { value: "permission_changed", label: "Permission Changed" },
  { value: "role_changed", label: "Role Changed" },
  { value: "account_created", label: "Account Created" },
  { value: "account_suspended", label: "Account Suspended" },
  { value: "account_deleted", label: "Account Deleted" },
  { value: "invite_sent", label: "Invite Sent" },
  { value: "invite_accepted", label: "Invite Accepted" },
  { value: "password_changed", label: "Password Changed" },
  { value: "mfa_enabled", label: "MFA Enabled" },
  { value: "mfa_disabled", label: "MFA Disabled" },
  { value: "api_key_created", label: "API Key Created" },
  { value: "api_key_revoked", label: "API Key Revoked" },
];

const SEVERITY_LEVELS = [
  { value: "all", label: "All Severities" },
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "error", label: "Error" },
];

export function UserActivityLogs({ userId }: { userId?: string }) {
  const { sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activityType, setActivityType] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query activity logs
  const { data: logs, isLoading, refetch } = useQuery(
    api.modules.platform.rbac.getUserActivityLogs,
    { 
      sessionToken: sessionToken || "",
      userId: userId,
      limit: 100,
      offset: 0
    },
    !!sessionToken
  );

  const getActionIcon = (action: string) => {
    switch (action) {
      case "login":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "logout":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "session_revoked":
      case "bulk_sessions_revoked":
        return <Shield className="h-4 w-4 text-orange-600" />;
      case "permission_changed":
      case "role_changed":
        return <User className="h-4 w-4 text-blue-600" />;
      case "account_created":
      case "invite_accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "account_suspended":
      case "account_deleted":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "invite_sent":
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    return ACTIVITY_TYPES.find(type => type.value === action)?.label || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-yellow-600" />;
      case "error":
        return <XCircle className="h-3 w-3 text-red-600" />;
      case "info":
      default:
        return <Activity className="h-3 w-3 text-blue-600" />;
    }
  };

  const getSeverityVariant = (severity?: string) => {
    switch (severity) {
      case "success":
        return "default";
      case "warning":
        return "secondary";
      case "error":
        return "destructive";
      case "info":
      default:
        return "outline";
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter logs based on search and filters
  const filteredLogs = logs?.filter(log => {
    const matchesSearch = !searchTerm || 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details?.targetUserId && log.details.targetUserId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (log.ipAddress && log.ipAddress.includes(searchTerm));

    const matchesType = activityType === "all" || log.action === activityType;
    const matchesSeverity = severity === "all" || log.severity === severity;

    return matchesSearch && matchesType && matchesSeverity;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activity Logs
              </CardTitle>
              <CardDescription>
                Track user activities and system events
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:w-80">
              <Select value={activityType} onValueChange={setActivityType}>
                <SelectTrigger>
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs?.length || 0} activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log._id} className="border rounded-lg p-4 space-y-3">
                  {/* Activity Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getActionIcon(log.action)}
                      <div>
                        <div className="font-medium">{getActionLabel(log.action)}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {log.severity && (
                        <Badge variant={getSeverityVariant(log.severity)} className="text-xs">
                          {getSeverityIcon(log.severity)}
                          <span className="ml-1">{log.severity}</span>
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Activity Details */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-sm space-y-1">
                        {Object.entries(log.details).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="font-medium text-muted-foreground">
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                            </span>
                            <span className="text-slate-700">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {log.ipAddress && (
                      <div className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        IP: {log.ipAddress}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
