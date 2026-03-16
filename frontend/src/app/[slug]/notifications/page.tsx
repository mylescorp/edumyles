"use client";

import { useMemo } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

export default function TenantNotificationsPage() {
  const { sessionToken, tenantId, isLoading: authLoading } = useAuth();

  const { data: notifications, isLoading: notificationsLoading } = useQuery(
    api.tenantNotifications.listMyTenantNotifications,
    {
      sessionToken: sessionToken || "",
      tenantId: tenantId || "",
      limit: 50,
    }
  );

  const { data: stats, isLoading: statsLoading } = useQuery(
    api.tenantNotifications.getMyTenantNotificationStats,
    {
      sessionToken: sessionToken || "",
      tenantId: tenantId || "",
    }
  );

  const markAsRead = useMutation(api.tenantNotifications.markTenantNotificationAsRead);

  const safeNotifications = useMemo(() => {
    return Array.isArray(notifications) ? notifications : [];
  }, [notifications]);

  const isLoading = authLoading || notificationsLoading || statsLoading;

  const handleMarkAsRead = async (notificationId: any) => {
    if (!sessionToken || !tenantId) return;

    try {
      await markAsRead({
        sessionToken,
        tenantId,
        notificationId,
      });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Notifications</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-semibold">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Unread</p>
            <p className="text-2xl font-semibold">{stats?.unread ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Read</p>
            <p className="text-2xl font-semibold">{stats?.read ?? 0}</p>
          </CardContent>
        </Card>
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
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium">{n.title}</h3>
                      <p className="text-sm text-muted-foreground">{n.body}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {!n.read && (
                      <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(n._id)}>
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
