"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Settings, BarChart3, Users, Clock } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

type WorkspaceSummary = {
  _id: string;
  slug: string;
  icon?: string;
  name: string;
  type: string;
  projectCount: number;
  defaultStatuses?: string[];
  customFieldSchema?: unknown[];
};

export default function PMPage() {
  const { sessionToken, isLoading: authLoading } = useAuth();

  const workspaces = useQuery(
    api.modules.pm.workspaces.getWorkspaces,
    sessionToken ? { sessionToken } : "skip"
  ) as WorkspaceSummary[] | undefined;

  const pmStats = useQuery(
    api.modules.pm.workspaces.getPmStats,
    sessionToken ? { sessionToken } : "skip"
  );

  if (authLoading || (sessionToken && workspaces === undefined)) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  if (!sessionToken) {
    return (
      <>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sign in with your normal platform session to access project management.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Project Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage engineering work, school onboarding, bug tracking, and OKRs in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workspaces?.reduce((sum: number, ws: WorkspaceSummary) => sum + ws.projectCount, 0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">Across all workspaces</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pmStats?.activeTasks ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">In progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pmStats?.teamMembers ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">Active contributors</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {pmStats?.hoursLoggedThisMonth?.toLocaleString() ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Workspaces Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces?.map((workspace: WorkspaceSummary) => (
            <Card 
              key={workspace._id} 
              className="hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{workspace.icon}</div>
                    <div>
                      <CardTitle className="text-lg">{workspace.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {workspace.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projects</span>
                    <span className="font-semibold">{workspace.projectCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Statuses</span>
                    <span className="font-semibold">{workspace.defaultStatuses?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Custom Fields</span>
                    <span className="font-semibold">{workspace.customFieldSchema?.length || 0}</span>
                  </div>
                </div>
                <Link 
                  href={`/platform/pm/${workspace.slug}`}
                  className="block mt-4"
                >
                  <Button className="w-full">
                    Open Workspace
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {(!workspaces || workspaces.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">No Workspaces Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Get started by creating your first workspace to organize projects and tasks.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Workspace
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
