"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  Calculator,
  Download,
  Plus,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface PayrollStats {
  totalStaff: number;
  activeStaff: number;
  onLeave: number;
  totalPayroll: number;
  thisMonthPayroll: number;
  averageSalary: number;
}

export default function HRDashboardPage() {
  const { user, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const staff = useQuery(
    api.modules.hr.queries.listStaff,
    user ? { status: "active" } : "skip"
  );

  const contracts = useQuery(
    api.modules.hr.queries.listContracts,
    user ? {} : "skip"
  );

  const payrollRuns = useQuery(
    api.modules.hr.queries.listPayrollRuns,
    user ? { status: "approved" } : "skip"
  );

  const staffStats = useQuery(
    api.modules.hr.queries.getStaffStats,
    user ? {} : "skip"
  );

  const createContract = useMutation(api.modules.hr.mutations.createContract);
  const createPayrollRun = useMutation(api.modules.hr.mutations.createPayrollRun);

  const handleCreateContract = async (staffId: string) => {
    try {
      await createContract({
        staffId,
        type: "permanent",
        startDate: new Date().toISOString().split('T')[0],
        salaryCents: 50000, // Example: 50,000 cents = $500
        currency: "KES",
      });
      
      toast({
        title: "Success",
        description: "Contract created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create contract",
        variant: "destructive"
      });
    }
  };

  const handleCreatePayrollRun = async () => {
    try {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      await createPayrollRun({
        periodLabel: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      });
      
      toast({
        title: "Success",
        description: "Payroll run created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payroll run",
        variant: "destructive"
      });
    }
  };

  const calculatePayrollStats = (): PayrollStats => {
    const totalStaff = staff?.length || 0;
    const activeStaff = staff?.filter(s => s.status === "active").length || 0;
    const onLeave = staff?.filter(s => s.status === "on_leave").length || 0;
    
    // Calculate payroll statistics
    const totalPayroll = payrollRuns?.reduce((sum, run) => {
      // This would be calculated from actual payslips
      return sum + 100000; // Example calculation
    }, 0) || 0;
    
    const thisMonthPayroll = payrollRuns
      ?.filter(run => {
        const runDate = new Date(run.createdAt);
        const now = new Date();
        return runDate.getMonth() === now.getMonth() && 
               runDate.getFullYear() === now.getFullYear();
      })
      ?.reduce((sum, run) => sum + 100000, 0) || 0;
    
    const averageSalary = activeStaff > 0 ? totalPayroll / activeStaff / 12 : 0;

    return {
      totalStaff,
      activeStaff,
      onLeave,
      totalPayroll,
      thisMonthPayroll,
      averageSalary,
    };
  };

  const payrollStats = calculatePayrollStats();

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="HR Management Dashboard"
        description="Manage staff, contracts, and payroll operations"
      />

      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{payrollStats.totalStaff}</div>
              <p className="text-xs text-muted-foreground">All employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{payrollStats.activeStaff}</div>
              <p className="text-xs text-muted-foreground">Currently working</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Leave</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{payrollStats.onLeave}</div>
              <p className="text-xs text-muted-foreground">Currently on leave</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Monthly Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                KES {(payrollStats.averageSalary / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Per employee</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                New Contract
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calculator className="h-4 w-4 mr-2" />
                Run Payroll
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Staff Management */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filters */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                      <SelectTrigger>
                        <SelectValue placeholder="All departments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        <SelectItem value="academics">Academics</SelectItem>
                        <SelectItem value="admin">Administration</SelectItem>
                        <SelectItem value="support">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="period">Period</Label>
                    <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="current">Current Month</SelectItem>
                        <SelectItem value="last">Last Month</SelectItem>
                        <SelectItem value="quarter">This Quarter</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Staff List */}
                <div className="space-y-3">
                  {staff?.slice(0, 5).map((staffMember) => (
                    <div key={staffMember._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {staffMember.firstName} {staffMember.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {staffMember.role} • {staffMember.department || 'No department'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={staffMember.status === "active" ? "default" : "secondary"}
                        >
                          {staffMember.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {staff?.length > 5 && (
                    <Button variant="outline" className="w-full">
                      View All Staff ({staff?.length - 5} more)
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contract Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Contract Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contracts?.slice(0, 3).map((contract) => (
                  <div key={contract._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">Contract #{contract._id.slice(-6)}</p>
                        <p className="text-sm text-muted-foreground">
                          {contract.type} • {contract.currency}
                        </p>
                        <p className="text-sm">
                          KES {(contract.salaryCents / 100).toLocaleString()}/month
                        </p>
                      </div>
                      <Badge 
                        variant={contract.status === "active" ? "default" : "secondary"}
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                {contracts?.length > 3 && (
                  <Button variant="outline" className="w-full mt-4">
                    View All Contracts ({contracts?.length - 3} more)
                  </Button>
                )}
              </div>
              </CardContent>
            </Card>
        </div>

        {/* Payroll Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Payroll Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Payroll Summary */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    KES {(payrollStats.thisMonthPayroll / 100).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">YTD Total</p>
                  <p className="text-2xl font-bold text-blue-600">
                    KES {(payrollStats.totalPayroll / 100).toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Last Run</p>
                  <p className="text-sm font-medium">
                    {payrollRuns?.[0] ? 
                      format(new Date(payrollRuns[0].createdAt), "MMM d, yyyy") : 
                      "No runs yet"
                    }
                  </p>
                </div>
              </div>

              {/* Recent Payroll Runs */}
              <div>
                <h4 className="text-lg font-semibold mb-4">Recent Payroll Runs</h4>
                <div className="space-y-3">
                  {payrollRuns?.slice(0, 3).map((run) => (
                    <div key={run._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          {format(new Date(run.startDate), "PPP")} - {format(new Date(run.endDate), "PPP")}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={run.status === "approved" ? "default" : "secondary"}
                        >
                          {run.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button onClick={handleCreatePayrollRun}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Create New Payroll Run
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Payroll Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
