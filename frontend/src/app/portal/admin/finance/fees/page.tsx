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
  DollarSign, 
  Plus, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Percent,
  Download,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/components/ui/use-toast";

interface FeeStructure {
  _id: string;
  name: string;
  amount: number;
  academicYear: string;
  grade: string;
  frequency: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface DiscountRule {
  _id: string;
  name: string;
  type: string;
  value: number;
  conditions: string;
  status: string;
  createdAt: number;
}

export default function FeeStructuresPage() {
  const { user, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const feeStructures = useQuery(
    api.modules.finance.queries.listFeeStructures,
    user ? { 
      grade: selectedGrade === "all" ? undefined : selectedGrade,
      academicYear: selectedYear === "all" ? undefined : selectedYear
    } : "skip"
  );

  const createFeeStructure = useMutation(api.modules.finance.mutations.createFeeStructure);
  const generateInvoices = useMutation(api.modules.finance.mutations.bulkGenerateInvoices);

  const handleCreateFeeStructure = async () => {
    try {
      await createFeeStructure({
        name: "New Fee Structure",
        amount: 50000, // 500.00 in cents
        academicYear: selectedYear,
        grade: "Grade 1",
        frequency: "termly",
      });
      
      toast({
        title: "Success",
        description: "Fee structure created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create fee structure",
        variant: "destructive"
      });
    }
  };

  const handleBulkGenerateInvoices = async () => {
    try {
      // This would typically get selected students
      const sampleItems = [
        {
          studentId: "student-1",
          feeStructureId: feeStructures?.[0]?._id || "",
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          issuedAt: new Date().toISOString().split('T')[0],
        }
      ];

      await generateInvoices({ items: sampleItems });
      
      toast({
        title: "Success",
        description: "Invoices generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate invoices",
        variant: "destructive"
      });
    }
  };

  const calculateStats = () => {
    const totalStructures = feeStructures?.length || 0;
    const activeStructures = feeStructures?.filter(f => f.status === "active").length || 0;
    const totalValue = feeStructures?.reduce((sum, f) => sum + f.amount, 0) || 0;
    const averageFee = totalStructures > 0 ? totalValue / totalStructures : 0;

    return {
      totalStructures,
      activeStructures,
      totalValue,
      averageFee,
    };
  };

  const stats = calculateStats();

  const filteredStructures = feeStructures?.filter(structure =>
    structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    structure.academicYear.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <LoadingSkeleton variant="page" />;

  return (
    <div>
      <PageHeader
        title="Fee Structure Management"
        description="Manage fee structures, discounts, and approval workflows"
      />

      <div className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Structures</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStructures}</div>
              <p className="text-xs text-muted-foreground">All fee structures</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeStructures}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Fee</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                KES {(stats.averageFee / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Per structure</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                KES {(stats.totalValue / 100).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">All structures</p>
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
              <Button className="w-full justify-start" variant="outline" onClick={handleCreateFeeStructure}>
                <Plus className="h-4 w-4 mr-2" />
                New Fee Structure
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Percent className="h-4 w-4 mr-2" />
                Discount Rules
              </Button>
              <Button className="w-full justify-start" variant="outline" onClick={handleBulkGenerateInvoices}>
                <Download className="h-4 w-4 mr-2" />
                Generate Invoices
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search fee structures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending Approval</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Structures List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Structures ({filteredStructures.length})
              </div>
              <Button size="sm" onClick={handleCreateFeeStructure}>
                <Plus className="h-4 w-4 mr-2" />
                Add Structure
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredStructures.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fee Structures Found</h3>
                <p className="text-muted-foreground">
                  No fee structures match your current filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStructures.map((structure) => (
                  <div key={structure._id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{structure.name}</h4>
                          <Badge 
                            variant={structure.status === "active" ? "default" : "secondary"}
                          >
                            {structure.status}
                          </Badge>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Amount</p>
                            <p className="font-medium">
                              KES {(structure.amount / 100).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Frequency</p>
                            <p className="font-medium capitalize">{structure.frequency}</p>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Grade</p>
                            <p className="font-medium">{structure.grade}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Academic Year</p>
                            <p className="font-medium">{structure.academicYear}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Created {format(new Date(structure.createdAt), "PPP")}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Discount Rules Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Discount Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Sample discount rules - in real app, this would come from backend */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">Early Bird Discount</h4>
                      <Badge variant="default">Active</Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">Percentage</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-medium">10%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Conditions</p>
                      <p className="font-medium">Payment made 30 days before due date</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">Sibling Discount</h4>
                      <Badge variant="default">Active</Badge>
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-medium">Percentage</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Value</p>
                        <p className="font-medium">15%</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">Conditions</p>
                      <p className="font-medium">2+ siblings enrolled</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Discount Rule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Approval Workflows */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Approval Workflows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Fee Structure Approval</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require approval for new structures</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Approval level</span>
                      <span className="text-sm font-medium">Finance Manager</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Discount Approval</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Require approval for discounts</span>
                      <Badge variant="default">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Max discount limit</span>
                      <span className="text-sm font-medium">25%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
