"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
import { DataTable, Column } from "@/components/shared/DataTable";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Users, 
  Clock, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Eye,
  TrendingUp,
  UserCheck,
  UserX
} from "lucide-react";
import { useState } from "react";

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  specialization: string[];
  maxWeeklyHours: number;
  currentWeeklyHours: number;
  maxDailyHours: number;
  preferredSubjects: string[];
  unavailablePeriods: {
    day: number;
    periods: number[];
    reason: string;
  }[];
  status: "active" | "on_leave" | "part_time";
  hireDate: string;
  qualifications: string[];
}

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  requiredHours: number;
  assignedHours: number;
  difficulty: "beginner" | "intermediate" | "advanced";
}

interface Assignment {
  id: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  periodsPerWeek: number;
  status: "assigned" | "pending" | "conflict" | "unassigned";
  priority: "high" | "medium" | "low";
  notes?: string;
}

interface WorkloadAnalysis {
  teacherId: string;
  totalHours: number;
  subjectDistribution: { subjectId: string; hours: number }[];
  dailyDistribution: { day: number; hours: number }[];
  efficiency: number;
  satisfaction: number;
}

export default function TeacherAssignmentsPage() {
  const { isLoading } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showUnassigned, setShowUnassigned] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"teachers" | "subjects" | "workload">("teachers");

  if (isLoading) return <LoadingSkeleton variant="page" />;

  // Mock data for demonstration
  const teachers: Teacher[] = [
    {
      id: "t1",
      name: "Alice Johnson",
      email: "alice.j@school.com",
      phone: "+254 712 345 678",
      department: "Mathematics",
      specialization: ["Algebra", "Geometry", "Calculus"],
      maxWeeklyHours: 40,
      currentWeeklyHours: 35,
      maxDailyHours: 8,
      preferredSubjects: ["sub1", "sub2"],
      unavailablePeriods: [
        { day: 3, periods: [7, 8], reason: "Faculty meeting" },
        { day: 5, periods: [1, 2], reason: "Professional development" },
      ],
      status: "active",
      hireDate: "2020-01-15",
      qualifications: ["BSc Mathematics", "MSc Education", "PGCE"],
    },
    {
      id: "t2",
      name: "Bob Wilson",
      email: "bob.w@school.com",
      phone: "+254 723 456 789",
      department: "English",
      specialization: ["Literature", "Grammar", "Writing"],
      maxWeeklyHours: 40,
      currentWeeklyHours: 38,
      maxDailyHours: 8,
      preferredSubjects: ["sub2", "sub5"],
      unavailablePeriods: [],
      status: "active",
      hireDate: "2019-08-20",
      qualifications: ["BA English", "MEd", "TEFL"],
    },
    {
      id: "t3",
      name: "Mary Wanjiku",
      email: "mary.w@school.com",
      phone: "+254 734 567 890",
      department: "Science",
      specialization: ["Biology", "Chemistry", "Physics"],
      maxWeeklyHours: 35,
      currentWeeklyHours: 32,
      maxDailyHours: 7,
      preferredSubjects: ["sub3"],
      unavailablePeriods: [
        { day: 2, periods: [5, 6], reason: "Lab preparation" },
      ],
      status: "active",
      hireDate: "2021-03-10",
      qualifications: ["BSc Biology", "MSc Chemistry", "Teaching Diploma"],
    },
    {
      id: "t4",
      name: "James Otieno",
      email: "james.o@school.com",
      phone: "+254 745 678 901",
      department: "Social Studies",
      specialization: ["History", "Geography", "Civics"],
      maxWeeklyHours: 30,
      currentWeeklyHours: 28,
      maxDailyHours: 6,
      preferredSubjects: ["sub4"],
      unavailablePeriods: [],
      status: "part_time",
      hireDate: "2022-06-01",
      qualifications: ["BA History", "MA Education"],
    },
    {
      id: "t5",
      name: "Grace Kimani",
      email: "grace.k@school.com",
      phone: "+254 756 789 012",
      department: "Physical Education",
      specialization: ["Sports", "Health", "Fitness"],
      maxWeeklyHours: 25,
      currentWeeklyHours: 20,
      maxDailyHours: 6,
      preferredSubjects: ["sub5"],
      unavailablePeriods: [
        { day: 1, periods: [1, 2], reason: "Coaching training" },
        { day: 4, periods: [7, 8], reason: "Sports tournament" },
      ],
      status: "active",
      hireDate: "2020-09-15",
      qualifications: ["BSc Sports Science", "Coaching Certificate"],
    },
  ];

  const subjects: Subject[] = [
    { id: "sub1", name: "Mathematics", code: "MATH", department: "Mathematics", requiredHours: 200, assignedHours: 180, difficulty: "intermediate" },
    { id: "sub2", name: "English", code: "ENG", department: "English", requiredHours: 180, assignedHours: 175, difficulty: "beginner" },
    { id: "sub3", name: "Science", code: "SCI", department: "Science", requiredHours: 150, assignedHours: 140, difficulty: "advanced" },
    { id: "sub4", name: "Social Studies", code: "SS", department: "Social Studies", requiredHours: 120, assignedHours: 115, difficulty: "beginner" },
    { id: "sub5", name: "Physical Education", code: "PE", department: "Physical Education", requiredHours: 80, assignedHours: 75, difficulty: "beginner" },
  ];

  const assignments: Assignment[] = [
    { id: "a1", teacherId: "t1", subjectId: "sub1", classId: "c1", periodsPerWeek: 8, status: "assigned", priority: "high" },
    { id: "a2", teacherId: "t1", subjectId: "sub2", classId: "c2", periodsPerWeek: 4, status: "assigned", priority: "medium" },
    { id: "a3", teacherId: "t2", subjectId: "sub2", classId: "c1", periodsPerWeek: 10, status: "assigned", priority: "high" },
    { id: "a4", teacherId: "t3", subjectId: "sub3", classId: "c1", periodsPerWeek: 6, status: "assigned", priority: "high" },
    { id: "a5", teacherId: "t4", subjectId: "sub4", classId: "c3", periodsPerWeek: 5, status: "pending", priority: "medium" },
    { id: "a6", teacherId: "t5", subjectId: "sub5", classId: "c1", periodsPerWeek: 3, status: "assigned", priority: "low" },
  ];

  const workloadAnalysis: WorkloadAnalysis[] = [
    {
      teacherId: "t1",
      totalHours: 35,
      subjectDistribution: [
        { subjectId: "sub1", hours: 20 },
        { subjectId: "sub2", hours: 15 },
      ],
      dailyDistribution: [
        { day: 1, hours: 7 },
        { day: 2, hours: 7 },
        { day: 3, hours: 7 },
        { day: 4, hours: 7 },
        { day: 5, hours: 7 },
      ],
      efficiency: 92,
      satisfaction: 85,
    },
    {
      teacherId: "t2",
      totalHours: 38,
      subjectDistribution: [
        { subjectId: "sub2", hours: 38 },
      ],
      dailyDistribution: [
        { day: 1, hours: 8 },
        { day: 2, hours: 8 },
        { day: 3, hours: 7 },
        { day: 4, hours: 8 },
        { day: 5, hours: 7 },
      ],
      efficiency: 88,
      satisfaction: 78,
    },
  ];

  const filteredTeachers = teachers.filter(teacher => {
    const matchesDepartment = selectedDepartment === "all" || teacher.department === selectedDepartment;
    const matchesStatus = selectedStatus === "all" || teacher.status === selectedStatus;
    return matchesDepartment && matchesStatus;
  });

  const stats = {
    totalTeachers: teachers.length,
    activeTeachers: teachers.filter(t => t.status === "active").length,
    totalAssignedHours: teachers.reduce((sum, t) => sum + t.currentWeeklyHours, 0),
    totalAvailableHours: teachers.reduce((sum, t) => sum + t.maxWeeklyHours, 0),
    overloadedTeachers: teachers.filter(t => t.currentWeeklyHours > t.maxWeeklyHours * 0.9).length,
    underutilizedTeachers: teachers.filter(t => t.currentWeeklyHours < t.maxWeeklyHours * 0.5).length,
    totalSubjects: subjects.length,
    unassignedSubjects: subjects.filter(s => s.assignedHours < s.requiredHours * 0.9).length,
  };

  const teacherColumns: Column<Teacher>[] = [
    {
      key: "name",
      header: "Teacher",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
          <Badge variant="outline" className="text-xs mt-1">
            {row.department}
          </Badge>
        </div>
      ),
    },
    {
      key: "workload",
      header: "Workload",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{row.currentWeeklyHours}/{row.maxWeeklyHours} hrs</span>
            <div className="w-20 bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  row.currentWeeklyHours > row.maxWeeklyHours * 0.9 ? 'bg-red-500' :
                  row.currentWeeklyHours > row.maxWeeklyHours * 0.7 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${(row.currentWeeklyHours / row.maxWeeklyHours) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Max {row.maxDailyHours} hrs/day
          </p>
        </div>
      ),
    },
    {
      key: "specialization",
      header: "Specialization",
      cell: (row) => (
        <div>
          <div className="flex flex-wrap gap-1">
            {row.specialization.slice(0, 2).map((spec, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {spec}
              </Badge>
            ))}
            {row.specialization.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{row.specialization.length - 2}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button size="sm" variant="outline">
            <Edit className="h-3 w-3 mr-1" />
            Assign
          </Button>
        </div>
      ),
    },
  ];

  const subjectColumns: Column<Subject>[] = [
    {
      key: "name",
      header: "Subject",
      cell: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-sm text-muted-foreground">{row.code} • {row.department}</p>
        </div>
      ),
    },
    {
      key: "coverage",
      header: "Coverage",
      cell: (row) => {
        const coverage = (row.assignedHours / row.requiredHours) * 100;
        return (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{row.assignedHours}/{row.requiredHours} hrs</span>
              <div className="w-20 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    coverage >= 90 ? 'bg-green-500' :
                    coverage >= 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(coverage, 100)}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {coverage.toFixed(1)}% covered
            </p>
          </div>
        );
      },
    },
    {
      key: "difficulty",
      header: "Difficulty",
      cell: (row) => (
        <Badge variant={
          row.difficulty === "advanced" ? "destructive" :
          row.difficulty === "intermediate" ? "secondary" : "outline"
        }>
          {row.difficulty}
        </Badge>
      ),
    },
    {
      key: "assignedTeachers",
      header: "Assigned Teachers",
      cell: (row) => {
        const assignedTeachers = assignments
          .filter(a => a.subjectId === row.id)
          .map(a => teachers.find(t => t.id === a.teacherId)?.name)
          .filter(Boolean);
        return (
          <div>
            <p className="font-medium">{assignedTeachers.length}</p>
            <p className="text-xs text-muted-foreground">
              {assignedTeachers.slice(0, 2).join(", ")}
              {assignedTeachers.length > 2 && "..."}
            </p>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Assignments"
        description="Manage teacher workload, subject assignments, and availability"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Workload Analysis
            </Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </div>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="Active Teachers"
          value={stats.activeTeachers}
          description="Currently teaching"
          icon={UserCheck}
          variant="success"
        />
        <AdminStatsCard
          title="Total Assigned Hours"
          value={`${stats.totalAssignedHours}/${stats.totalAvailableHours}`}
          description="Weekly workload"
          icon={Clock}
          trend={{ value: 5, isPositive: true }}
        />
        <AdminStatsCard
          title="Overloaded Teachers"
          value={stats.overloadedTeachers}
          description="Need rebalancing"
          icon={AlertTriangle}
          variant="warning"
        />
        <AdminStatsCard
          title="Unassigned Subjects"
          value={stats.unassignedSubjects}
          description="Require teachers"
          icon={BookOpen}
          variant={stats.unassignedSubjects > 0 ? "danger" : "default"}
        />
      </div>

      {/* Filters and View Mode */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & View Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label>View Mode</Label>
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teachers">Teachers</SelectItem>
                  <SelectItem value="subjects">Subjects</SelectItem>
                  <SelectItem value="workload">Workload Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Department</Label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Social Studies">Social Studies</SelectItem>
                  <SelectItem value="Physical Education">Physical Education</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showUnassigned"
                  checked={showUnassigned}
                  onChange={(e) => setShowUnassigned(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="showUnassigned">Show unassigned only</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === "teachers" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Teacher Assignments</CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {filteredTeachers.length} of {teachers.length} teachers
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredTeachers}
              columns={teacherColumns}
              searchable
              searchPlaceholder="Search teachers..."
              emptyTitle="No teachers found"
              emptyDescription="No teachers match your current filters."
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "subjects" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Subject Coverage</CardTitle>
            <div className="text-sm text-muted-foreground">
              {subjects.length} subjects total
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              data={subjects}
              columns={subjectColumns}
              searchable
              searchPlaceholder="Search subjects..."
              emptyTitle="No subjects found"
              emptyDescription="No subjects match your search criteria."
            />
          </CardContent>
        </Card>
      )}

      {viewMode === "workload" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {workloadAnalysis.map((analysis) => {
            const teacher = teachers.find(t => t.id === analysis.teacherId);
            return (
              <Card key={analysis.teacherId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{teacher?.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        {analysis.totalHours} hrs/week
                      </Badge>
                      <Badge variant={analysis.efficiency >= 90 ? "default" : "secondary"}>
                        {analysis.efficiency}% efficient
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Subject Distribution</h4>
                    <div className="space-y-2">
                      {analysis.subjectDistribution.map((dist) => {
                        const subject = subjects.find(s => s.id === dist.subjectId);
                        return (
                          <div key={dist.subjectId} className="flex justify-between text-sm">
                            <span>{subject?.name}</span>
                            <span>{dist.hours} hrs</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Daily Distribution</h4>
                    <div className="grid grid-cols-5 gap-1">
                      {["M", "T", "W", "T", "F"].map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-muted-foreground">{day}</div>
                          <div className="w-full bg-gray-200 rounded h-8 mt-1">
                            <div 
                              className="bg-blue-500 rounded"
                              style={{ 
                                height: `${(analysis.dailyDistribution[index]?.hours || 0) / 8 * 100}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs mt-1">
                            {analysis.dailyDistribution[index]?.hours || 0}h
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span>Satisfaction Score:</span>
                    <span className="font-medium">{analysis.satisfaction}%</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
