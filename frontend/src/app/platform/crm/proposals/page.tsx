"use client";

import { useState } from "react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
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
  FileText, 
  Plus, 
  Search, 
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Copy,
  Send,
  Signature,
  Calendar,
  DollarSign,
  Building,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Settings,
  Mail,
  Phone,
  MapPin,
  XCircle,
} from "lucide-react";

interface ProposalTemplate {
  _id: string;
  name: string;
  description: string;
  category: "standard" | "custom" | "legal" | "pricing";
  content: {
    sections: ProposalSection[];
    variables: TemplateVariable[];
    terms: TemplateTerm[];
    pricing: PricingSection;
  };
  isDefault: boolean;
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

interface ProposalSection {
  id: string;
  title: string;
  content: string;
  order: number;
  isRequired: boolean;
  variables: string[];
}

interface TemplateVariable {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "currency" | "select";
  defaultValue?: string;
  options?: string[];
  description: string;
  required: boolean;
}

interface TemplateTerm {
  id: string;
  title: string;
  content: string;
  category: "payment" | "service" | "legal" | "termination" | "confidentiality";
  isDefault: boolean;
}

interface PricingSection {
  currency: string;
  oneTime: boolean;
  recurring: boolean;
  customPricing: boolean;
  priceTiers: PriceTier[];
}

interface PriceTier {
  id: string;
  name: string;
  minStudents: number;
  maxStudents: number;
  setupFee: number;
  monthlyFee: number;
  perStudentFee: number;
  features: string[];
}

interface GeneratedProposal {
  _id: string;
  templateId: string;
  dealId: string;
  schoolName: string;
  status: "draft" | "sent" | "viewed" | "signed" | "rejected";
  variables: Record<string, any>;
  content: string;
  sentAt?: number;
  viewedAt?: number;
  signedAt?: number;
  signatureUrl?: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

const mockTemplates: ProposalTemplate[] = [
  {
    _id: "1",
    name: "Standard School Package",
    description: "Complete proposal for standard school management system",
    category: "standard",
    isDefault: true,
    usageCount: 45,
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    createdBy: "michael.chen@edumyles.com",
    content: {
      sections: [
        {
          id: "1",
          title: "Executive Summary",
          content: "Dear {{school_name}},\n\nWe are pleased to present this comprehensive proposal for implementing EduMyles School Management System at your institution. Our solution is designed to streamline your administrative processes and enhance the educational experience for both staff and students.\n\n{{custom_introduction}}",
          order: 1,
          isRequired: true,
          variables: ["school_name", "custom_introduction"]
        },
        {
          id: "2",
          title: "Solution Overview",
          content: "EduMyles provides a complete school management solution including:\n\n• Student Information Management\n• Grade Book and Assessment Tools\n• Parent Portal and Communication\n• Financial Management\n• Reporting and Analytics\n• Mobile App Access\n\n{{additional_modules}}",
          order: 2,
          isRequired: true,
          variables: ["additional_modules"]
        },
        {
          id: "3",
          title: "Pricing Details",
          content: "Based on your requirements for {{current_students}} students, we recommend the {{recommended_plan}} plan:\n\n{{pricing_table}}\n\n{{custom_pricing_notes}}",
          order: 3,
          isRequired: true,
          variables: ["current_students", "recommended_plan", "pricing_table", "custom_pricing_notes"]
        },
        {
          id: "4",
          title: "Implementation Timeline",
          content: "Our implementation process typically takes {{implementation_weeks}} weeks:\n\nWeek 1: Data Migration and Setup\nWeek 2: Staff Training\nWeek 3: System Testing\nWeek {{implementation_weeks}}: Go Live\n\n{{custom_timeline}}",
          order: 4,
          isRequired: true,
          variables: ["implementation_weeks", "custom_timeline"]
        }
      ],
      variables: [
        {
          id: "1",
          name: "school_name",
          type: "text",
          description: "Name of the school",
          required: true
        },
        {
          id: "2",
          name: "current_students",
          type: "number",
          description: "Current number of students",
          required: true
        },
        {
          id: "3",
          name: "recommended_plan",
          type: "select",
          options: ["Starter", "Growth", "Pro", "Enterprise"],
          description: "Recommended plan for the school",
          required: true
        },
        {
          id: "4",
          name: "implementation_weeks",
          type: "number",
          defaultValue: "4",
          description: "Weeks required for implementation",
          required: true
        },
        {
          id: "5",
          name: "custom_introduction",
          type: "text",
          description: "Custom introduction paragraph",
          required: false
        }
      ],
      terms: [
        {
          id: "1",
          title: "Payment Terms",
          content: "Payment is due within 30 days of invoice. Late payments will incur a 2% monthly interest charge.",
          category: "payment",
          isDefault: true
        },
        {
          id: "2",
          title: "Service Level Agreement",
          content: "We guarantee 99.9% uptime and 24-hour response time for critical issues.",
          category: "service",
          isDefault: true
        }
      ],
      pricing: {
        currency: "KES",
        oneTime: true,
        recurring: true,
        customPricing: true,
        priceTiers: [
          {
            id: "1",
            name: "Starter",
            minStudents: 0,
            maxStudents: 200,
            setupFee: 50000,
            monthlyFee: 15000,
            perStudentFee: 100,
            features: ["Basic Management", "Parent Portal", "Mobile App"]
          },
          {
            id: "2",
            name: "Growth",
            minStudents: 201,
            maxStudents: 500,
            setupFee: 75000,
            monthlyFee: 25000,
            perStudentFee: 80,
            features: ["Advanced Analytics", "Custom Reports", "Priority Support"]
          }
        ]
      }
    }
  },
  {
    _id: "2",
    name: "Premium International School",
    description: "Specialized proposal for international schools with advanced features",
    category: "custom",
    isDefault: false,
    usageCount: 12,
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    createdBy: "sarah.wilson@edumyles.com",
    content: {
      sections: [
        {
          id: "1",
          title: "International School Solution",
          content: "Dear {{school_name}},\n\nAs a leading international school, you require a system that meets global standards while accommodating local requirements. EduMyles International Edition is specifically designed for institutions like yours.",
          order: 1,
          isRequired: true,
          variables: ["school_name"]
        }
      ],
      variables: [
        {
          id: "1",
          name: "school_name",
          type: "text",
          description: "Name of the international school",
          required: true
        }
      ],
      terms: [
        {
          id: "1",
          title: "International Support",
          content: "24/7 support across multiple time zones with multilingual assistance.",
          category: "service",
          isDefault: false
        }
      ],
      pricing: {
        currency: "USD",
        oneTime: true,
        recurring: true,
        customPricing: true,
        priceTiers: []
      }
    }
  }
];

const mockProposals: GeneratedProposal[] = [
  {
    _id: "1",
    templateId: "1",
    dealId: "1",
    schoolName: "Nairobi International Academy",
    status: "sent",
    variables: {
      school_name: "Nairobi International Academy",
      current_students: 450,
      recommended_plan: "Growth",
      implementation_weeks: 6,
      custom_introduction: "We understand your need for a comprehensive solution that scales with your growth."
    },
    content: "Generated proposal content...",
    sentAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    createdBy: "michael.chen@edumyles.com"
  },
  {
    _id: "2",
    templateId: "1",
    dealId: "2",
    schoolName: "Mombasa Primary School",
    status: "draft",
    variables: {
      school_name: "Mombasa Primary School",
      current_students: 800,
      recommended_plan: "Pro"
    },
    content: "Draft proposal content...",
    createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
    createdBy: "sarah.wilson@edumyles.com"
  }
];

export default function ProposalTemplatesPage() {
  const { sessionToken } = useAuth();

  const templatesData = usePlatformQuery(
    api.platform.crm.proposalQueries.listProposalTemplates,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );
  const proposalsData = usePlatformQuery(
    api.platform.crm.proposalQueries.listProposals,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const templates = (templatesData as any[]) || [];
  const proposals = (proposalsData as any[]) || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("templates");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ProposalTemplate | null>(null);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = searchQuery === "" || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "sent": return "bg-blue-100 text-blue-800";
      case "viewed": return "bg-yellow-100 text-yellow-800";
      case "signed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft": return <FileText className="h-4 w-4" />;
      case "sent": return <Send className="h-4 w-4" />;
      case "viewed": return <Eye className="h-4 w-4" />;
      case "signed": return <Signature className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const handleGenerateProposal = (template: ProposalTemplate) => {
    setSelectedTemplate(template);
    setIsGenerateDialogOpen(true);
  };

  const handlePreviewTemplate = (template: ProposalTemplate) => {
    setPreviewTemplate(template);
  };

  const TemplatesList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Proposal Templates</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input id="template-name" placeholder="Enter template name" />
                </div>
                <div>
                  <Label htmlFor="template-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="template-description">Description</Label>
                <Textarea id="template-description" placeholder="Describe the template purpose" rows={3} />
              </div>
              <div>
                <Label htmlFor="template-content">Template Content</Label>
                <Textarea 
                  id="template-content" 
                  placeholder="Enter template content with variables like {{school_name}}" 
                  rows={8} 
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Create Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="pricing">Pricing</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => (
          <Card key={template._id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                </div>
                {template.isDefault && (
                  <Badge variant="secondary">Default</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <Badge variant="outline">{template.category}</Badge>
                <span className="text-muted-foreground">{template.usageCount} uses</span>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Template Variables:</div>
                <div className="flex flex-wrap gap-1">
                  {template.content.variables.slice(0, 3).map((variable) => (
                    <Badge key={variable.id} variant="secondary" className="text-xs">
                      {variable.name}
                    </Badge>
                  ))}
                  {template.content.variables.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.content.variables.length - 3}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Sections:</div>
                <div className="text-sm text-muted-foreground">
                  {template.content.sections.length} sections
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handlePreviewTemplate(template)}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button 
                  size="sm"
                  onClick={() => handleGenerateProposal(template)}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const ProposalsList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Generated Proposals</h2>
        <Button onClick={() => setIsGenerateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Generate Proposal
        </Button>
      </div>

      {/* Proposals Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">School</th>
                  <th className="text-left p-3 font-semibold">Template</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Created</th>
                  <th className="text-left p-3 font-semibold">Last Updated</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => {
                  const template = templates.find(t => t._id === proposal.templateId);
                  return (
                    <tr key={proposal._id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{proposal.schoolName}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm">{template?.name}</div>
                      </td>
                      <td className="p-3">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {getStatusIcon(proposal.status)}
                          <span>{proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(proposal.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm">
                        {new Date(proposal.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
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
        title="Proposal Templates" 
        description="Create and manage proposal templates with customizable terms and e-signature integration"
        breadcrumbs={[
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals", href: "/platform/crm/proposals" }
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="proposals">Generated Proposals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="templates">
          <TemplatesList />
        </TabsContent>
        
        <TabsContent value="proposals">
          <ProposalsList />
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <div className="text-sm font-medium">{previewTemplate.category}</div>
                </div>
                <div>
                  <Label>Usage Count</Label>
                  <div className="text-sm font-medium">{previewTemplate.usageCount} times</div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <Label>Template Sections</Label>
                <div className="space-y-4 mt-2">
                  {previewTemplate.content.sections.map((section) => (
                    <Card key={section.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm whitespace-pre-wrap">{section.content}</div>
                        {section.variables.length > 0 && (
                          <div className="mt-2">
                            <div className="text-xs text-muted-foreground">Variables used:</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {section.variables.map((variable) => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Generate Proposal Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Proposal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label>Select Template</Label>
              <Select value={selectedTemplate?._id} onValueChange={(value) => {
                const template = templates.find(t => t._id === value);
                setSelectedTemplate(template || null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template._id} value={template._id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <Label>Template Variables</Label>
                  <div className="space-y-3 mt-2">
                    {selectedTemplate.content.variables.map((variable) => (
                      <div key={variable.id}>
                        <Label className="text-sm">{variable.name} {variable.required && <span className="text-red-500">*</span>}</Label>
                        {variable.type === "select" ? (
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${variable.name}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {variable.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input 
                            type={variable.type === "number" ? "number" : "text"}
                            placeholder={variable.description}
                            defaultValue={variable.defaultValue}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsGenerateDialogOpen(false)}>
                Generate Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
