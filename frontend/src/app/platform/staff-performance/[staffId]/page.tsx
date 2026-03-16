"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Award,
  BarChart3,
  PieChart,
  LineChart,
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
  CheckCircle,
  AlertCircle,
  FileText,
  Settings,
  Download,
  RefreshCw,
  FilterIcon,
  CalendarDays,
  Users,
  Eye,
  Edit,
  Plus,
  Send,
  MessageCircle
} from "lucide-react";

interface StaffDetail {
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
  goals: Goal[];
  feedback: Feedback[];
  schedule: WorkSchedule;
}

interface PerformanceMetrics {
  ticketsResolved: number;
  ticketsCreated: number;
  responseTime: number;
  satisfactionScore: number;
  productivity: number;
  attendance: number;
  qualityScore: number;
  efficiency: number;
  collaboration: number;
  innovation: number;
  communication: number;
  leadership: number;
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  skillAssessments: SkillAssessment[];
}

interface WeeklyStats {
  week: string;
  ticketsResolved: number;
  responseTime: number;
  satisfactionScore: number;
  productivity: number;
  efficiency: number;
}

interface MonthlyStats {
  month: string;
  ticketsResolved: number;
  revenue: number;
  clientSatisfaction: number;
  efficiency: number;
  qualityScore: number;
}

interface SkillAssessment {
  skill: string;
  level: number; // 1-10
  lastAssessed: number;
  assessor: string;
  notes: string;
}

interface ActivityRecord {
  _id: string;
  type: "ticket_resolved" | "ticket_created" | "email_sent" | "call_made" | "meeting_attended" | "task_completed" | "client_contact" | "system_login" | "report_generated" | "training_completed" | "goal_achieved";
  description: string;
  details: string;
  timestamp: number;
  duration?: number;
  impact: "high" | "medium" | "low";
  category: "support" | "sales" | "admin" | "management" | "communication" | "training" | "development";
}

interface Achievement {
  _id: string;
  title: string;
  description: string;
  icon: string;
  category: "performance" | "quality" | "efficiency" | "innovation" | "leadership" | "collaboration" | "training" | "development";
  earnedAt: number;
  points: number;
  level: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  criteria: string;
}

interface Goal {
  _id: string;
  title: string;
  description: string;
  type: "performance" | "skill" | "project" | "training";
  target: string;
  progress: number; // 0-100
  dueDate: number;
  status: "active" | "completed" | "overdue" | "cancelled";
  priority: "high" | "medium" | "low";
  createdAt: number;
  updatedAt: number;
}

interface Feedback {
  _id: string;
  from: string;
  fromRole: string;
  type: "peer" | "manager" | "self" | "client";
  rating: number; // 1-5
  comment: string;
  strengths: string[];
  improvements: string[];
  timestamp: number;
  isAnonymous: boolean;
}

interface WorkSchedule {
  monday: { start: string; end: string; active: boolean };
  tuesday: { start: string; end: string; active: boolean };
  wednesday: { start: string; end: string; active: boolean };
  thursday: { start: string; end: string; active: boolean };
  friday: { start: string; end: string; active: boolean };
  saturday: { start: string; end: string; active: boolean };
  sunday: { start: string; end: string; active: boolean };
  timezone: string;
}

function mapBackendToStaffDetail(data: any): StaffDetail {
  const nameParts = (data.userName || "Unknown").split(" ");
  const firstName = nameParts[0] || "Unknown";
  const lastName = nameParts.slice(1).join(" ") || "";
  const latestMetrics = data.periods?.[0]?.metrics || {};
  const latestScore = data.currentScore ?? 0;

  return {
    _id: data.userId,
    firstName,
    lastName,
    email: data.userEmail || "",
    role: (data.role as any) || "agent",
    department: data.department || "General",
    location: "",
    isActive: true,
    joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now(),
    performance: {
      ticketsResolved: latestMetrics.ticketsResolved ?? 0,
      ticketsCreated: 0,
      responseTime: latestMetrics.avgResponseTime ?? 0,
      satisfactionScore: (latestMetrics.satisfactionScore ?? 0) / 20, // scale 0-100 to 0-5
      productivity: (latestMetrics.ticketsResolved ?? 0) / 5,
      attendance: 95,
      qualityScore: latestScore,
      efficiency: latestMetrics.slaCompliance ?? 0,
      collaboration: 80,
      innovation: 80,
      communication: 80,
      leadership: 80,
      weeklyStats: [],
      monthlyStats: (data.periods || []).map((p: any) => ({
        month: p.period,
        ticketsResolved: p.metrics?.ticketsResolved ?? 0,
        revenue: 0,
        clientSatisfaction: (p.metrics?.satisfactionScore ?? 0) / 20,
        efficiency: p.metrics?.slaCompliance ?? 0,
        qualityScore: p.overallScore ?? 0,
      })),
      skillAssessments: [],
    },
    activities: [],
    achievements: (data.achievements || []).map((a: string, i: number) => ({
      _id: String(i),
      title: a,
      description: a,
      icon: "award",
      category: "performance" as const,
      earnedAt: Date.now(),
      points: 50,
      level: "silver" as const,
      criteria: "",
    })),
    goals: data.goals ? [{
      _id: "1",
      title: "Tickets Target",
      description: `Target: ${data.goals.ticketsTarget ?? "N/A"} tickets`,
      type: "performance" as const,
      target: `${data.goals.ticketsTarget ?? 0} tickets`,
      progress: data.goals.ticketsTarget ? Math.min(100, Math.round((latestMetrics.ticketsResolved ?? 0) / data.goals.ticketsTarget * 100)) : 0,
      dueDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: "active" as const,
      priority: "high" as const,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }] : [],
    feedback: [],
    schedule: {
      monday: { start: "09:00", end: "17:00", active: true },
      tuesday: { start: "09:00", end: "17:00", active: true },
      wednesday: { start: "09:00", end: "17:00", active: true },
      thursday: { start: "09:00", end: "17:00", active: true },
      friday: { start: "09:00", end: "17:00", active: true },
      saturday: { start: "10:00", end: "14:00", active: false },
      sunday: { start: "10:00", end: "14:00", active: false },
      timezone: "Africa/Nairobi",
    },
  };
}

export default function StaffDetailPage() {
  const params = useParams();
  const staffId = params.staffId as string;
  const { sessionToken } = useAuth();

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("week");

  // Real Convex query
  const staffDetailData = usePlatformQuery(
    api.platform.staffPerformance.queries.getStaffDetail,
    { sessionToken: sessionToken || "", userId: staffId }
  );

  if (!staffDetailData) return <div className="p-6">Loading...</div>;

  const staff: StaffDetail = mapBackendToStaffDetail(staffDetailData);

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
      case "training_completed": return <Award className="h-4 w-4 text-yellow-500" />;
      case "goal_achieved": return <Target className="h-4 w-4 text-green-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGoalStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "overdue": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
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

  const handleSendFeedback = () => {
    // Handle feedback submission
    setIsFeedbackDialogOpen(false);
  };

  const handleCreateGoal = () => {
    // Handle goal creation
    setIsGoalDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title={`${staff.firstName} ${staff.lastName}`} 
        description="Detailed performance tracking and activity monitoring"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Staff Performance", href: "/platform/staff-performance" },
          { label: `${staff.firstName} ${staff.lastName}`, href: `/platform/staff-performance/${staffId}` }
        ]}
      />

      {/* Staff Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold">
                    {staff.firstName[0]?.toUpperCase()}{staff.lastName[0]?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{staff.firstName} {staff.lastName}</h2>
                    <div className={`w-3 h-3 rounded-full ${staff.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <p className="text-muted-foreground mb-4">{staff.email}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{staff.phone || "Not provided"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{staff.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{staff.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {formatDate(staff.joinedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Badge className={getRoleColor(staff.role)}>
                      {staff.role.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline">{staff.department}</Badge>
                    <Badge variant="outline">{staff.location}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-1" />
                    Send Message
                  </Button>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{staff.performance.ticketsResolved}</div>
                  <div className="text-sm text-muted-foreground">Tickets Resolved</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(staff.performance.responseTime, 'efficiency')}`}>
                    {staff.performance.responseTime}m
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response Time</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(staff.performance.satisfactionScore, 'satisfaction')}`}>
                    {staff.performance.satisfactionScore.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Satisfaction Score</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(staff.performance.qualityScore, 'quality')}`}>
                    {staff.performance.qualityScore}
                  </div>
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Performance Tabs */}
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Performance Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-4">Core Metrics</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Productivity</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.productivity, 'quality')}`}>
                              {staff.performance.productivity.toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Efficiency</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.efficiency, 'quality')}`}>
                              {staff.performance.efficiency}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quality Score</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.qualityScore, 'quality')}`}>
                              {staff.performance.qualityScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Attendance</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.attendance, 'quality')}`}>
                              {staff.performance.attendance}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-4">Soft Skills</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Collaboration</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.collaboration, 'quality')}`}>
                              {staff.performance.collaboration}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Innovation</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.innovation, 'quality')}`}>
                              {staff.performance.innovation}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Communication</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.communication, 'quality')}`}>
                              {staff.performance.communication}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Leadership</span>
                            <span className={`font-medium ${getPerformanceColor(staff.performance.leadership, 'quality')}`}>
                              {staff.performance.leadership}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {staff.performance.monthlyStats.map((month, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <span className="font-medium">{month.month}</span>
                          <div className="flex items-center gap-6 text-sm">
                            <span>{month.ticketsResolved} tickets</span>
                            <span>KES {(month.revenue / 1000).toFixed(0)}K revenue</span>
                            <span>{month.clientSatisfaction.toFixed(1)} satisfaction</span>
                            <span>{month.efficiency}% efficiency</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="activities">
              <div className="space-y-4">
                {staff.activities.map((activity) => (
                  <Card key={activity._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-muted-foreground">{activity.details}</div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>{formatDateTime(activity.timestamp)}</span>
                            {activity.duration && <span>Duration: {formatDuration(activity.duration)}</span>}
                            <Badge variant="outline">{activity.category}</Badge>
                            <Badge className={getGoalStatusColor(activity.impact)} variant="outline">
                              {activity.impact}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="achievements">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staff.achievements.map((achievement) => (
                  <Card key={achievement._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getAchievementLevelColor(achievement.level)}`}>
                          {getAchievementIcon(achievement.icon)}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{achievement.title}</div>
                          <div className="text-sm text-muted-foreground">{achievement.description}</div>
                          <div className="text-xs text-muted-foreground mt-1">{achievement.criteria}</div>
                          <div className="flex items-center gap-4 mt-2 text-xs">
                            <span>{formatDate(achievement.earnedAt)}</span>
                            <Badge variant="outline">{achievement.points} points</Badge>
                            <Badge variant="outline">{achievement.level}</Badge>
                            <Badge variant="outline">{achievement.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="goals">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Active Goals</h3>
                  <Button onClick={() => setIsGoalDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Goal
                  </Button>
                </div>
                {staff.goals.map((goal) => (
                  <Card key={goal._id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{goal.title}</div>
                            <div className="text-sm text-muted-foreground">{goal.description}</div>
                          </div>
                          <Badge className={getGoalStatusColor(goal.status)}>
                            {goal.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span>Target: {goal.target}</span>
                          <span>Due: {formatDate(goal.dueDate)}</span>
                          <Badge variant="outline">{goal.priority}</Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{goal.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="skills">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skill Assessments</h3>
                {staff.performance.skillAssessments.map((skill, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{skill.skill}</div>
                            <div className="text-sm text-muted-foreground">Assessed by {skill.assessor}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{skill.level}/10</div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(skill.lastAssessed)}
                            </div>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${skill.level * 10}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-muted-foreground">{skill.notes}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="feedback">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Feedback & Reviews</h3>
                  <Button onClick={() => setIsFeedbackDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Feedback
                  </Button>
                </div>
                {staff.feedback.map((feedback) => (
                  <Card key={feedback._id}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">
                              {feedback.isAnonymous ? "Anonymous" : feedback.from}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {feedback.fromRole} • {feedback.type}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < feedback.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="text-sm">{feedback.comment}</div>
                        {feedback.strengths.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">Strengths:</div>
                            <div className="flex flex-wrap gap-1">
                              {feedback.strengths.map((strength, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {strength}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {feedback.improvements.length > 0 && (
                          <div>
                            <div className="text-sm font-medium mb-1">Areas for Improvement:</div>
                            <div className="flex flex-wrap gap-1">
                              {feedback.improvements.map((improvement, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {improvement}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {formatDate(feedback.timestamp)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Total Points</span>
                <span className="font-bold">
                  {staff.achievements.reduce((sum, a) => sum + a.points, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Achievements</span>
                <span className="font-bold">{staff.achievements.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active Goals</span>
                <span className="font-bold">{staff.goals.filter(g => g.status === 'active').length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last Activity</span>
                <span className="font-bold">{formatDate(staff.lastActivity)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Work Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Work Schedule</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground mb-2">
                {staff.schedule.timezone}
              </div>
              {Object.entries(staff.schedule).map(([day, schedule]) => (
                <div key={day} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{day}</span>
                  {schedule.active ? (
                    <span>{schedule.start} - {schedule.end}</span>
                  ) : (
                    <span className="text-muted-foreground">Off</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.achievements.slice(0, 3).map((achievement) => (
                <div key={achievement._id} className="flex items-center gap-3">
                  <div className={`p-1 rounded ${getAchievementLevelColor(achievement.level)}`}>
                    {getAchievementIcon(achievement.icon)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(achievement.earnedAt)}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Feedback Dialog */}
      <Dialog open={isFeedbackDialogOpen} onOpenChange={setIsFeedbackDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Feedback</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="feedback-type">Type</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="peer">Peer Feedback</SelectItem>
                  <SelectItem value="manager">Manager Feedback</SelectItem>
                  <SelectItem value="self">Self Assessment</SelectItem>
                  <SelectItem value="client">Client Feedback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rating">Rating</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                  <SelectItem value="4">4 - Good</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="2">2 - Below Average</SelectItem>
                  <SelectItem value="1">1 - Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comment">Comment</Label>
              <Textarea id="comment" placeholder="Enter your feedback" />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsFeedbackDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendFeedback}>
                <Send className="h-4 w-4 mr-1" />
                Send Feedback
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="goal-title">Goal Title</Label>
              <Input id="goal-title" placeholder="Enter goal title" />
            </div>
            <div>
              <Label htmlFor="goal-description">Description</Label>
              <Textarea id="goal-description" placeholder="Enter goal description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="goal-type">Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="skill">Skill Development</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="goal-priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="goal-target">Target</Label>
              <Input id="goal-target" placeholder="Enter target metric" />
            </div>
            <div>
              <Label htmlFor="goal-due">Due Date</Label>
              <Input id="goal-due" type="date" />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGoal}>
                <Target className="h-4 w-4 mr-1" />
                Create Goal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
