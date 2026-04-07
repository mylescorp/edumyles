"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  Settings, 
  Eye, 
  Edit, 
  Trash2, 
  Key, 
  Mail, 
  Calendar, 
  FileText, 
  Download, 
  Upload, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ExternalLink, 
  UserCheck, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Filter, 
  Search, 
  MoreHorizontal, 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { cn } from "@/lib/utils";

interface UsersNavigationRailProps {
  sessionToken?: string;
  className?: string;
}

export function UsersNavigationRail({ sessionToken, className }: UsersNavigationRailProps) {
  const { can } = usePlatformPermissions();
  const { data: currentUser } = useAuth();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Users & Staff</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* User Management */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">User Management</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/platform/users" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">All Users</div>
                      <div className="text-sm text-muted-foreground">View and manage platform users</div>
                    </div>
                  </Link>
                </Button>
                {can("platform_users.invite") && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/platform/users/invite" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Invite Staff</div>
                        <div className="text-sm text-muted-foreground">Send invitations to platform users</div>
                      </div>
                    </Link>
                  </Button>
                )}
                {can("platform_users.view") && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/platform/users/sessions" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Sessions</div>
                        <div className="text-sm text-muted-foreground">Manage user sessions and devices</div>
                      </div>
                    </Link>
                  </Button>
                )}
                {can("platform_users.view") && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/platform/users/activity" className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Activity Logs</div>
                        <div className="text-sm text-muted-foreground">View user activity and audit trails</div>
                      </div>
                    </Link>
                  </Button>
                )}
                {can("platform_users.view") && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    asChild
                  >
                    <Link href="/platform/users/roles" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">Roles</div>
                        <div className="text-sm text-muted-foreground">Manage platform roles and permissions</div>
                      </div>
                    </Link>
                  </Button>
                )}
              </div>

          {/* Admin Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-3">Platform Administration</h3>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {can("platform_admin.view") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/platform/admin" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Admin</div>
                      <div className="text-sm text-muted-foreground">Platform administration and settings</div>
                    </div>
                  </Link>
                </Button>
              )}
              {can("platform_users.edit_role") && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  asChild
                >
                  <Link href="/platform/users/permissions" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    <div className="text-left">
                      <div className="font-medium">Permissions</div>
                      <div className="text-sm text-muted-foreground">Manage user permissions and access control</div>
                    </div>
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          {currentUser && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open('/platform/users/invite', '_blank')}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Staff
                </Button>
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => window.open('/platform/admin', '_blank')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}
