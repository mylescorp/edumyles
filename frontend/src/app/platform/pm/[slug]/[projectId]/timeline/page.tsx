"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, Settings, Filter, MoreHorizontal, 
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut
} from "lucide-react";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { platformNavItems } from "@/lib/routes";

// Mock data for now - will be replaced with Convex queries
const mockTasks = [
  {
    id: "1",
    title: "Setup authentication system",
    description: "Implement WorkOS authentication with proper session management",
    status: "In Progress",
    priority: "high",
    assignee: "John Doe",
    assigneeId: "user1",
    estimateMinutes: 240,
    loggedMinutes: 180,
    startDate: new Date(Date.now() - 86400000 * 5),
    dueDate: new Date(Date.now() + 86400000 * 3),
    dependencies: [],
    projectId: "proj1",
    epicId: "epic1",
  },
  {
    id: "2", 
    title: "Create user dashboard",
    description: "Build responsive dashboard with key metrics",
    status: "In Progress",
    priority: "medium",
    assignee: "Jane Smith",
    assigneeId: "user2",
    estimateMinutes: 180,
    loggedMinutes: 120,
    startDate: new Date(Date.now() - 86400000 * 4),
    dueDate: new Date(Date.now() + 86400000 * 2),
    dependencies: ["1"],
    projectId: "proj1",
    epicId: "epic1",
  },
  {
    id: "3",
    title: "Implement role-based access",
    description: "Add RBAC system with workspace and project scopes",
    status: "Review",
    priority: "high",
    assignee: "Mike Johnson",
    assigneeId: "user3",
    estimateMinutes: 300,
    loggedMinutes: 280,
    startDate: new Date(Date.now() - 86400000 * 3),
    dueDate: new Date(Date.now() + 86400000),
    dependencies: ["1", "2"],
    projectId: "proj1",
    epicId: "epic1",
  },
  {
    id: "4",
    title: "Add email notifications",
    description: "Setup email templates and notification queue",
    status: "Done",
    priority: "low",
    assignee: "Sarah Wilson",
    assigneeId: "user4",
    estimateMinutes: 120,
    loggedMinutes: 120,
    startDate: new Date(Date.now() - 86400000 * 10),
    dueDate: new Date(Date.now() - 86400000),
    dependencies: [],
    projectId: "proj1",
    epicId: "epic2",
  },
  {
    id: "5",
    title: "Optimize database queries",
    description: "Improve performance of slow database operations",
    status: "To Do",
    priority: "medium",
    assignee: "Tom Brown",
    assigneeId: "user5",
    estimateMinutes: 150,
    loggedMinutes: 0,
    startDate: new Date(Date.now() - 86400000 * 2),
    dueDate: new Date(Date.now() + 86400000 * 5),
    dependencies: ["1"],
    projectId: "proj1",
    epicId: "epic2",
  },
];

const mockEpics = [
  {
    id: "epic1",
    title: "Authentication & Security",
    color: "#3b82f6",
  },
  {
    id: "epic2", 
    title: "Performance & Optimization",
    color: "#10b981",
  },
];

const priorityColors = {
  urgent: "#ef4444",
  high: "#f97316", 
  medium: "#f59e0b",
  low: "#22c55e",
  none: "#6b7280",
};

const statusColors = {
  "To Do": "#94a3b8",
  "In Progress": "#3b82f6",
  "Review": "#f59e0b",
  "Done": "#22c55e",
  "Backlog": "#6b7280",
};

function GanttChart({ tasks, epics }: { tasks: any[], epics: any[] }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Calculate timeline dimensions
  const timelineStart = useMemo(() => {
    const allDates = tasks.flatMap(task => [
      task.startDate.getTime(),
      task.dueDate.getTime()
    ]);
    return new Date(Math.min(...allDates) - 86400000 * 2); // 2 days padding
  }, [tasks]);

  const timelineEnd = useMemo(() => {
    const allDates = tasks.flatMap(task => [
      task.startDate.getTime(),
      task.dueDate.getTime()
    ]);
    return new Date(Math.max(...allDates) + 86400000 * 2); // 2 days padding
  }, [tasks]);

  const totalDays = Math.ceil((timelineEnd.getTime() - timelineStart.getTime()) / (86400000));

  // Calculate task positions
  const taskBars = useMemo(() => {
    return tasks.map((task, index) => {
      const startOffset = Math.max(0, (task.startDate.getTime() - timelineStart.getTime()) / (86400000));
      const duration = Math.max(1, (task.dueDate.getTime() - task.startDate.getTime()) / (86400000));
      
      return {
        ...task,
        x: startOffset * 40 * zoomLevel + scrollOffset,
        y: index * 60 + 40,
        width: duration * 40 * zoomLevel,
        height: 40,
        startOffset,
        duration,
      };
    });
  }, [tasks, timelineStart, zoomLevel, scrollOffset]);

  // Calculate epic positions
  const epicBars = useMemo(() => {
    return epics.map((epic, index) => {
      const epicTasks = tasks.filter(task => task.epicId === epic.id);
      if (epicTasks.length === 0) return null;
      
      const epicStart = new Date(Math.min(...epicTasks.map(task => task.startDate.getTime())));
      const epicEnd = new Date(Math.max(...epicTasks.map(task => task.dueDate.getTime())));
      
      const startOffset = Math.max(0, (epicStart.getTime() - timelineStart.getTime()) / (86400000));
      const duration = Math.max(1, (epicEnd.getTime() - epicStart.getTime()) / (86400000));
      
      return {
        ...epic,
        x: startOffset * 40 * zoomLevel + scrollOffset,
        y: index * 80 + 20,
        width: duration * 40 * zoomLevel,
        height: 60,
        startOffset,
        duration,
        tasks: epicTasks,
      };
    }).filter(Boolean);
  }, [tasks, epics, timelineStart, zoomLevel, scrollOffset]);

  // Generate grid lines
  const gridLines = useMemo(() => {
    const lines = [];
    for (let i = 0; i <= totalDays; i += 7) { // Weekly grid lines
      const x = i * 40 * zoomLevel + scrollOffset;
      lines.push(
        <line
          key={`grid-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={500}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );
    }
    return lines;
  }, [totalDays, zoomLevel, scrollOffset]);

  const handleZoomIn = () => setZoomLevel(Math.min(3, zoomLevel + 0.25));
  const handleZoomOut = () => setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
  const handleScrollLeft = () => setScrollOffset(Math.min(0, scrollOffset + 100));
  const handleScrollRight = () => setScrollOffset(Math.max(-totalDays * 40 * zoomLevel, scrollOffset - 100));

  return (
    <div className="relative overflow-hidden">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        <Button size="sm" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium px-2">{Math.round(zoomLevel * 100)}%</span>
        <Button size="sm" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>

      {/* SVG Gantt Chart */}
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '500px' }}>
        <svg 
          width={totalDays * 40 * zoomLevel + 200}
          height={Math.max(300, Math.max(taskBars.length * 60, epicBars.length * 80) + 100)}
          className="border border-border"
        >
          {/* Grid */}
          {gridLines}

          {/* Today line */}
          <line
            x1={((new Date().getTime() - timelineStart.getTime()) / (86400000)) * 40 * zoomLevel + scrollOffset}
            y1={0}
            x2={((new Date().getTime() - timelineStart.getTime()) / (86400000)) * 40 * zoomLevel + scrollOffset}
            y2={500}
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Epic bars */}
          {epicBars.map((epic: any) => (
            <g key={epic.id}>
              <rect
                x={epic.x}
                y={epic.y}
                width={epic.width}
                height={epic.height}
                fill={epic.color}
                fillOpacity="0.1"
                stroke={epic.color}
                strokeWidth="2"
                rx="4"
              />
              <text
                x={epic.x + 10}
                y={epic.y + 25}
                fontSize="12"
                fontWeight="600"
                fill={epic.color}
              >
                {epic.title}
              </text>
            </g>
          ))}

          {/* Task bars */}
          {taskBars.map((task: any) => (
            <g key={task.id}>
              {/* Task bar */}
              <rect
                x={task.x}
                y={task.y}
                width={task.width}
                height={task.height}
                fill={statusColors[task.status] || "#94a3b8"}
                stroke={priorityColors[task.priority] || "#6b7280"}
                strokeWidth="2"
                rx="4"
              />
              
              {/* Progress indicator */}
              <rect
                x={task.x}
                y={task.y}
                width={task.width * (task.loggedMinutes / task.estimateMinutes)}
                height={task.height}
                fill="#1f2937"
                fillOpacity="0.3"
                rx="4"
              />

              {/* Task title */}
              <text
                x={task.x + 8}
                y={task.y + 25}
                fontSize="12"
                fontWeight="500"
                fill="white"
              >
                {task.title.length > 20 ? task.title.substring(0, 20) + "..." : task.title}
              </text>

              {/* Assignee avatar */}
              <circle
                cx={task.x + task.width - 20}
                cy={task.y + 20}
                r="8"
                fill="#3b82f6"
              />
              <text
                x={task.x + task.width - 20}
                y={task.y + 25}
                fontSize="10"
                fontWeight="600"
                fill="white"
                textAnchor="middle"
              >
                {task.assignee?.split(' ').map(n => n[0]).join('').toUpperCase()}
              </text>
            </g>
          ))}

          {/* Dependencies */}
          {taskBars.map((task: any) => {
            if (task.dependencies.length === 0) return null;
            
            return task.dependencies.map((depId: string) => {
              const depTask = taskBars.find(t => t.id === depId);
              if (!depTask) return null;
              
              return (
                <line
                  key={`dep-${task.id}-${depId}`}
                  x1={task.x + task.width}
                  y1={task.y + 20}
                  x2={depTask.x}
                  y2={depTask.y + 20}
                  stroke="#6b7280"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            });
          })}
        </svg>
      </div>

      {/* Scroll controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex gap-2 bg-white rounded-lg shadow-lg p-2">
        <Button size="sm" variant="outline" onClick={handleScrollLeft}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleScrollRight}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function TimelinePage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;

  return (
    <DashboardLayout navItems={platformNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="ghost" size="sm">
                ← Back to Project
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Engineering Workspace</h1>
              <p className="text-muted-foreground mt-1">
                Timeline/Gantt chart view with task dependencies
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="outline" size="sm">
                📋 Kanban
              </Button>
            </Link>
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/list`}>
              <Button variant="outline" size="sm">
                📝 List
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              📅 Calendar
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors["To Do"] }}></div>
                <span>To Do</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors["In Progress"] }}></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors["Review"] }}></div>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: statusColors["Done"] }}></div>
                <span>Done</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.urgent }}></div>
                <span>Urgent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.high }}></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.medium }}></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: priorityColors.low }}></div>
                <span>Low</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gantt Chart */}
        <Card>
          <CardContent className="p-0">
            <GanttChart tasks={mockTasks} epics={mockEpics} />
          </CardContent>
        </Card>

        {/* Task Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockTasks.filter(t => t.status === "In Progress").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {mockTasks.filter(t => t.status === "Done").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Timeline Span</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">~2 weeks</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
