"use client";

import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";

type ProjectSummary = {
  _id: string;
  name: string;
  status: string;
  description?: string;
  taskCount: number;
  progress: number;
  totalEstimatedMinutes?: number;
  totalLoggedMinutes?: number;
};

export default function WorkspacePage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const { sessionToken, isLoading: authLoading } = useAuth();

  const workspace = useQuery(
    api.modules.pm.workspaces.getWorkspaceBySlug,
    sessionToken ? { slug: workspaceSlug, sessionToken } : "skip"
  );

  const projects = useQuery(
    api.modules.pm.projects.getProjects,
    sessionToken && workspace
      ? {
          workspaceId: workspace._id,
          sessionToken,
        }
      : "skip"
  );

  if (authLoading || (sessionToken && workspace === undefined)) {
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
              Sign in with your normal platform session to access this workspace.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!workspace) {
    return (
      <>
        <Card className="max-w-xl mx-auto mt-8">
          <CardHeader>
            <CardTitle>Workspace Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The requested workspace could not be loaded.
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
          <div className="flex items-center gap-4">
            <div className="text-2xl">{workspace.icon}</div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{workspace.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{workspace.type}</Badge>
                <span className="text-sm text-muted-foreground">
                  {projects?.length || 0} projects
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-4 border-b border-border">
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              true
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Kanban Board
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              false
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            List View
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              false
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Timeline
          </button>
          <button
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              false
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects?.map((project: ProjectSummary) => (
            <Card key={project._id} className="hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <Badge 
                    variant={project.status === "active" ? "default" : "secondary"}
                  >
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tasks:</span>
                      <span className="ml-2 font-semibold">{project.taskCount}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <span className="ml-2 font-semibold">{Math.round(project.progress)}%</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Est. Hours:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round((project.totalEstimatedMinutes || 0) / 60)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Logged:</span>
                      <span className="ml-2 font-semibold">
                        {Math.round((project.totalLoggedMinutes || 0) / 60)}
                      </span>
                    </div>
                  </div>
                </div>
                <Link 
                  href={`/platform/pm/${workspaceSlug}/${project._id}`}
                  className="block mt-4"
                >
                  <Button className="w-full">
                    Open Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {(!projects || projects.length === 0) && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first project to start organizing tasks and tracking progress.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
