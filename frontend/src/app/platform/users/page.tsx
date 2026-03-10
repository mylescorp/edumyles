"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Settings,
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  UserPlus,
  Lock,
  Unlock,
  Key,
  Activity,
  LogOut
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "super_admin" | "admin" | "manager" | "agent" | "viewer";
  status: "active" | "inactive" | "suspended" | "pending";
  tenantId?: string;
  tenantName?: string;
  department?: string;
  location?: string;
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  permissions: string[];
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  profilePicture?: string;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: number;
}

interface ActivityLog {
  _id: string;
  userId: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: number;
}

const mockUsers: User[] = [
  {
    _id: "1",
    firstName: "Michael",
    lastName: "Chen",
    email: "michael.chen@edumyles.com",
    phone: "+254 712 345 678",
    role: "super_admin",
    status: "active",
    department: "Management",
    location: "Nairobi",
    lastLogin: Date.now() - 2 * 60 * 60 * 1000,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdBy: "system",
    permissions: ["all"],
    twoFactorEnabled: true,
    emailVerified: true
  },
  {
    _id: "2",
    firstName: "Sarah",
    lastName: "Wilson",
    email: "sarah.wilson@edumyles.com",
    phone: "+254 734 567 890",
    role: "admin",
    status: "active",
    tenantId: "tenant-1",
    tenantName: "Nairobi International Academy",
    department: "Administration",
    location: "Nairobi",
    lastLogin: Date.now() - 6 * 60 * 60 * 1000,
    createdAt: Date.now() - 180 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdBy: "michael.chen@edumyles.com",
    permissions: ["tenant_management", "user_management", "reporting"],
    twoFactorEnabled: false,
    emailVerified: true
  },
  {
    _id: "3",
    firstName: "David",
    lastName: "Kim",
    email: "david.kim@edumyles.com",
    phone: "+254 756 234 567",
    role: "manager",
    status: "active",
    tenantId: "tenant-2",
    tenantName: "Mombasa Primary School",
    department: "Academics",
    location: "Mombasa",
    lastLogin: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    createdBy: "sarah.wilson@edumyles.com",
    permissions: ["student_management", "grade_management", "parent_communication"],
    twoFactorEnabled: false,
    emailVerified: true
  },
  {
    _id: "4",
    firstName: "Grace",
    lastName: "Ochieng",
    email: "grace.ochieng@edumyles.com",
    phone: "+254 723 890 123",
    role: "agent",
    status: "inactive",
    tenantId: "tenant-3",
    tenantName: "Kisumu High School",
    department: "Support",
    location: "Kisumu",
    lastLogin: Date.now() - 7 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    createdBy: "david.kim@edumyles.com",
    permissions: ["ticket_management", "basic_reporting"],
    twoFactorEnabled: false,
    emailVerified: false
  },
  {
    _id: "5",
    firstName: "Peter",
    lastName: "Kiprop",
    email: "peter.kiprop@edumyles.com",
    phone: "+254 745 678 901",
    role: "viewer",
    status: "pending",
    tenantId: "tenant-4",
    tenantName: "Eldoret Academy",
    department: "Finance",
    location: "Eldoret",
    lastLogin: undefined,
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    createdBy: "michael.chen@edumyles.com",
    permissions: ["view_reports"],
    twoFactorEnabled: false,
    emailVerified: false
  }
];

const mockRoles: Role[] = [
  {
    _id: "1",
    name: "Super Admin",
    description: "Full system access with all permissions",
    permissions: ["all"],
    userCount: 1,
    isSystem: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000
  },
  {
    _id: "2",
    name: "Admin",
    description: "Tenant administrator with management capabilities",
    permissions: ["tenant_management", "user_management", "reporting"],
    userCount: 3,
    isSystem: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000
  },
  {
    _id: "3",
    name: "Manager",
    description: "Department manager with operational permissions",
    permissions: ["student_management", "grade_management", "parent_communication"],
    userCount: 5,
    isSystem: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000
  },
  {
    _id: "4",
    name: "Agent",
    description: "Support agent with limited permissions",
    permissions: ["ticket_management", "basic_reporting"],
    userCount: 8,
    isSystem: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000
  },
  {
    _id: "5",
    name: "Viewer",
    description: "Read-only access for reporting and monitoring",
    permissions: ["view_reports"],
    userCount: 12,
    isSystem: true,
    createdAt: Date.now() - 365 * 24 * 60 * 60 * 1000
  }
];

const mockActivities: ActivityLog[] = [
  {
    _id: "1",
    userId: "1",
    action: "login",
    resource: "system",
    details: "Successful login from Nairobi",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: Date.now() - 2 * 60 * 60 * 1000
  },
  {
    _id: "2",
    userId: "2",
    action: "user_created",
    resource: "users",
    details: "Created new user: grace.ochieng@edumyles.com",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    timestamp: Date.now() - 6 * 60 * 60 * 1000
  },
  {
    _id: "3",
    userId: "3",
    action: "report_generated",
    resource: "reports",
    details: "Generated monthly performance report",
    ipAddress: "192.168.1.102",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000
  }
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [activities, setActivities] = useState<ActivityLog[]>(mockActivities);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("users");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchQuery === "" || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = selectedRole === "all" || user.role === selectedRole;
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus;
    const matchesTenant = selectedTenant === "all" || user.tenantId === selectedTenant;
    
    return matchesSearch && matchesRole && matchesStatus && matchesTenant;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-blue-100 text-blue-800";
      case "manager": return "bg-green-100 text-green-800";
      case "agent": return "bg-yellow-100 text-yellow-800";
      case "viewer": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <UserCheck className="h-4 w-4" />;
      case "inactive": return <UserX className="h-4 w-4" />;
      case "suspended": return <Lock className="h-4 w-4" />;
      case "pending": return <Clock className="h-4 w-4" />;
      default: return <UserCheck className="h-4 w-4" />;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-KE');
  };

  const handleCreateUser = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter(user => user._id !== userId));
    }
  };

  const handleToggleUserStatus = (userId: string, newStatus: User['status']) => {
    setUsers(users.map(user => 
      user._id === userId 
        ? { ...user, status: newStatus, updatedAt: Date.now() }
        : user
    ));
  };

  const handleExportUsers = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Status", "Tenant", "Department", "Location", "Created"],
      ...filteredUsers.map(user => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.status,
        user.tenantName || "N/A",
        user.department || "N/A",
        user.location || "N/A",
        formatDate(user.createdAt)
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const UsersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button onClick={handleCreateUser}>
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{users.length}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.status === "active").length}</div>
            <div className="text-sm text-muted-foreground">Active Users</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{users.filter(u => u.status === "pending").length}</div>
            <div className="text-sm text-muted-foreground">Pending Activation</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.twoFactorEnabled).length}</div>
            <div className="text-sm text-muted-foreground">2FA Enabled</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
              </div>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tenants</SelectItem>
                  <SelectItem value="tenant-1">Nairobi International Academy</SelectItem>
                  <SelectItem value="tenant-2">Mombasa Primary School</SelectItem>
                  <SelectItem value="tenant-3">Kisumu High School</SelectItem>
                  <SelectItem value="tenant-4">Eldoret Academy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportUsers}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">User</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Tenant</th>
                  <th className="text-left p-3 font-semibold">Department</th>
                  <th className="text-left p-3 font-semibold">Last Login</th>
                  <th className="text-left p-3 font-semibold">Security</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {user.firstName[0]?.toUpperCase()}{user.lastName[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          {user.phone && (
                            <div className="text-xs text-muted-foreground">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusIcon(user.status)}
                        <span>{user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{user.tenantName || "Platform"}</td>
                    <td className="p-3 text-sm">{user.department || "-"}</td>
                    <td className="p-3 text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : "Never"}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {user.twoFactorEnabled && (
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="2FA Enabled" />
                        )}
                        {user.emailVerified && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" title="Email Verified" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user._id, "active")}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user._id, "inactive")}>
                              <UserX className="h-4 w-4 mr-2" />
                              Deactivate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleUserStatus(user._id, "suspended")}>
                              <Lock className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteUser(user._id)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RolesManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{role.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                </div>
                {role.isSystem && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">Permissions:</div>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 3).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission.replace("_", " ")}
                    </Badge>
                  ))}
                  {role.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{role.permissions.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{role.userCount} users</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  {!role.isSystem && (
                    <Button variant="ghost" size="sm" className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ActivityLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-1" />
          Export Logs
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">User</th>
                  <th className="text-left p-3 font-semibold">Action</th>
                  <th className="text-left p-3 font-semibold">Resource</th>
                  <th className="text-left p-3 font-semibold">Details</th>
                  <th className="text-left p-3 font-semibold">IP Address</th>
                  <th className="text-left p-3 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const user = users.find(u => u._id === activity.userId);
                  return (
                    <tr key={activity._id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">
                          {user ? `${user.firstName} ${user.lastName}` : "Unknown User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user?.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {activity.action.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">{activity.resource}</td>
                      <td className="p-3 text-sm">{activity.details}</td>
                      <td className="p-3 text-sm font-mono">{activity.ipAddress}</td>
                      <td className="p-3 text-sm">{formatDateTime(activity.timestamp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="User Management" 
        description="Manage platform users, roles, and permissions"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="activity">Activity Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <UsersList />
        </TabsContent>
        
        <TabsContent value="roles">
          <RolesManagement />
        </TabsContent>
        
        <TabsContent value="activity">
          <ActivityLogs />
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="Enter first name" />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Enter last name" />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="Enter email" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" placeholder="Enter phone number" />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="agent">Agent</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tenant">Tenant</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign to tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tenant-1">Nairobi International Academy</SelectItem>
                    <SelectItem value="tenant-2">Mombasa Primary School</SelectItem>
                    <SelectItem value="tenant-3">Kisumu High School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input id="department" placeholder="Enter department" />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" placeholder="Enter location" />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="sendWelcome" className="rounded" defaultChecked />
                <Label htmlFor="sendWelcome">Send welcome email</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="require2FA" className="rounded" />
                <Label htmlFor="require2FA">Require 2FA setup</Label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(false)}>
                <UserPlus className="h-4 w-4 mr-1" />
                Create User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName">First Name</Label>
                  <Input id="edit-firstName" defaultValue={selectedUser.firstName} />
                </div>
                <div>
                  <Label htmlFor="edit-lastName">Last Name</Label>
                  <Input id="edit-lastName" defaultValue={selectedUser.lastName} />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email</Label>
                  <Input id="edit-email" type="email" defaultValue={selectedUser.email} />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input id="edit-phone" defaultValue={selectedUser.phone} />
                </div>
                <div>
                  <Label htmlFor="edit-role">Role</Label>
                  <Select defaultValue={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select defaultValue={selectedUser.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsEditDialogOpen(false)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Update User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
