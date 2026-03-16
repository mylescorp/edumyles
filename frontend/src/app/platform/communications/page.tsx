"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Send, 
  Users, 
  FileText, 
  BarChart3, 
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Mail,
  Smartphone,
  Bell,
  Eye,
  Edit,
  Trash2,
  Pause,
  Play,
  Download
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  status: string;
  channels: string[];
  createdAt: number;
  scheduledFor: number;
  stats: {
    totalRecipients: number;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    failed: number;
  };
}

interface Template {
  _id: string;
  name: string;
  description: string;
  category: string;
  channels: string[];
  subject?: string;
  content: string;
  variables: Array<{
    name: string;
    type: string;
    defaultValue?: string;
    required: boolean;
  }>;
  usageCount: number;
  createdAt: number;
}

export default function CommunicationsPage() {
  const { sessionToken } = useAuth();
  const [activeTab, setActiveTab] = useState("campaigns");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isCreateTemplateOpen, setIsCreateTemplateOpen] = useState(false);

  // Real Convex queries
  const campaignsData = usePlatformQuery(
    api.platform.communications.queries.listCampaigns,
    { sessionToken: sessionToken || "" }
  );

  const templatesData = usePlatformQuery(
    api.platform.communications.queries.listTemplates,
    { sessionToken: sessionToken || "" }
  );

  const deliveryAnalytics = usePlatformQuery(
    api.platform.communications.queries.getDeliveryAnalytics,
    { sessionToken: sessionToken || "" }
  );

  const createCampaign = useMutation(api.platform.communications.mutations.createCampaign);
  const createTemplate = useMutation(api.platform.communications.mutations.createTemplate);

  if (!campaignsData) return <LoadingSkeleton variant="page" />;

  const campaigns: Campaign[] = (campaignsData || []).map((c: any) => ({
    _id: c._id,
    name: c.name,
    description: c.description || "",
    status: c.status,
    channels: c.channels || [],
    createdAt: c.createdAt,
    scheduledFor: c.scheduledFor || c.createdAt,
    stats: c.stats || {
      totalRecipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      failed: 0,
    },
  }));

  const templates: Template[] = (templatesData || []).map((t: any) => ({
    _id: t._id,
    name: t.name,
    description: t.description || "",
    category: t.category || "general",
    channels: t.channels || [],
    subject: t.subject,
    content: t.content || "",
    variables: t.variables || [],
    usageCount: t.usageCount || 0,
    createdAt: t.createdAt,
  }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "bg-green-100 text-green-700 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed": return "bg-gray-100 text-gray-700 border-gray-200";
      case "paused": return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "draft": return "bg-purple-100 text-purple-700 border-purple-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email": return <Mail className="h-4 w-4" />;
      case "sms": return <Smartphone className="h-4 w-4" />;
      case "push": return <Bell className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return "Just now";
  };

  const CampaignsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
        </div>
        <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input id="campaign-name" placeholder="Enter campaign name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-description">Description</Label>
                <Textarea id="campaign-description" placeholder="Describe your campaign" />
              </div>
              <div className="grid gap-2">
                <Label>Channels</Label>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-1" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm">
                    <Smartphone className="h-4 w-4 mr-1" />
                    SMS
                  </Button>
                  <Button variant="outline" size="sm">
                    <Bell className="h-4 w-4 mr-1" />
                    Push
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="campaign-message">Message</Label>
                <Textarea id="campaign-message" placeholder="Enter your message" rows={4} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateCampaignOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateCampaignOpen(false)}>
                Create Campaign
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign) => (
          <Card key={campaign._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{campaign.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Created {formatRelativeTime(campaign.createdAt)}</span>
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {campaign.status === "running" ? (
                    <Button variant="outline" size="sm">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {campaign.channels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="flex items-center space-x-1">
                      {getChannelIcon(channel)}
                      <span>{channel}</span>
                    </Badge>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{campaign.stats.totalRecipients}</div>
                    <div className="text-sm text-muted-foreground">Recipients</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{campaign.stats.delivered}</div>
                    <div className="text-sm text-muted-foreground">Delivered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{campaign.stats.opened}</div>
                    <div className="text-sm text-muted-foreground">Opened</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{campaign.stats.clicked}</div>
                    <div className="text-sm text-muted-foreground">Clicked</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const TemplatesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80"
          />
        </div>
        <Dialog open={isCreateTemplateOpen} onOpenChange={setIsCreateTemplateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input id="template-name" placeholder="Enter template name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea id="template-description" placeholder="Describe your template" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="alerts">Alerts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Channels</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select channels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-subject">Subject (Email)</Label>
                <Input id="template-subject" placeholder="Email subject" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="template-content">Content</Label>
                <Textarea id="template-content" placeholder="Template content with {{variables}}" rows={6} />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateTemplateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsCreateTemplateOpen(false)}>
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <Badge variant="secondary">{template.category}</Badge>
                    <span>Used {template.usageCount} times</span>
                    <span>Created {formatRelativeTime(template.createdAt)}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  {template.channels.map((channel) => (
                    <Badge key={channel} variant="secondary" className="flex items-center space-x-1">
                      {getChannelIcon(channel)}
                      <span>{channel}</span>
                    </Badge>
                  ))}
                </div>
                
                {template.subject && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Subject</div>
                    <div className="text-sm">{template.subject}</div>
                  </div>
                )}
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Content Preview</div>
                  <div className="text-sm truncate">{template.content}</div>
                </div>
                
                {template.variables.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Variables</div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable) => (
                        <Badge key={variable.name} variant="outline" className="text-xs">
                          {variable.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15,420</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">96.6%</div>
            <p className="text-xs text-muted-foreground">+2.1% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">59.9%</div>
            <p className="text-xs text-muted-foreground">+5.3% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">25.9%</div>
            <p className="text-xs text-muted-foreground">+1.8% from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-muted-foreground">12,400 messages</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">97.6%</div>
                  <div className="text-sm text-muted-foreground">delivery rate</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-sm text-muted-foreground">3,020 messages</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">92.4%</div>
                  <div className="text-sm text-muted-foreground">delivery rate</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Welcome campaign completed</span>
                </div>
                <span className="text-xs text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">SMS delivery rate below threshold</span>
                </div>
                <span className="text-xs text-muted-foreground">5 hours ago</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <Send className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Monthly newsletter sent</span>
                </div>
                <span className="text-xs text-muted-foreground">1 day ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Communications Center" 
        description="Multi-channel messaging and campaign management"
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Communications", href: "/platform/communications" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns">
          <CampaignsTab />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
        
        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
