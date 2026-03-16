"use client";

import { useState } from "react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
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
  Download,
  Eye,
  Send,
  Loader2,
} from "lucide-react";

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

  const createTemplate = useMutation(api.platform.crm.proposalMutations.createProposalTemplate);
  const generateProposal = useMutation(api.platform.crm.proposalMutations.generateProposal);
  const sendProposal = useMutation(api.platform.crm.proposalMutations.sendProposal);

  const templates = (templatesData as any[]) || [];
  const proposals = (proposalsData as any[]) || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("templates");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  // Create template form
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState<"standard" | "custom" | "legal" | "pricing">("standard");
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Generate proposal form
  const [genSchoolName, setGenSchoolName] = useState("");
  const [genEmail, setGenEmail] = useState("");
  const [genVariables, setGenVariables] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreateTemplate = async () => {
    if (!sessionToken || !newTemplateName) return;
    setIsCreating(true);
    try {
      await createTemplate({
        sessionToken,
        name: newTemplateName,
        description: newTemplateDescription,
        category: newTemplateCategory,
        sections: newTemplateContent
          ? [{ id: "1", title: "Content", content: newTemplateContent, order: 1, isRequired: true, variables: [] }]
          : [],
        variables: [],
        terms: [],
        pricing: { currency: "KES", oneTime: true, recurring: true, customPricing: false, priceTiers: [] },
      });
      setIsCreateDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleGenerateProposal = async () => {
    if (!sessionToken || !selectedTemplate || !genSchoolName) return;
    setIsGenerating(true);
    try {
      await generateProposal({
        sessionToken,
        templateId: selectedTemplate._id,
        schoolName: genSchoolName,
        contactEmail: genEmail || undefined,
        variables: genVariables,
      });
      setIsGenerateDialogOpen(false);
      setGenSchoolName("");
      setGenEmail("");
      setGenVariables({});
      setSelectedTemplate(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendProposal = async (proposalId: string) => {
    if (!sessionToken) return;
    try {
      await sendProposal({ sessionToken, proposalId });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTemplates = templates.filter((t: any) => {
    const matchesSearch =
      searchQuery === "" ||
      t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent": return "bg-blue-100 text-blue-800";
      case "viewed": return "bg-yellow-100 text-yellow-800";
      case "signed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposal Templates"
        description="Create and manage proposal templates with customizable terms and e-signature integration"
        breadcrumbs={[
          { label: "CRM", href: "/platform/crm" },
          { label: "Proposals", href: "/platform/crm/proposals" },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="proposals">Generated Proposals</TabsTrigger>
        </TabsList>

        {/* ── Templates Tab ── */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Proposal Templates</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" /> Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Create New Template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Template Name</Label>
                      <Input
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={newTemplateCategory}
                        onValueChange={(v) => setNewTemplateCategory(v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
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
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="Describe the template purpose"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Template Content</Label>
                    <Textarea
                      value={newTemplateContent}
                      onChange={(e) => setNewTemplateContent(e.target.value)}
                      placeholder="Enter template content. Use {{school_name}} for variables."
                      rows={8}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateTemplate} disabled={!newTemplateName || isCreating}>
                      {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
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
                    <SelectValue />
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
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No templates found. Create your first template.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template: any) => (
                <Card key={template._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                      </div>
                      {template.isDefault && <Badge variant="secondary">Default</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <Badge variant="outline">{template.category}</Badge>
                      <span className="text-muted-foreground">{template.usageCount ?? 0} uses</span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPreviewTemplate(template)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => { setSelectedTemplate(template); setIsGenerateDialogOpen(true); }}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-1" /> Generate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Proposals Tab ── */}
        <TabsContent value="proposals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Generated Proposals</h2>
            <Button onClick={() => setIsGenerateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Generate Proposal
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {proposals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No proposals generated yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-semibold">School</th>
                        <th className="text-left p-3 font-semibold">Template</th>
                        <th className="text-left p-3 font-semibold">Status</th>
                        <th className="text-left p-3 font-semibold">Created</th>
                        <th className="text-left p-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposals.map((proposal: any) => {
                        const tmpl = templates.find((t: any) => t._id === proposal.templateId);
                        return (
                          <tr key={proposal._id} className="border-b hover:bg-muted/50">
                            <td className="p-3 font-medium">{proposal.schoolName}</td>
                            <td className="p-3 text-sm">{tmpl?.name ?? "—"}</td>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </td>
                            <td className="p-3 text-sm">
                              {new Date(proposal.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" title="View">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" title="Download">
                                  <Download className="h-4 w-4" />
                                </Button>
                                {proposal.status === "draft" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    title="Send"
                                    onClick={() => handleSendProposal(proposal._id)}
                                  >
                                    <Send className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><Label>Category</Label><p>{previewTemplate.category}</p></div>
                <div><Label>Usage Count</Label><p>{previewTemplate.usageCount ?? 0} times</p></div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">{previewTemplate.description}</p>
              {previewTemplate.sections?.map((s: any) => (
                <Card key={s.id}>
                  <CardHeader><CardTitle className="text-base">{s.title}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="text-sm whitespace-pre-wrap">{s.content}</div>
                  </CardContent>
                </Card>
              ))}
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
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select
                value={selectedTemplate?._id ?? ""}
                onValueChange={(v) => setSelectedTemplate(templates.find((t: any) => t._id === v) ?? null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>School Name <span className="text-red-500">*</span></Label>
              <Input
                value={genSchoolName}
                onChange={(e) => setGenSchoolName(e.target.value)}
                placeholder="e.g. Nairobi International Academy"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input
                value={genEmail}
                onChange={(e) => setGenEmail(e.target.value)}
                placeholder="contact@school.com"
                type="email"
              />
            </div>
            {selectedTemplate?.variables?.map((v: any) => (
              <div key={v.id} className="space-y-1">
                <Label className="text-sm">
                  {v.name} {v.required && <span className="text-red-500">*</span>}
                </Label>
                {v.type === "select" ? (
                  <Select
                    value={genVariables[v.name] ?? ""}
                    onValueChange={(val) => setGenVariables((prev) => ({ ...prev, [v.name]: val }))}
                  >
                    <SelectTrigger><SelectValue placeholder={v.description} /></SelectTrigger>
                    <SelectContent>
                      {v.options?.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={v.type === "number" ? "number" : "text"}
                    placeholder={v.description}
                    value={genVariables[v.name] ?? v.defaultValue ?? ""}
                    onChange={(e) => setGenVariables((prev) => ({ ...prev, [v.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateProposal}
                disabled={!selectedTemplate || !genSchoolName || isGenerating}
              >
                {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Generate Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
