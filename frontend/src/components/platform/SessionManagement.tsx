"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Monitor, Clock, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type SessionManagementProps = {
  userId?: string;
};

export function SessionManagement({ userId }: SessionManagementProps) {
  const { user, sessionToken, role } = useAuth();

  const isCurrentUser = !userId || user?._id === userId || user?.email === userId;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Session Management
          </CardTitle>
          <CardDescription>
            Current authenticated platform session details.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Viewer</p>
            <p className="font-medium">{user?.email ?? "Unknown user"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{role ?? "Unknown role"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Session token</p>
            <p className="font-mono text-xs text-muted-foreground">
              {sessionToken ? `${sessionToken.slice(0, 8)}...${sessionToken.slice(-6)}` : "Unavailable"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scope</p>
            <Badge variant="outline" className="mt-1">
              <Monitor className="mr-1 h-3 w-3" />
              {isCurrentUser ? "Current session" : "Viewing another user"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          Centralized WorkOS session listing and remote session revocation are not wired in this branch yet. This panel
          currently shows the authenticated session context only.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Security Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Use password reset to invalidate stale credentials.</p>
          <p>Suspending a platform user still blocks platform access at the RBAC layer.</p>
          <p>WorkOS session lifecycle management should be added server-side before exposing revoke controls in the UI.</p>
        </CardContent>
      </Card>
    </div>
  );
}
