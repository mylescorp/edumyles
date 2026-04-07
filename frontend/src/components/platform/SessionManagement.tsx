"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  Clock, 
  LogOut, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
    device: string;
    browser: string;
    os: string;
  };
  isActive: boolean;
  lastActivity: number;
  createdAt: number;
  expiresAt: number;
  isCurrentSession: boolean;
}

export function SessionManagement() {
  const { sessionToken, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Query user sessions
  const { data: sessions, isLoading, refetch } = useQuery(
    api.modules.platform.rbac.getUserSessions,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  // Mutation to revoke session
  const revokeSession = useMutation(api.modules.platform.rbac.revokeSession);

  // Mutation to revoke all other sessions
  const revokeAllOtherSessions = useMutation(api.modules.platform.rbac.revokeAllOtherSessions);

  const getDeviceIcon = (device: string) => {
    switch (device.toLowerCase()) {
      case 'mobile':
      case 'smartphone':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Tablet className="h-4 w-4" />;
      case 'desktop':
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getSessionStatus = (session: Session) => {
    if (!session.isActive) {
      return { status: 'expired', color: 'bg-gray-100 text-gray-800', icon: <XCircle className="h-3 w-3" /> };
    }
    if (session.isCurrentSession) {
      return { status: 'current', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="h-3 w-3" /> };
    }
    const now = Date.now();
    const timeUntilExpiry = session.expiresAt - now;
    if (timeUntilExpiry < 24 * 60 * 60 * 1000) { // Less than 24 hours
      return { status: 'expiring-soon', color: 'bg-yellow-100 text-yellow-800', icon: <AlertTriangle className="h-3 w-3" /> };
    }
    return { status: 'active', color: 'bg-blue-100 text-blue-800', icon: <CheckCircle className="h-3 w-3" /> };
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!sessionToken) return;

    try {
      await revokeSession({ sessionToken, sessionId });
      toast.success("Session revoked successfully");
      refetch();
    } catch (error) {
      console.error("Failed to revoke session:", error);
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    if (!sessionToken) return;

    try {
      await revokeAllOtherSessions({ sessionToken });
      toast.success("All other sessions revoked successfully");
      refetch();
    } catch (error) {
      console.error("Failed to revoke sessions:", error);
      toast.error("Failed to revoke sessions");
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Session Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSessions = sessions?.filter(s => s.isActive) || [];
  const otherActiveSessions = activeSessions.filter(s => !s.isCurrentSession);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Session Management
              </CardTitle>
              <CardDescription>
                Manage your active sessions across devices
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{activeSessions.length}</div>
              <div className="text-sm text-muted-foreground">Active Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{otherActiveSessions.length}</div>
              <div className="text-sm text-muted-foreground">Other Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {sessions?.filter(s => !s.isActive).length || 0}
              </div>
              <div className="text-sm text-muted-foreground">Expired Sessions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Actions */}
      {otherActiveSessions.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                You have {otherActiveSessions.length} active session{otherActiveSessions.length > 1 ? 's' : ''} on other device{otherActiveSessions.length > 1 ? 's' : ''}.
              </span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevokeAllOtherSessions}
              >
                Revoke All Other Sessions
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Sessions</CardTitle>
          <CardDescription>
            Your session history across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {sessions?.map((session) => {
                const status = getSessionStatus(session);
                const lastActivity = formatDistanceToNow(new Date(session.lastActivity), { addSuffix: true });
                const created = formatDistanceToNow(new Date(session.createdAt), { addSuffix: true });
                const expires = formatDistanceToNow(new Date(session.expiresAt), { addSuffix: true });

                return (
                  <div key={session.id} className="border rounded-lg p-4 space-y-3">
                    {/* Session Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.deviceInfo.device)}
                        <div>
                          <div className="font-medium">{session.deviceInfo.device}</div>
                          <div className="text-sm text-muted-foreground">
                            {session.deviceInfo.browser} on {session.deviceInfo.os}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={status.color}>
                          {status.icon}
                          <span className="ml-1">
                            {session.isCurrentSession ? 'Current Session' : 
                             status.status === 'expired' ? 'Expired' :
                             status.status === 'expiring-soon' ? 'Expires Soon' : 'Active'}
                          </span>
                        </Badge>
                        {session.isActive && !session.isCurrentSession && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Session Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Globe className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">IP:</span>
                          <span>{session.deviceInfo.ip}</span>
                        </div>
                        {session.deviceInfo.location && (
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Location:</span>
                            <span>{session.deviceInfo.location}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Last active:</span>
                          <span>{lastActivity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Created:</span>
                          <span>{created}</span>
                        </div>
                        {session.isActive && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Expires:</span>
                            <span>{expires}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* User Agent */}
                    <div className="text-xs text-muted-foreground font-mono bg-slate-50 p-2 rounded">
                      {session.deviceInfo.userAgent}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
