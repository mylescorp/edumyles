"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../../convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Building,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  Edit,
  Trash2,
  Plus,
  PhoneCall,
  Mail as MailIcon,
  Calendar as CalendarIcon,
  FileText,
  Eye,
  Download,
  RefreshCw
} from "lucide-react";

interface Activity {
  _id: string;
  type: "call" | "email" | "meeting" | "note" | "task";
  title: string;
  description: string;
  createdAt: number;
  createdBy: string;
}

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

const mockDeal: Deal = {
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
  notes: "Interested in Growth plan with custom modules. Decision maker is the school director. They have specific requirements for student assessment and parent communication modules. Budget is flexible but needs approval from board.",
  activities: [
    {
      _id: "1",
      type: "call",
      title: "Initial discovery call",
      description: "Discussed their current system pain points and requirements. They use a legacy system that's difficult to maintain. Key pain points: manual grade reporting, poor parent communication, limited analytics.",
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
      createdBy: "michael.chen@edumyles.com"
    },
    {
      _id: "2",
      type: "meeting",
      title: "On-site demonstration",
      description: "Full platform demonstration for school management team. Showed student management, gradebook, parent portal, and reporting features. Team was impressed with the user interface and mobile app.",
      createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000,
      createdBy: "michael.chen@edumyles.com"
    },
    {
      _id: "3",
      type: "email",
      title: "Sent proposal",
      description: "Custom proposal for Growth plan with pricing. Included 3-year contract with annual maintenance. Proposal covers 600 students with custom branding and data migration.",
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      createdBy: "michael.chen@edumyles.com"
    },
    {
      _id: "4",
      type: "note",
      title: "Follow-up required",
      description: "School board meeting scheduled for next week to review proposal. Need to prepare ROI analysis and case studies from similar schools.",
      createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
      createdBy: "michael.chen@edumyles.com"
    }
  ]
};

const pipelineStages = [
  { id: "lead", name: "Lead", color: "bg-gray-100 border-gray-200" },
  { id: "qualified", name: "Qualified", color: "bg-blue-100 border-blue-200" },
  { id: "proposal", name: "Proposal", color: "bg-yellow-100 border-yellow-200" },
  { id: "negotiation", name: "Negotiation", color: "bg-orange-100 border-orange-200" },
  { id: "closed_won", name: "Closed Won", color: "bg-green-100 border-green-200" },
  { id: "closed_lost", name: "Closed Lost", color: "bg-red-100 border-red-200" }
];

export default function DealDetailPage() {
  const params = useParams();
  const dealId = params.dealId as string;
  const { sessionToken } = useAuth();

  const dealData = usePlatformQuery(
    api.platform.crm.queries.getDealById,
    { sessionToken: sessionToken || "", dealId },
    !!sessionToken
  );

  const [deal, setDeal] = useState<Deal | null>(null);

  // Sync query data to local state for editing
  if (dealData && !deal) {
    setDeal(dealData as any);
  }

  const [newActivity, setNewActivity] = useState({
    type: "note" as const,
    title: "",
    description: ""
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<Deal>(deal);

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

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-KE');
  };

  const getStageColor = (stage: string) => {
    const stageConfig = pipelineStages.find(s => s.id === stage);
    return stageConfig?.color || "bg-gray-100";
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "call": return <PhoneCall className="h-4 w-4" />;
      case "email": return <MailIcon className="h-4 w-4" />;
      case "meeting": return <CalendarIcon className="h-4 w-4" />;
      case "note": return <FileText className="h-4 w-4" />;
      case "task": return <CheckCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleAddActivity = () => {
    if (newActivity.title && newActivity.description) {
      const activity: Activity = {
        _id: Date.now().toString(),
        ...newActivity,
        createdAt: Date.now(),
        createdBy: "current.user@edumyles.com"
      };
      
      setDeal({
        ...deal,
        activities: [activity, ...deal.activities],
        lastActivity: Date.now()
      });
      
      setNewActivity({ type: "note", title: "", description: "" });
    }
  };

  const handleUpdateDeal = () => {
    setDeal(editedDeal);
    setIsEditing(false);
  };

  const handleStageChange = (newStage: string) => {
    const updatedDeal = { ...deal, stage: newStage as Deal['stage'] };
    setDeal(updatedDeal);
    setEditedDeal(updatedDeal);
  };

  if (!deal) return <div className="p-6 text-center text-muted-foreground">Loading deal details...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={deal.schoolName} 
        description="Manage deal details and track activities"
        breadcrumbs={[
          { label: "CRM", href: "/platform/crm" },
          { label: "Pipeline", href: "/platform/crm" },
          { label: deal.schoolName, href: `/platform/crm/${dealId}` }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Deal Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deal Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Deal Overview</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4 mr-1" />
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="schoolName">School Name</Label>
                      <Input
                        id="schoolName"
                        value={editedDeal.schoolName}
                        onChange={(e) => setEditedDeal({...editedDeal, schoolName: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        value={editedDeal.contactPerson}
                        onChange={(e) => setEditedDeal({...editedDeal, contactPerson: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedDeal.email}
                        onChange={(e) => setEditedDeal({...editedDeal, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={editedDeal.phone}
                        onChange={(e) => setEditedDeal({...editedDeal, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="value">Deal Value</Label>
                      <Input
                        id="value"
                        type="number"
                        value={editedDeal.value}
                        onChange={(e) => setEditedDeal({...editedDeal, value: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="probability">Probability (%)</Label>
                      <Input
                        id="probability"
                        type="number"
                        min="0"
                        max="100"
                        value={editedDeal.probability}
                        onChange={(e) => setEditedDeal({...editedDeal, probability: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={handleUpdateDeal}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground">School Name</div>
                      <div className="font-medium">{deal.schoolName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Contact Person</div>
                      <div className="font-medium">{deal.contactPerson}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Email</div>
                      <div className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {deal.email}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Phone</div>
                      <div className="font-medium flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {deal.phone}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">County</div>
                      <div className="font-medium flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {deal.county}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">School Type</div>
                      <div className="font-medium">{deal.schoolType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Students</div>
                      <div className="font-medium">{deal.currentStudents}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Potential Students</div>
                      <div className="font-medium">{deal.potentialStudents}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Deal Value</div>
                      <div className="font-medium text-lg text-green-600">
                        {formatCurrency(deal.value, deal.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Probability</div>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${deal.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{deal.probability}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Tags</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {deal.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Notes</div>
                    <div className="text-sm bg-muted p-3 rounded-lg">
                      {deal.notes}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activities Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Activity */}
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="activityType">Type</Label>
                    <Select value={newActivity.type} onValueChange={(value: any) => setNewActivity({...newActivity, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activityTitle">Title</Label>
                    <Input
                      id="activityTitle"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                      placeholder="Activity title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="activityDescription">Description</Label>
                    <Input
                      id="activityDescription"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                      placeholder="Brief description"
                    />
                  </div>
                </div>
                <Button onClick={handleAddActivity} disabled={!newActivity.title || !newActivity.description}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Activity
                </Button>
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                {deal.activities.map((activity, index) => (
                  <div key={activity._id} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(activity.createdAt)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.description}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        By {activity.createdBy.split("@")[0]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions and Status */}
        <div className="space-y-6">
          {/* Deal Status */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="stage">Current Stage</Label>
                <Select value={deal.stage} onValueChange={handleStageChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pipelineStages.map(stage => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="assignedTo">Assigned To</Label>
                <Select value={deal.assignedTo}>
                  <SelectTrigger>
                    <SelectValue />
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
                  value={new Date(deal.expectedCloseDate).toISOString().split('T')[0]}
                  onChange={(e) => setDeal({...deal, expectedCloseDate: new Date(e.target.value).getTime()})}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="font-medium">{formatDate(deal.createdAt)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Last Activity</div>
                <div className="font-medium">{formatDate(deal.lastActivity)}</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Source</div>
                <div className="font-medium">{deal.source}</div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <PhoneCall className="h-4 w-4 mr-2" />
                Log Call
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <MailIcon className="h-4 w-4 mr-2" />
                Send Email
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Create Proposal
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Deal
              </Button>
            </CardContent>
          </Card>

          {/* Deal Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Deal Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Deal Age</div>
                <div className="font-medium">
                  {Math.round((Date.now() - deal.createdAt) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Days to Close</div>
                <div className="font-medium">
                  {Math.round((deal.expectedCloseDate - Date.now()) / (1000 * 60 * 60 * 24))} days
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Student Growth</div>
                <div className="font-medium">
                  +{deal.potentialStudents - deal.currentStudents} students
                  <span className="text-sm text-muted-foreground ml-2">
                    ({Math.round(((deal.potentialStudents - deal.currentStudents) / deal.currentStudents) * 100)}%)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Value per Student</div>
                <div className="font-medium">
                  {formatCurrency(deal.value / deal.potentialStudents, deal.currency)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
