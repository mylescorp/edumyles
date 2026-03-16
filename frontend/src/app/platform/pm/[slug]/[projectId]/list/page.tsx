"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Plus, Settings, Filter, MoreHorizontal, 
  ChevronUp, ChevronDown, Search, Edit2, Save, X
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
    status: "Backlog",
    priority: "high",
    assignee: "John Doe",
    assigneeId: "user1",
    estimateMinutes: 240,
    loggedMinutes: 180,
    labels: ["backend", "auth"],
    dueDate: new Date(Date.now() + 86400000 * 3),
    createdAt: new Date(Date.now() - 86400000 * 5),
    project: "Engineering Workspace"
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
    labels: ["frontend", "ui"],
    dueDate: new Date(Date.now() + 86400000 * 2),
    createdAt: new Date(Date.now() - 86400000 * 4),
    project: "Engineering Workspace"
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
    labels: ["backend", "security"],
    dueDate: new Date(Date.now() + 86400000),
    createdAt: new Date(Date.now() - 86400000 * 3),
    project: "Engineering Workspace"
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
    labels: ["notifications"],
    dueDate: new Date(Date.now() - 86400000),
    createdAt: new Date(Date.now() - 86400000 * 10),
    project: "Engineering Workspace"
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
    labels: ["backend", "performance"],
    dueDate: new Date(Date.now() + 86400000 * 5),
    createdAt: new Date(Date.now() - 86400000 * 2),
    project: "Engineering Workspace"
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
  "Backlog": "secondary",
  "To Do": "outline",
  "In Progress": "default",
  "Review": "default",
  "Done": "default",
};

function EditableCell({ 
  value, 
  onChange, 
  type = "text",
  options = [],
  isEditing = false,
  onEditToggle 
}: {
  value: any;
  onChange: (value: any) => void;
  type?: "text" | "select" | "number";
  options?: string[];
  isEditing?: boolean;
  onEditToggle?: () => void;
}) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(editValue);
    onEditToggle?.();
  };

  const handleCancel = () => {
    setEditValue(value);
    onEditToggle?.();
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === "select" ? (
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full px-2 py-1 border rounded text-sm"
            autoFocus
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            type={type}
            className="w-full px-2 py-1 text-sm"
            autoFocus
          />
        )}
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
      onClick={onEditToggle}
    >
      {type === "select" ? (
        <Badge variant="outline" className="text-xs">
          {value}
        </Badge>
      ) : (
        <span className="text-sm">{value}</span>
      )}
    </div>
  );
}

export default function ListViewPage() {
  const params = useParams();
  const workspaceSlug = params.slug as string;
  const projectId = params.projectId as string;

  const [tasks, setTasks] = useState(mockTasks);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Sort and filter tasks
  const filteredAndSortedTasks = tasks
    .filter(task => {
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterAssignee && task.assignee !== filterAssignee) return false;
      return true;
    })
    .sort((a, b) => {
      let aValue = a[sortField as keyof typeof a];
      let bValue = b[sortField as keyof typeof b];
      
      if (sortField === "dueDate" || sortField === "createdAt") {
        aValue = new Date(aValue as string).getTime();
        bValue = new Date(bValue as string).getTime();
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleCellEdit = (taskId: string, field: string, value: any) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, [field]: value }
        : task
    ));
  };

  const uniqueStatuses = [...new Set(tasks.map(task => task.status))];
  const uniqueAssignees = [...new Set(tasks.map(task => task.assignee))];

  return (
    <DashboardLayout navItems={platformNavItems}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="ghost" size="sm">
                ← Back to Kanban
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Engineering Workspace</h1>
              <p className="text-muted-foreground mt-1">
                List view with inline editing capabilities
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/platform/pm/${workspaceSlug}/${projectId}`}>
              <Button variant="outline" size="sm">
                📋 Kanban
              </Button>
            </Link>
            <Button variant="outline" size="sm">
              📊 Timeline
            </Button>
            <Button variant="outline" size="sm">
              📅 Calendar
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    className="pl-10"
                  />
                </div>
              </div>
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

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1">
                      Title
                      {sortField === "title" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortField === "status" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("priority")}
                  >
                    <div className="flex items-center gap-1">
                      Priority
                      {sortField === "priority" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("assignee")}
                  >
                    <div className="flex items-center gap-1">
                      Assignee
                      {sortField === "assignee" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1">
                      Due Date
                      {sortField === "dueDate" && (
                        sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTasks.map((task) => (
                  <TableRow key={task.id} className="hover:bg-muted/25">
                    <TableCell className="font-medium">
                      <EditableCell
                        value={task.title}
                        onChange={(value) => handleCellEdit(task.id, "title", value)}
                        isEditing={editingCell === `${task.id}-title`}
                        onEditToggle={() => setEditingCell(
                          editingCell === `${task.id}-title` ? null : `${task.id}-title`
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={task.status}
                        onChange={(value) => handleCellEdit(task.id, "status", value)}
                        type="select"
                        options={uniqueStatuses}
                        isEditing={editingCell === `${task.id}-status`}
                        onEditToggle={() => setEditingCell(
                          editingCell === `${task.id}-status` ? null : `${task.id}-status`
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={task.priority}
                        onChange={(value) => handleCellEdit(task.id, "priority", value)}
                        type="select"
                        options={["urgent", "high", "medium", "low", "none"]}
                        isEditing={editingCell === `${task.id}-priority`}
                        onEditToggle={() => setEditingCell(
                          editingCell === `${task.id}-priority` ? null : `${task.id}-priority`
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {task.assignee?.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm">{task.assignee}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {task.dueDate.toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>📊 {task.estimateMinutes / 60}h</span>
                            <span>⏱️ {task.loggedMinutes / 60}h</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(task.loggedMinutes / task.estimateMinutes) * 100}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round((task.loggedMinutes / task.estimateMinutes) * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Empty State */}
        {filteredAndSortedTasks.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Try adjusting your filters or create a new task.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
