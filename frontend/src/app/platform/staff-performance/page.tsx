"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
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
  Search, 
  Filter,
  Download,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Calendar,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  UserCheck,
  UserX,
  Target,
  Award,
  BarChart3,
  PieChart,
  LineChart,
  MoreHorizontal,
  Eye,
  FileText,
  Settings,
  RefreshCw,
  FilterIcon,
  CalendarDays,
  Timer,
  Zap,
  Star,
  Trophy,
  Medal,
  Crown,
  Briefcase,
  MessageSquare,
  Headphones,
  DollarSign,
  Building,
  MapPin,
  Globe
} from "lucide-react";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: "super_admin" | "admin" | "manager" | "agent" | "support";
  department: string;
  location: string;
  avatar?: string;
  isActive: boolean;
  joinedAt: number;
  lastActivity: number;
  performance: PerformanceMetrics;
  activities: ActivityRecord[];
  achievements: Achievement[];
}

interface PerformanceMetrics {
  ticketsResolved: number;
  ticketsCreated: number;
  responseTime: number; // average in minutes
  satisfactionScore: number; // 0-5
  productivity: number; // tasks per day
  attendance: number; // percentage
  qualityScore: number; // 0-100
  efficiency: number; // 0-100
  collaboration: number; // 0-100
  innovation: number; // 0-100
  communication: number; // 0-100
  leadership: number; // 0-100
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
}

interface WeeklyStats {
  week: string;
  ticketsResolved: number;
  responseTime: number;
  satisfactionScore: number;
  productivity: number;
}

interface MonthlyStats {
  month: string;
  ticketsResolved: number;
  revenue: number;
  clientSatisfaction: number;
  efficiency: number;
}

interface ActivityRecord {
  _id: string;
  type: "ticket_resolved" | "ticket_created" | "email_sent" | "call_made" | "meeting_attended" | "task_completed" | "client_contact" | "system_login" | "report_generated";
  description: string;
  details: string;
  timestamp: number;
  duration?: number; // in minutes
  impact: "high" | "medium" | "low";
  category: "support" | "sales" | "admin" | "management" | "communication";
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: "performance" | "quality" | "efficiency" | "innovation" | "leadership" | "collaboration";
  earnedAt: number;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum" | "diamond";
}

function mapBackendToStaffMember(record: any): StaffMember {
  const nameParts = (record.userName || "Unknown").split(" ");
  const firstName = nameParts[0] || "Unknown";
  const lastName = nameParts.slice(1).join(" ") || "";
  const m = record.metrics || {};
  return {
    _id: record._id || record.userId,
    firstName,
    lastName,
    email: record.userEmail || "",
    role: record.role || "agent",
    department: record.department || "General",
    location: "",
    isActive: true,
    joinedAt: record.createdAt || Date.now(),
    lastActivity: record.updatedAt || Date.now(),
    performance: {
      ticketsResolved: m.ticketsResolved ?? 0,
      ticketsCreated: 0,
      responseTime: m.avgResponseTime ?? 0,
      satisfactionScore: (m.satisfactionScore ?? 0) / 20, // scale 0-100 to 0-5
      productivity: ((m.ticketsResolved ?? 0) / 5),
      attendance: 95,
      qualityScore: record.overallScore ?? 0,
      efficiency: m.slaCompliance ?? 0,
      collaboration: 80,
      innovation: 80,
      communication: 80,
      leadership: 80,
      weeklyStats: [],
      monthlyStats: [],
    },
    activities: [],
    achievements: (record.achievements || []).map((a: string, i: number) => ({
      _id: String(i),
      title: a,
      description: a,
      icon: "award",
      category: "performance" as const,
      earnedAt: record.createdAt || Date.now(),
      points: 50,
      level: "silver" as const,
    })),
  };
}

export default function StaffPerformancePage() {
  const { sessionToken } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("week");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Real Convex query
  const staffData = usePlatformQuery(
    api.platform.staffPerformance.queries.listStaffPerformance,
    { sessionToken: sessionToken || "" }
  );

  if (!staffData) return <div className="p-6">Loading...</div>;

  const staff: StaffMember[] = staffData.map(mapBackendToStaffMember);

  const filteredStaff = staff.filter(member => {
    const matchesSearch = searchQuery === "" || 
      member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;
    const matchesRole = selectedRole === "all" || member.role === selectedRole;
    const matchesLocation = selectedLocation === "all" || member.location === selectedLocation;
    
    return matchesSearch && matchesDepartment && matchesRole && matchesLocation;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-purple-100 text-purple-800";
      case "admin": return "bg-blue-100 text-blue-800";
      case "manager": return "bg-green-100 text-green-800";
      case "agent": return "bg-yellow-100 text-yellow-800";
      case "support": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPerformanceColor = (score: number, type: "satisfaction" | "efficiency" | "quality") => {
    if (type === "satisfaction") {
      if (score >= 4.5) return "text-green-600";
      if (score >= 3.5) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (score >= 90) return "text-green-600";
      if (score >= 70) return "text-yellow-600";
      return "text-red-600";
    }
  };

  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case "trophy": return <Trophy className="h-5 w-5" />;
      case "award": return <Award className="h-5 w-5" />;
      case "medal": return <Medal className="h-5 w-5" />;
      case "star": return <Star className="h-5 w-5" />;
      case "crown": return <Crown className="h-5 w-5" />;
      case "zap": return <Zap className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getAchievementLevelColor = (level: string) => {
    switch (level) {
      case "diamond": return "bg-purple-100 text-purple-800 border-purple-300";
      case "platinum": return "bg-gray-100 text-gray-800 border-gray-300";
      case "gold": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "silver": return "bg-blue-100 text-blue-800 border-blue-300";
      case "bronze": return "bg-orange-100 text-orange-800 border-orange-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "ticket_resolved": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "ticket_created": return <Headphones className="h-4 w-4 text-blue-500" />;
      case "email_sent": return <Mail className="h-4 w-4 text-purple-500" />;
      case "call_made": return <Phone className="h-4 w-4 text-green-500" />;
      case "meeting_attended": return <Users className="h-4 w-4 text-orange-500" />;
      case "task_completed": return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case "client_contact": return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case "system_login": return <Activity className="h-4 w-4 text-gray-500" />;
      case "report_generated": return <FileText className="h-4 w-4 text-indigo-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
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

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleViewDetails = (staffMember: StaffMember) => {
    setSelectedStaff(staffMember);
    setIsDetailDialogOpen(true);
  };

  const handleExportData = () => {
    const csvContent = [
      ["Name", "Email", "Role", "Department", "Location", "Tickets Resolved", "Response Time", "Satisfaction", "Productivity", "Quality Score", "Efficiency"],
      ...filteredStaff.map(member => [
        `${member.firstName} ${member.lastName}`,
        member.email,
        member.role,
        member.department,
        member.location,
        member.performance.ticketsResolved,
        member.performance.responseTime,
        member.performance.satisfactionScore,
        member.performance.productivity,
        member.performance.qualityScore,
        member.performance.efficiency
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff_performance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const calculateTeamMetrics = () => {
    const totalStaff = filteredStaff.length;
    const avgSatisfaction = filteredStaff.reduce((sum, member) => sum + member.performance.satisfactionScore, 0) / totalStaff;
    const avgProductivity = filteredStaff.reduce((sum, member) => sum + member.performance.productivity, 0) / totalStaff;
    const avgEfficiency = filteredStaff.reduce((sum, member) => sum + member.performance.efficiency, 0) / totalStaff;
    const totalTicketsResolved = filteredStaff.reduce((sum, member) => sum + member.performance.ticketsResolved, 0);
    const avgResponseTime = filteredStaff.reduce((sum, member) => sum + member.performance.responseTime, 0) / totalStaff;

    return {
      totalStaff,
      avgSatisfaction,
      avgProductivity,
      avgEfficiency,
      totalTicketsResolved,
      avgResponseTime
    };
  };

  const teamMetrics = calculateTeamMetrics();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Staff Performance" 
        description="Monitor staff performance, track activities, and analyze productivity metrics"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Staff Performance", href: "/platform/staff-performance" }
        ]}
      />

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{teamMetrics.totalStaff}</div>
                <div className="text-sm text-muted-foreground">Total Staff</div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{teamMetrics.avgSatisfaction.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Satisfaction</div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{teamMetrics.totalTicketsResolved}</div>
                <div className="text-sm text-muted-foreground">Tickets Resolved</div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{teamMetrics.avgResponseTime.toFixed(0)}m</div>
                <div className="text-sm text-muted-foreground">Avg Response Time</div>
              </div>
              <Timer className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
              </div>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Management">Management</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="IT">IT</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="Nairobi">Nairobi</SelectItem>
                  <SelectItem value="Mombasa">Mombasa</SelectItem>
                  <SelectItem value="Kisumu">Kisumu</SelectItem>
                  <SelectItem value="Eldoret">Eldoret</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportData}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Performance Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">Staff Member</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Department</th>
                  <th className="text-left p-3 font-semibold">Tickets Resolved</th>
                  <th className="text-left p-3 font-semibold">Response Time</th>
                  <th className="text-left p-3 font-semibold">Satisfaction</th>
                  <th className="text-left p-3 font-semibold">Productivity</th>
                  <th className="text-left p-3 font-semibold">Quality Score</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member._id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">
                            {member.firstName[0]?.toUpperCase()}{member.lastName[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{member.firstName} {member.lastName}</div>
                          <div className="text-sm text-muted-foreground">{member.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className="text-xs text-muted-foreground">
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">{member.department}</td>
                    <td className="p-3">
                      <div className="font-medium">{member.performance.ticketsResolved}</div>
                    </td>
                    <td className="p-3">
                      <div className={`font-medium ${getPerformanceColor(member.performance.responseTime, 'efficiency')}`}>
                        {member.performance.responseTime}m
                      </div>
                    </td>
                    <td className="p-3">
                      <div className={`font-medium ${getPerformanceColor(member.performance.satisfactionScore, 'satisfaction')}`}>
                        {member.performance.satisfactionScore.toFixed(1)}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium">{member.performance.productivity.toFixed(1)}</div>
                    </td>
                    <td className="p-3">
                      <div className={`font-medium ${getPerformanceColor(member.performance.qualityScore, 'quality')}`}>
                        {member.performance.qualityScore}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(member)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Staff Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Staff Performance Details</DialogTitle>
          </DialogHeader>
          {selectedStaff && (
            <div className="space-y-6">
              {/* Staff Overview */}
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xl font-bold">
                    {selectedStaff.firstName[0]?.toUpperCase()}{selectedStaff.lastName[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedStaff.firstName} {selectedStaff.lastName}</h3>
                  <p className="text-muted-foreground">{selectedStaff.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getRoleColor(selectedStaff.role)}>
                      {selectedStaff.role.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{selectedStaff.department}</Badge>
                    <Badge variant="outline">{selectedStaff.location}</Badge>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{selectedStaff.performance.ticketsResolved}</div>
                      <div className="text-sm text-muted-foreground">Tickets Resolved</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedStaff.performance.responseTime, 'efficiency')}`}>
                        {selectedStaff.performance.responseTime}m
                      </div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedStaff.performance.satisfactionScore, 'satisfaction')}`}>
                        {selectedStaff.performance.satisfactionScore.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">Satisfaction Score</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getPerformanceColor(selectedStaff.performance.qualityScore, 'quality')}`}>
                        {selectedStaff.performance.qualityScore}
                      </div>
                      <div className="text-sm text-muted-foreground">Quality Score</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs for detailed views */}
              <Tabs defaultValue="activities">
                <TabsList>
                  <TabsTrigger value="activities">Recent Activities</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>
                
                <TabsContent value="activities">
                  <div className="space-y-3">
                    {selectedStaff.activities.slice(0, 10).map((activity) => (
                      <div key={activity._id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{formatDateTime(activity.timestamp)}</span>
                            {activity.duration && <span>Duration: {formatDuration(activity.duration)}</span>}
                            <Badge className={getImpactColor(activity.impact)} variant="outline">
                              {activity.impact}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="achievements">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStaff.achievements.map((achievement) => (
                      <Card key={achievement._id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${getAchievementLevelColor(achievement.level)}`}>
                              {getAchievementIcon(achievement.icon)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{achievement.title}</div>
                              <div className="text-sm text-muted-foreground">{achievement.description}</div>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <span>{formatDate(achievement.earnedAt)}</span>
                                <Badge variant="outline">{achievement.points} points</Badge>
                                <Badge variant="outline">{achievement.level}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="metrics">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-4">Performance Metrics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Productivity</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.productivity, 'quality')}`}>
                            {selectedStaff.performance.productivity.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efficiency</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.efficiency, 'quality')}`}>
                            {selectedStaff.performance.efficiency}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Collaboration</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.collaboration, 'quality')}`}>
                            {selectedStaff.performance.collaboration}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Innovation</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.innovation, 'quality')}`}>
                            {selectedStaff.performance.innovation}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Communication</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.communication, 'quality')}`}>
                            {selectedStaff.performance.communication}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Leadership</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.leadership, 'quality')}`}>
                            {selectedStaff.performance.leadership}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-4">Activity Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Tickets Created</span>
                          <span className="font-medium">{selectedStaff.performance.ticketsCreated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tickets Resolved</span>
                          <span className="font-medium">{selectedStaff.performance.ticketsResolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Attendance</span>
                          <span className={`font-medium ${getPerformanceColor(selectedStaff.performance.attendance, 'quality')}`}>
                            {selectedStaff.performance.attendance}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="trends">
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-4">Weekly Performance</h4>
                      <div className="space-y-2">
                        {selectedStaff.performance.weeklyStats.map((week, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="text-sm">{week.week}</span>
                            <div className="flex items-center gap-4 text-sm">
                              <span>{week.ticketsResolved} tickets</span>
                              <span>{week.responseTime}m response</span>
                              <span>{week.satisfactionScore.toFixed(1)} satisfaction</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
