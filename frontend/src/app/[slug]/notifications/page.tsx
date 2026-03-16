"use client";

import { useMemo } from "react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function TenantNotificationsPage() {
  const { sessionToken } = useAuth();

  const { data: notifications, isLoading } = useQuery(
    api.platform.communications.queries.listTenantNotifications,
    { sessionToken: sessionToken || "", limit: 50 }
  );

  const safeNotifications = useMemo(() => {
    return Array.isArray(notifications) ? notifications : [];
  }, [notifications]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Notifications</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Messages</CardTitle>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          ) : safeNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications available.</p>
          ) : (
            <div className="space-y-4">
              {safeNotifications.map((n: any) => (
                <div
                  key={n._id}
                  className={`p-4 rounded-md border ${n.read ? "bg-background" : "bg-muted"}`}
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{n.title}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-sm mt-2 text-muted-foreground">{n.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
