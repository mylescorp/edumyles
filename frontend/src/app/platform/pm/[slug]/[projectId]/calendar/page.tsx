"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Plus, Settings, Filter, ChevronLeft, ChevronRight,
  Calendar as CalendarIcon, Clock, Users
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
    dueDate: new Date(Date.now() + 86400000 * 3),
    labels: ["backend", "auth"],
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
    dueDate: new Date(Date.now() + 86400000 * 2),
    labels: ["frontend", "ui"],
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
    dueDate: new Date(Date.now() + 86400000),
    labels: ["backend", "security"],
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
    dueDate: new Date(Date.now() - 86400000),
    labels: ["notifications"],
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
    dueDate: new Date(Date.now() + 86400000 * 5),
    labels: ["backend", "performance"],
  },
  {
    id: "6",
    title: "Design new landing page",
    description: "Create modern, responsive landing page with better conversion",
    status: "To Do",
    priority: "high",
    assignee: "Alice Green",
    assigneeId: "user6",
    estimateMinutes: 200,
    loggedMinutes: 0,
    dueDate: new Date(Date.now() + 86400000 * 7),
    labels: ["frontend", "design"],
  },
];

const priorityColors = {
  urgent: "bg-red-100 text-red-800 border-red-200",
  high: "bg-orange-100 text-orange-800 border-orange-200", 
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
  none: "bg-gray-100 text-gray-800 border-gray-200",
};

const statusColors = {
  "To Do": "bg-blue-100 text-blue-800",
  "In Progress": "bg-yellow-100 text-yellow-800",
  "Review": "bg-orange-100 text-orange-800",
  "Done": "bg-green-100 text-green-800",
  "Backlog": "bg-gray-100 text-gray-800",
};

function CalendarView({ tasks }: { tasks: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Get calendar days for current month
  const getCalendarDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  // Get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  // Navigate calendar
  const navigateCalendar = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
    } else if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(newDate);
  };

  const calendarDays = getCalendarDays(currentDate);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="sm" onClick={() => navigateCalendar("prev")}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <h3 className="text-lg font-semibold">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex gap-2 justify-center mt-2">
            <Button
              variant={viewMode === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("week")}
            >
              Week
            </Button>
            <Button
              variant={viewMode === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigateCalendar("next")}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="border border-border rounded-lg overflow-hidden">
        {/* Week day headers */}
        <div className="grid grid-cols-7 bg-muted/50">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium border-b border-border">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dayTasks = date ? getTasksForDate(date) : [];
            const isToday = date?.toDateString() === new Date().toDateString();
            const isSelected = selectedDate?.toDateString() === date?.toDateString();
            const isCurrentMonth = date?.getMonth() === currentDate.getMonth();

            return (
              <div
                key={index}
                className={`
                  min-h-[100px] p-2 border-r border-b border-border
                  ${!isCurrentMonth ? 'bg-muted/25' : 'bg-background'}
                  ${isToday ? 'bg-primary/10' : ''}
                  ${isSelected ? 'bg-primary/20 ring-2 ring-primary' : ''}
                  hover:bg-muted/50 cursor-pointer transition-colors
                `}
                onClick={() => date && setSelectedDate(date)}
              >
                <div className="text-sm font-medium mb-1">
                  {date?.getDate()}
                </div>
                
                {/* Task indicators */}
                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task, taskIndex) => (
                    <div
                      key={task.id}
                      className={`
                        text-xs p-1 rounded truncate border
                        ${priorityColors[task.priority] || priorityColors.none}
                      `}
                      title={task.title}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate flex-1">
                          {task.title.length > 15 ? task.title.substring(0, 15) + "..." : task.title}
                        </span>
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center ml-1 flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">
                            {task.assignee?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {dayTasks.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Tasks for {selectedDate.toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getTasksForDate(selectedDate).map(task => (
                <div key={task.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium">
                      {task.assignee?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{task.title}</h4>
                      <Badge variant="outline" className={priorityColors[task.priority]}>
                        {task.priority}
                      </Badge>
                      <Badge variant={statusColors[task.status] as any}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>📊 {task.estimateMinutes / 60}h</span>
                        <span>⏱️ {task.loggedMinutes / 60}h</span>
                      </div>
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex gap-1">
                          {task.labels.map((label: string) => (
                            <Badge key={label} variant="secondary" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {getTasksForDate(selectedDate).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No tasks scheduled for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;

  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");

  // Filter tasks
  const filteredTasks = mockTasks.filter(task => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterAssignee && task.assignee !== filterAssignee) return false;
    return true;
  });

  const uniqueStatuses = [...new Set(mockTasks.map(task => task.status))];
  const uniqueAssignees = [...new Set(mockTasks.map(task => task.assignee))];

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
                Calendar view with task scheduling and due dates
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
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}/timeline`}>
              <Button variant="outline" size="sm">
                📊 Timeline
              </Button>
            </Link>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Assignee</label>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                >
                  <option value="">All Assignees</option>
                  {uniqueAssignees.map(assignee => (
                    <option key={assignee} value={assignee}>{assignee}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredTasks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTasks.filter(task => {
                  const dueDate = new Date(task.dueDate);
                  const today = new Date();
                  const weekFromNow = new Date(today.getTime() + 7 * 86400000);
                  return dueDate <= weekFromNow && dueDate >= today;
                }).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {filteredTasks.filter(task => new Date(task.dueDate) < new Date()).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredTasks.filter(task => task.status === "Done").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card>
          <CardContent className="p-0">
            <CalendarView tasks={filteredTasks} />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
