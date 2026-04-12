"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Activity, Search, RefreshCw, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type PermissionAuditEntry = {
  _id: string;
  targetUserId: string;
  changedBy: string;
  changeType: string;
  previousValue: string;
  newValue: string;
  reason: string;
  createdAt: number;
};

export function UserActivityLogs({ userId }: { userId?: string }) {
  const { sessionToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: logs, isLoading } = useQuery(
    api.modules.platform.rbac.getPermissionAuditLog,
    {
      sessionToken: sessionToken || "",
      targetUserId: userId,
    },
    !!sessionToken
  );

  const filteredLogs = useMemo(() => {
    const entries = (logs as PermissionAuditEntry[] | undefined) ?? [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return entries;

    return entries.filter((entry) =>
      [entry.changeType, entry.reason, entry.changedBy, entry.targetUserId].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  }, [logs, searchTerm]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Permission Activity
          </CardTitle>
          <CardDescription>
            Detailed RBAC and access-control changes recorded for this user.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search permission changes..."
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Changes</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} logged permission and scope changes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log._id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{log.changeType.replace(/_/g, " ")}</Badge>
                        <span className="text-sm text-muted-foreground">by {log.changedBy}</span>
                      </div>
                      <p className="text-sm font-medium">{log.reason}</p>
                      <div className="grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                        <div>
                          <span className="font-medium text-foreground">Before:</span> {log.previousValue}
                        </div>
                        <div>
                          <span className="font-medium text-foreground">After:</span> {log.newValue}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No permission activity has been recorded for this user yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
