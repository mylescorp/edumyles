"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Edit,
  Trash2,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";

interface Deal {
  _id: string;
  schoolName: string;
  contactPerson: string;
  email: string;
  phone: string;
  county: string;
  schoolType: string;
  currentStudents: number;
  potentialStudents: number;
  stage: "lead" | "qualified" | "proposal" | "negotiation" | "closed_won" | "closed_lost";
  value: number;
  currency: string;
  source: string;
  assignedTo: string;
  createdAt: number;
  lastActivity: number;
  expectedCloseDate: number;
  probability: number;
  tags: string[];
  notes: string;
  activities: Activity[];
}

interface Activity {
  _id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  title: string;
  description: string;
  createdAt: number;
  createdBy: string;
}

const mockDeals: Deal[] = [
  {
    _id: "1",
    schoolName: "Nairobi International Academy",
    contactPerson: "Sarah Johnson",
    email: "sarah@nairobi-academy.edu",
    phone: "+254 712 345 678",
    county: "Nairobi",
    schoolType: "International",
    currentStudents: 450,
    potentialStudents: 600,
    stage: "proposal",
    value: 150000,
    currency: "KES",
    source: "Website",
    assignedTo: "michael.chen@edumyles.com",
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now() - 2 * 24 * 60 * 60 * 1000,
    expectedCloseDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
    probability: 60,
    tags: ["International", "Urban", "Large"],
    notes: "Interested in Growth plan with custom modules. Decision maker is the school director.",
    activities: [
      {
        _id: "1",
        type: "call",
        title: "Initial discovery call",
        description: "Discussed their current system pain points and requirements",
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        createdBy: "michael.chen@edumyles.com"
      },
      {
        _id: "2",
        type: "email",
        title: "Sent proposal",
        description: "Custom proposal for Growth plan with pricing",
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
        createdBy: "michael.chen@edumyles.com"
      }
    ]
  },
  {
    _id: "2",
    schoolName: "Mombasa Primary School",
    contactPerson: "James Kimani",
    email: "james@mombasa-primary.edu",
    phone: "+254 734 567 890",
    county: "Mombasa",
    schoolType: "Public",
    currentStudents: 800,
    potentialStudents: 950,
    stage: "qualified",
    value: 75000,
    currency: "KES",
    source: "Referral",
    assignedTo: "sarah.wilson@edumyles.com",
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now() - 1 * 24 * 60 * 60 * 1000,
    expectedCloseDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    probability: 40,
    tags: ["Public", "Coastal", "Medium"],
    notes: "Budget conscious, interested in Starter plan with potential upgrade.",
    activities: [
      {
        _id: "3",
        type: "meeting",
        title: "School visit",
        description: "On-site demonstration of the platform",
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
        createdBy: "sarah.wilson@edumyles.com"
      }
    ]
  },
  {
    _id: "3",
    schoolName: "Kisumu High School",
    contactPerson: "Grace Ochieng",
    email: "grace@kisumu-high.edu",
    phone: "+254 756 234 567",
    county: "Kisumu",
    schoolType: "Secondary",
    currentStudents: 1200,
    potentialStudents: 1200,
    stage: "negotiation",
    value: 200000,
    currency: "KES",
    source: "Cold Outreach",
    assignedTo: "david.kim@edumyles.com",
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now() - 3 * 24 * 60 * 60 * 1000,
    expectedCloseDate: Date.now() + 7 * 24 * 60 * 60 * 1000,
    probability: 80,
    tags: ["Secondary", "Large", "Government"],
    notes: "Negotiating pricing for Pro plan. Government approval pending.",
    activities: [
      {
        _id: "4",
        type: "call",
        title: "Price negotiation",
        description: "Discussed discount options for bulk licensing",
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
        createdBy: "david.kim@edumyles.com"
      }
    ]
  },
  {
    _id: "4",
    schoolName: "Eldoret Academy",
    contactPerson: "Peter Kiprop",
    email: "peter@eldoret-academy.edu",
    phone: "+254 723 890 123",
    county: "Uasin Gishu",
    schoolType: "Private",
    currentStudents: 300,
    potentialStudents: 400,
    stage: "closed_won",
    value: 100000,
    currency: "KES",
    source: "Conference",
    assignedTo: "michael.chen@edumyles.com",
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now() - 10 * 24 * 60 * 60 * 1000,
    expectedCloseDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    probability: 100,
    tags: ["Private", "Rural", "Small"],
    notes: "Signed up for Growth plan. Implementation starts next week.",
    activities: [
      {
        _id: "5",
        type: "task",
        title: "Contract signed",
        description: "Received signed contract and first payment",
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
        createdBy: "michael.chen@edumyles.com"
      }
    ]
  },
  {
    _id: "5",
    schoolName: "Kitengela Academy",
    contactPerson: "Lucy Wanjiku",
    email: "lucy@kitengela-academy.edu",
    phone: "+254 745 678 901",
    county: "Kajiado",
    schoolType: "Private",
    currentStudents: 200,
    potentialStudents: 250,
    stage: "lead",
    value: 50000,
    currency: "KES",
    source: "Website",
    assignedTo: "sarah.wilson@edumyles.com",
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    lastActivity: Date.now() - 5 * 24 * 60 * 60 * 1000,
    expectedCloseDate: Date.now() + 45 * 24 * 60 * 60 * 1000,
    probability: 20,
    tags: ["Private", "Suburban", "Small"],
    notes: "Initial inquiry received. Follow up scheduled for next week.",
    activities: [
      {
        _id: "6",
        type: "email",
        title: "Welcome email sent",
        description: "Initial response with product information",
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        createdBy: "sarah.wilson@edumyles.com"
      }
    ]
  }
];

const pipelineStages = [
  { id: "lead", name: "Lead", color: "bg-gray-100 border-gray-200", icon: Users },
  { id: "qualified", name: "Qualified", color: "bg-blue-100 border-blue-200", icon: CheckCircle },
  { id: "proposal", name: "Proposal", color: "bg-yellow-100 border-yellow-200", icon: AlertCircle },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-100 border-orange-200", icon: TrendingUp },
  { id: "closed_won", name: "Closed Won", color: "bg-green-100 border-green-200", icon: CheckCircle },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-100 border-red-200", icon: XCircle }
];

export default function CRMPipelinePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");

  const filteredDeals = mockDeals.filter(deal => {
    const matchesSearch = searchQuery === "" || 
      deal.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStage = selectedStage === "all" || deal.stage === selectedStage;
    const matchesAssignee = selectedAssignee === "all" || deal.assignedTo === selectedAssignee;
    const matchesCounty = selectedCounty === "all" || deal.county === selectedCounty;
    
    return matchesSearch && matchesStage && matchesAssignee && matchesCounty;
  });

  const getStageColor = (stage: string) => {
    const stageConfig = pipelineStages.find(s => s.id === stage);
    return stageConfig?.color || "bg-gray-100";
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-KE');
  };

  const getPipelineValue = (stage: string) => {
    return filteredDeals
      .filter(deal => deal.stage === stage)
      .reduce((total, deal) => total + deal.value, 0);
  };

  const getTotalValue = () => {
    return filteredDeals.reduce((total, deal) => total + deal.value, 0);
  };

  const getWeightedValue = () => {
    return filteredDeals.reduce((total, deal) => total + (deal.value * deal.probability / 100), 0);
  };

  const handleExport = () => {
    const csvContent = [
      ["School Name", "Contact", "Email", "Phone", "County", "Stage", "Value", "Probability", "Assigned To"],
      ...filteredDeals.map(deal => [
        deal.schoolName,
        deal.contactPerson,
        deal.email,
        deal.phone,
        deal.county,
        deal.stage,
        formatCurrency(deal.value, deal.currency),
        `${deal.probability}%`,
        deal.assignedTo
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "crm_pipeline.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const PipelineView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Pipeline</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "pipeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
          >
            <Users className="h-4 w-4 mr-1" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Filter className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button onClick={() => {}}>
            <Plus className="h-4 w-4 mr-1" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{filteredDeals.length}</div>
            <div className="text-sm text-muted-foreground">Total Deals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(getTotalValue(), "KES")}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(getWeightedValue(), "KES")}</div>
            <div className="text-sm text-muted-foreground">Weighted Value</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {filteredDeals.length > 0 ? Math.round(getWeightedValue() / getTotalValue() * 100) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Win Probability</div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-6 gap-4">
        {pipelineStages.map((stage) => {
          const stageDeals = filteredDeals.filter(deal => deal.stage === stage.id);
          const stageValue = getPipelineValue(stage.id);
          const StageIcon = stage.icon;
          
          return (
            <Card key={stage.id} className={`${stage.color} min-h-[400px]`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <StageIcon className="h-4 w-4" />
                  {stage.name}
                </CardTitle>
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-xs">
                    {stageDeals.length} deals
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {formatCurrency(stageValue, "KES")}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {stageDeals.map((deal) => (
                  <Card key={deal._id} className="cursor-pointer hover:shadow-md transition-shadow bg-white">
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate">{deal.schoolName}</div>
                        <div className="text-xs text-muted-foreground truncate">{deal.contactPerson}</div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {deal.probability}%
                          </Badge>
                          <div className="text-xs font-medium">
                            {formatCurrency(deal.value, "KES")}
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Closes: {formatDate(deal.expectedCloseDate)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const ListView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Deals List</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "pipeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("pipeline")}
          >
            <Users className="h-4 w-4 mr-1" />
            Pipeline
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <Filter className="h-4 w-4 mr-1" />
            List
          </Button>
          <Button onClick={() => {}}>
            <Plus className="h-4 w-4 mr-1" />
            New Deal
          </Button>
        </div>
      </div>

      {/* Deals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">School</th>
                  <th className="text-left p-3 font-semibold">Contact</th>
                  <th className="text-left p-3 font-semibold">County</th>
                  <th className="text-left p-3 font-semibold">Stage</th>
                  <th className="text-left p-3 font-semibold">Value</th>
                  <th className="text-left p-3 font-semibold">Probability</th>
                  <th className="text-left p-3 font-semibold">Assigned To</th>
                  <th className="text-left p-3 font-semibold">Close Date</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr key={deal._id} className="border-b hover:bg-muted/50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{deal.schoolName}</div>
                        <div className="text-sm text-muted-foreground">{deal.schoolType}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="font-medium">{deal.contactPerson}</div>
                        <div className="text-sm text-muted-foreground">{deal.email}</div>
                      </div>
                    </td>
                    <td className="p-3">{deal.county}</td>
                    <td className="p-3">
                      <Badge className={getStageColor(deal.stage)}>
                        {deal.stage.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="p-3 font-medium">
                      {formatCurrency(deal.value, deal.currency)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${deal.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{deal.probability}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm">{deal.assignedTo.split("@")[0]}</td>
                    <td className="p-3 text-sm">{formatDate(deal.expectedCloseDate)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
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
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="CRM Pipeline" 
        description="Manage sales pipeline and track deal progression"
        breadcrumbs={[{ label: "CRM", href: "/platform/crm" }]}
      />

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search deals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
              </div>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  {pipelineStages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="County" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Counties</SelectItem>
                  <SelectItem value="Nairobi">Nairobi</SelectItem>
                  <SelectItem value="Mombasa">Mombasa</SelectItem>
                  <SelectItem value="Kisumu">Kisumu</SelectItem>
                  <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                  <SelectItem value="Kajiado">Kajiado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assigned To" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="michael.chen@edumyles.com">Michael Chen</SelectItem>
                  <SelectItem value="sarah.wilson@edumyles.com">Sarah Wilson</SelectItem>
                  <SelectItem value="david.kim@edumyles.com">David Kim</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
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

      {/* Render appropriate view */}
      {viewMode === "pipeline" ? <PipelineView /> : <ListView />}
    </div>
  );
}
