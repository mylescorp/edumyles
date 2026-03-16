"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Settings, BarChart3, Users, Clock, MoreHorizontal, Filter } from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { platformNavItems } from "@/lib/routes";

// Mock data for now - will be replaced with Convex queries
const mockTasks = [
  {
    id: "1",
    title: "Setup authentication system",
    description: "Implement WorkOS authentication with proper session management",
    status: "Backlog",
    priority: "high",
    assignee: "John Doe",
    estimateMinutes: 240,
    loggedMinutes: 180,
    labels: ["backend", "auth"],
    dueDate: Date.now() + 86400000 * 3,
  },
  {
    id: "2", 
    title: "Create user dashboard",
    description: "Build responsive dashboard with key metrics",
    status: "In Progress",
    priority: "medium",
    assignee: "Jane Smith",
    estimateMinutes: 180,
    loggedMinutes: 120,
    labels: ["frontend", "ui"],
    dueDate: Date.now() + 86400000 * 2,
  },
  {
    id: "3",
    title: "Implement role-based access",
    description: "Add RBAC system with workspace and project scopes",
    status: "Review",
    priority: "high",
    assignee: "Mike Johnson",
    estimateMinutes: 300,
    loggedMinutes: 280,
    labels: ["backend", "security"],
    dueDate: Date.now() + 86400000,
  },
  {
    id: "4",
    title: "Add email notifications",
    description: "Setup email templates and notification queue",
    status: "Done",
    priority: "low",
    assignee: "Sarah Wilson",
    estimateMinutes: 120,
    loggedMinutes: 120,
    labels: ["notifications"],
    dueDate: Date.now() - 86400000,
  },
];

const columns = [
  { id: "backlog", title: "Backlog", status: "Backlog" },
  { id: "todo", title: "To Do", status: "To Do" },
  { id: "inprogress", title: "In Progress", status: "In Progress" },
  { id: "review", title: "Review", status: "Review" },
  { id: "done", title: "Done", status: "Done" },
];

function TaskCard({ task }: { task: any }) {
  const priorityColors = {
    urgent: "bg-red-100 text-red-800 border-red-200",
    high: "bg-orange-100 text-orange-800 border-orange-200", 
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
    low: "bg-green-100 text-green-800 border-green-200",
    none: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const getPriorityColor = (priority: string) => priorityColors[priority as keyof typeof priorityColors] || priorityColors.none;

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-move">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
              <Badge variant="secondary">{task.status}</Badge>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {task.description}
        </p>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-xs font-medium">
                {task.assignee?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <span className="text-muted-foreground">{task.assignee}</span>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>📊 {task.estimateMinutes / 60}h</span>
            <span>⏱️ {task.loggedMinutes / 60}h</span>
          </div>
        </div>
        {task.labels && task.labels.length > 0 && (
          <div className="flex gap-1 mt-2">
            {task.labels.map((label: string) => (
              <Badge key={label} variant="outline" className="text-xs">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ProjectPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;

  const [tasks, setTasks] = useState(mockTasks);

  // Group tasks by status
  const getTasksForColumn = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  return (
    <DashboardLayout navItems={platformNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href={`/platform/pm/${workspaceSlug}`}>
                <Button variant="ghost" size="sm">
                  ← Back to Workspace
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Engineering Workspace</h1>
                <p className="text-muted-foreground mt-1">
                  Manage development tasks and track progress
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTasksForColumn("In Progress").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getTasksForColumn("Done").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hours Logged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(tasks.reduce((sum, task) => sum + task.loggedMinutes, 0) / 60)}h
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[600px]">
          {columns.map((column) => (
            <Card key={column.id} className="flex flex-col">
              <CardHeader className="pb-3 bg-muted/50">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {getTasksForColumn(column.status).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-3 overflow-y-auto">
                {getTasksForColumn(column.status).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {getTasksForColumn(column.status).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-sm">No tasks in {column.title.toLowerCase()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
