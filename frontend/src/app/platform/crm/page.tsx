"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  RefreshCw,
  GripVertical,
  X
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
}

let initialDeals: Deal[] = [
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
    notes: "Interested in Growth plan with custom modules. Decision maker is the school director."
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
    notes: "Budget conscious, interested in Starter plan with potential upgrade."
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
    notes: "Negotiating pricing for Pro plan. Government approval pending."
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
    notes: "Signed up for Growth plan. Implementation starts next week."
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
    notes: "Initial inquiry received. Follow up scheduled for next week."
  }
];

const pipelineStages = [
  { id: "lead", name: "Lead", color: "bg-gray-100 border-gray-200" },
  { id: "qualified", name: "Qualified", color: "bg-blue-100 border-blue-200" },
  { id: "proposal", name: "Proposal", color: "bg-yellow-100 border-yellow-200" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-100 border-orange-200" },
  { id: "closed_won", name: "Closed Won", color: "bg-green-100 border-green-200" },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-100 border-red-200" }
];

export default function CompleteCRMPage() {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("all");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"pipeline" | "list">("pipeline");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null);
  
  const [newDeal, setNewDeal] = useState({
    schoolName: "",
    contactPerson: "",
    email: "",
    phone: "",
    county: "",
    schoolType: "",
    currentStudents: 0,
    potentialStudents: 0,
    stage: "lead" as const,
    value: 0,
    currency: "KES",
    source: "",
    assignedTo: "",
    expectedCloseDate: "",
    probability: 20,
    tags: "",
    notes: ""
  });

  const filteredDeals = deals.filter(deal => {
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

  const handleAddDeal = () => {
    if (!newDeal.schoolName || !newDeal.contactPerson || !newDeal.email) {
      alert("Please fill in required fields");
      return;
    }

    const deal: Deal = {
      _id: Date.now().toString(),
      schoolName: newDeal.schoolName,
      contactPerson: newDeal.contactPerson,
      email: newDeal.email,
      phone: newDeal.phone,
      county: newDeal.county,
      schoolType: newDeal.schoolType,
      currentStudents: newDeal.currentStudents,
      potentialStudents: newDeal.potentialStudents,
      stage: newDeal.stage,
      value: newDeal.value,
      currency: newDeal.currency,
      source: newDeal.source,
      assignedTo: newDeal.assignedTo,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      expectedCloseDate: newDeal.expectedCloseDate ? new Date(newDeal.expectedCloseDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
      probability: newDeal.probability,
      tags: newDeal.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
      notes: newDeal.notes
    };

    setDeals([deal, ...deals]);
    setIsAddDialogOpen(false);
    resetNewDeal();
  };

  const handleEditDeal = () => {
    if (!editingDeal) return;
    
    const updatedDeals = deals.map(deal => 
      deal._id === editingDeal._id 
        ? {
            ...editingDeal,
            tags: editingDeal.tags.split(",").map(tag => tag.trim()).filter(tag => tag),
            expectedCloseDate: editingDeal.expectedCloseDate ? new Date(editingDeal.expectedCloseDate).getTime() : editingDeal.expectedCloseDate
          }
        : deal
    );
    
    setDeals(updatedDeals);
    setIsEditDialogOpen(false);
    setEditingDeal(null);
  };

  const handleDeleteDeal = (dealId: string) => {
    if (confirm("Are you sure you want to delete this deal?")) {
      setDeals(deals.filter(deal => deal._id !== dealId));
    }
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedDeal) return;

    const updatedDeals = deals.map(deal => 
      deal._id === draggedDeal._id 
        ? { ...deal, stage: targetStage as Deal['stage'], lastActivity: Date.now() }
        : deal
    );
    
    setDeals(updatedDeals);
    setDraggedDeal(null);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
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
    a.download = `crm_pipeline_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetNewDeal = () => {
    setNewDeal({
      schoolName: "",
      contactPerson: "",
      email: "",
      phone: "",
      county: "",
      schoolType: "",
      currentStudents: 0,
      potentialStudents: 0,
      stage: "lead",
      value: 0,
      currency: "KES",
      source: "",
      assignedTo: "",
      expectedCloseDate: "",
      probability: 20,
      tags: "",
      notes: ""
    });
  };

  const openEditDialog = (deal: Deal) => {
    setEditingDeal({
      ...deal,
      expectedCloseDate: new Date(deal.expectedCloseDate).toISOString().split('T')[0],
      tags: deal.tags.join(", ")
    });
    setIsEditDialogOpen(true);
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Deal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      value={newDeal.schoolName}
                      onChange={(e) => setNewDeal({...newDeal, schoolName: e.target.value})}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={newDeal.contactPerson}
                      onChange={(e) => setNewDeal({...newDeal, contactPerson: e.target.value})}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDeal.email}
                      onChange={(e) => setNewDeal({...newDeal, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newDeal.phone}
                      onChange={(e) => setNewDeal({...newDeal, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Select value={newDeal.county} onValueChange={(value) => setNewDeal({...newDeal, county: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nairobi">Nairobi</SelectItem>
                        <SelectItem value="Mombasa">Mombasa</SelectItem>
                        <SelectItem value="Kisumu">Kisumu</SelectItem>
                        <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                        <SelectItem value="Kajiado">Kajiado</SelectItem>
                        <SelectItem value="Nakuru">Nakuru</SelectItem>
                        <SelectItem value="Kiambu">Kiambu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schoolType">School Type</Label>
                    <Select value={newDeal.schoolType} onValueChange={(value) => setNewDeal({...newDeal, schoolType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Deal Value (KES)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newDeal.value}
                      onChange={(e) => setNewDeal({...newDeal, value: parseInt(e.target.value) || 0})}
                      placeholder="Enter deal value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={newDeal.probability}
                      onChange={(e) => setNewDeal({...newDeal, probability: parseInt(e.target.value) || 0})}
                      placeholder="Enter probability"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={newDeal.source} onValueChange={(value) => setNewDeal({...newDeal, source: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                        <SelectItem value="Conference">Conference</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select value={newDeal.assignedTo} onValueChange={(value) => setNewDeal({...newDeal, assignedTo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="michael.chen@edumyles.com">Michael Chen</SelectItem>
                        <SelectItem value="sarah.wilson@edumyles.com">Sarah Wilson</SelectItem>
                        <SelectItem value="david.kim@edumyles.com">David Kim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={newDeal.expectedCloseDate}
                      onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newDeal.tags}
                    onChange={(e) => setNewDeal({...newDeal, tags: e.target.value})}
                    placeholder="e.g. Urban, Large, Private"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newDeal.notes}
                    onChange={(e) => setNewDeal({...newDeal, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDeal}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
          
          return (
            <Card 
              key={stage.id} 
              className={`${stage.color} min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
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
                  <Card 
                    key={deal._id} 
                    className="cursor-pointer hover:shadow-md transition-shadow bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, deal)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <GripVertical className="h-3 w-3 text-gray-400 cursor-move" />
                          <span className="text-xs text-gray-500">Drag</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(deal);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDeal(deal._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
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
                        {deal.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {deal.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {deal.tags.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{deal.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Deal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Deal</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="schoolName">School Name *</Label>
                    <Input
                      id="schoolName"
                      value={newDeal.schoolName}
                      onChange={(e) => setNewDeal({...newDeal, schoolName: e.target.value})}
                      placeholder="Enter school name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input
                      id="contactPerson"
                      value={newDeal.contactPerson}
                      onChange={(e) => setNewDeal({...newDeal, contactPerson: e.target.value})}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newDeal.email}
                      onChange={(e) => setNewDeal({...newDeal, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={newDeal.phone}
                      onChange={(e) => setNewDeal({...newDeal, phone: e.target.value})}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Select value={newDeal.county} onValueChange={(value) => setNewDeal({...newDeal, county: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select county" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nairobi">Nairobi</SelectItem>
                        <SelectItem value="Mombasa">Mombasa</SelectItem>
                        <SelectItem value="Kisumu">Kisumu</SelectItem>
                        <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                        <SelectItem value="Kajiado">Kajiado</SelectItem>
                        <SelectItem value="Nakuru">Nakuru</SelectItem>
                        <SelectItem value="Kiambu">Kiambu</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="schoolType">School Type</Label>
                    <Select value={newDeal.schoolType} onValueChange={(value) => setNewDeal({...newDeal, schoolType: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Public">Public</SelectItem>
                        <SelectItem value="Private">Private</SelectItem>
                        <SelectItem value="International">International</SelectItem>
                        <SelectItem value="Secondary">Secondary</SelectItem>
                        <SelectItem value="Primary">Primary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="value">Deal Value (KES)</Label>
                    <Input
                      id="value"
                      type="number"
                      value={newDeal.value}
                      onChange={(e) => setNewDeal({...newDeal, value: parseInt(e.target.value) || 0})}
                      placeholder="Enter deal value"
                    />
                  </div>
                  <div>
                    <Label htmlFor="probability">Probability (%)</Label>
                    <Input
                      id="probability"
                      type="number"
                      min="0"
                      max="100"
                      value={newDeal.probability}
                      onChange={(e) => setNewDeal({...newDeal, probability: parseInt(e.target.value) || 0})}
                      placeholder="Enter probability"
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select value={newDeal.source} onValueChange={(value) => setNewDeal({...newDeal, source: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Website">Website</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                        <SelectItem value="Conference">Conference</SelectItem>
                        <SelectItem value="Social Media">Social Media</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select value={newDeal.assignedTo} onValueChange={(value) => setNewDeal({...newDeal, assignedTo: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Assign to" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="michael.chen@edumyles.com">Michael Chen</SelectItem>
                        <SelectItem value="sarah.wilson@edumyles.com">Sarah Wilson</SelectItem>
                        <SelectItem value="david.kim@edumyles.com">David Kim</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expectedCloseDate">Expected Close Date</Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={newDeal.expectedCloseDate}
                      onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={newDeal.tags}
                    onChange={(e) => setNewDeal({...newDeal, tags: e.target.value})}
                    placeholder="e.g. Urban, Large, Private"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newDeal.notes}
                    onChange={(e) => setNewDeal({...newDeal, notes: e.target.value})}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDeal}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Deal
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(deal)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteDeal(deal._id)}>
                          <Trash2 className="h-4 w-4" />
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
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render appropriate view */}
      {viewMode === "pipeline" ? <PipelineView /> : <ListView />}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Deal</DialogTitle>
          </DialogHeader>
          {editingDeal && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-schoolName">School Name *</Label>
                  <Input
                    id="edit-schoolName"
                    value={editingDeal.schoolName}
                    onChange={(e) => setEditingDeal({...editingDeal, schoolName: e.target.value})}
                    placeholder="Enter school name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contactPerson">Contact Person *</Label>
                  <Input
                    id="edit-contactPerson"
                    value={editingDeal.contactPerson}
                    onChange={(e) => setEditingDeal({...editingDeal, contactPerson: e.target.value})}
                    placeholder="Enter contact name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">Email *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editingDeal.email}
                    onChange={(e) => setEditingDeal({...editingDeal, email: e.target.value})}
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={editingDeal.phone}
                    onChange={(e) => setEditingDeal({...editingDeal, phone: e.target.value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-county">County</Label>
                  <Select value={editingDeal.county} onValueChange={(value) => setEditingDeal({...editingDeal, county: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select county" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Nairobi">Nairobi</SelectItem>
                      <SelectItem value="Mombasa">Mombasa</SelectItem>
                      <SelectItem value="Kisumu">Kisumu</SelectItem>
                      <SelectItem value="Uasin Gishu">Uasin Gishu</SelectItem>
                      <SelectItem value="Kajiado">Kajiado</SelectItem>
                      <SelectItem value="Nakuru">Nakuru</SelectItem>
                      <SelectItem value="Kiambu">Kiambu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-schoolType">School Type</Label>
                  <Select value={editingDeal.schoolType} onValueChange={(value) => setEditingDeal({...editingDeal, schoolType: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Private">Private</SelectItem>
                      <SelectItem value="International">International</SelectItem>
                      <SelectItem value="Secondary">Secondary</SelectItem>
                      <SelectItem value="Primary">Primary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-value">Deal Value (KES)</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    value={editingDeal.value}
                    onChange={(e) => setEditingDeal({...editingDeal, value: parseInt(e.target.value) || 0})}
                    placeholder="Enter deal value"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-probability">Probability (%)</Label>
                  <Input
                    id="edit-probability"
                    type="number"
                    min="0"
                    max="100"
                    value={editingDeal.probability}
                    onChange={(e) => setEditingDeal({...editingDeal, probability: parseInt(e.target.value) || 0})}
                    placeholder="Enter probability"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stage">Stage</Label>
                  <Select value={editingDeal.stage} onValueChange={(value) => setEditingDeal({...editingDeal, stage: value as Deal['stage']})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-source">Source</Label>
                  <Select value={editingDeal.source} onValueChange={(value) => setEditingDeal({...editingDeal, source: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website">Website</SelectItem>
                      <SelectItem value="Referral">Referral</SelectItem>
                      <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Social Media">Social Media</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-assignedTo">Assigned To</Label>
                  <Select value={editingDeal.assignedTo} onValueChange={(value) => setEditingDeal({...editingDeal, assignedTo: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Assign to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="michael.chen@edumyles.com">Michael Chen</SelectItem>
                      <SelectItem value="sarah.wilson@edumyles.com">Sarah Wilson</SelectItem>
                      <SelectItem value="david.kim@edumyles.com">David Kim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-expectedCloseDate">Expected Close Date</Label>
                  <Input
                    id="edit-expectedCloseDate"
                    type="date"
                    value={editingDeal.expectedCloseDate}
                    onChange={(e) => setEditingDeal({...editingDeal, expectedCloseDate: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
                <Input
                  id="edit-tags"
                  value={editingDeal.tags}
                  onChange={(e) => setEditingDeal({...editingDeal, tags: e.target.value})}
                  placeholder="e.g. Urban, Large, Private"
                />
              </div>
              <div>
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={editingDeal.notes}
                  onChange={(e) => setEditingDeal({...editingDeal, notes: e.target.value})}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditDeal}>
              <Edit className="h-4 w-4 mr-1" />
              Update Deal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
