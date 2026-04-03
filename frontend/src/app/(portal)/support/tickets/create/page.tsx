"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Plus,
  Upload,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export default function CreateTicketPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const createTicket = useMutation(api.tickets.createTenantTicket);

  const [formData, setFormData] = useState({
    title: "",
    body: "",
    category: "",
    priority: "P2",
    attachments: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const categories = [
    { value: "billing", label: "Billing & Payments" },
    { value: "technical", label: "Technical Issue" },
    { value: "data", label: "Data & Reports" },
    { value: "feature", label: "Feature Request" },
    { value: "onboarding", label: "Onboarding Help" },
    { value: "account", label: "Account Management" },
    { value: "legal", label: "Legal & Compliance" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "P0", label: "P0 - Critical", description: "System down, major functionality broken" },
    { value: "P1", label: "P1 - High", description: "Significant impact on operations" },
    { value: "P2", label: "P2 - Medium", description: "Moderate impact, workaround available" },
    { value: "P3", label: "P3 - Low", description: "Minor issue, cosmetic problem" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      if (!sessionToken) {
        throw new Error("You must be signed in to create a ticket.");
      }

      await createTicket({
        sessionToken,
        title: formData.title,
        body: formData.body,
        category: formData.category as any,
        priority: formData.priority as any,
        attachments: formData.attachments,
      });

      setSubmitStatus("success");
      setTimeout(() => {
        router.push("/support/tickets");
      }, 2000);
    } catch (error) {
      setSubmitStatus("error");
      console.error("Failed to create ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (submitStatus === "success") {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Ticket Created Successfully" 
          description="Your support ticket has been submitted and will be reviewed shortly."
        />
        
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-success mx-auto" />
            <h2 className="text-2xl font-bold text-success">Thank You!</h2>
            <p className="text-muted-foreground">
              Your ticket <strong>"{formData.title}"</strong> has been created successfully.
              Our support team will review it and respond within the SLA timeframe.
            </p>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Ticket ID:</strong> You'll receive an email with your ticket ID shortly
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Response Time:</strong> You can expect a response within {formData.priority === "P0" ? "2 hours" : formData.priority === "P1" ? "8 hours" : formData.priority === "P2" ? "24 hours" : "72 hours"}
              </p>
            </div>
            <Button onClick={() => router.push("/support/tickets")} className="mt-4">
              View My Tickets
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Create Support Ticket" 
        description="Submit a new support request to our team"
        breadcrumbs={[
          { label: "Support", href: "/support" },
          { label: "Create Ticket", href: "/support/tickets/create" }
        ]}
      />

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Ticket Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Ticket Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div>
                              <div className="font-medium">{priority.label}</div>
                              <div className="text-xs text-muted-foreground">{priority.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="body">Description *</Label>
                    <Textarea
                      id="body"
                      value={formData.body}
                      onChange={(e) => handleInputChange("body", e.target.value)}
                      placeholder="Please provide detailed information about your issue..."
                      className="min-h-32"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Include as much detail as possible to help us resolve your issue faster.
                    </p>
                  </div>

                  {/* Attachments */}
                  <div className="space-y-2">
                    <Label htmlFor="attachments">Attachments</Label>
                    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 10MB per file)
                      </p>
                      <Button type="button" variant="outline" className="mt-2">
                        Choose Files
                      </Button>
                    </div>
                  </div>

                  {/* Error Message */}
                  {submitStatus === "error" && (
                    <div className="flex items-center space-x-2 p-3 bg-danger-bg/10 border border-danger rounded-lg">
                      <AlertCircle className="h-5 w-5 text-danger" />
                      <p className="text-sm text-danger">
                        Failed to create ticket. Please try again or contact support directly.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || !formData.title || !formData.body || !formData.category}
                      className="min-w-32"
                    >
                      {isSubmitting ? "Creating..." : "Create Ticket"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - Help */}
          <div className="space-y-6">
            {/* Priority Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {priorities.map((priority) => (
                  <div key={priority.value} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        priority.value === "P0" ? "bg-danger" :
                        priority.value === "P1" ? "bg-warning" :
                        priority.value === "P2" ? "bg-info" :
                        "bg-muted"
                      }`}></div>
                      <span className="font-medium text-sm">{priority.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {priority.description}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SLA Information */}
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span>Priority 0 (Critical):</span>
                    <span className="font-medium">2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority 1 (High):</span>
                    <span className="font-medium">8 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority 2 (Medium):</span>
                    <span className="font-medium">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Priority 3 (Low):</span>
                    <span className="font-medium">72 hours</span>
                  </div>
                </div>
                <div className="p-3 bg-info-bg/10 border border-info rounded-lg">
                  <p className="text-xs text-info">
                    <strong>Response Time:</strong> Time to first response
                    <br />
                    <strong>Resolution Time:</strong> Time to complete resolution
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card>
              <CardHeader>
                <CardTitle>Need Immediate Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  For urgent issues, you can reach us directly:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Email:</strong> support@edumyles.com
                  </div>
                  <div>
                    <strong>Phone:</strong> +254 XXX XXX XXX
                  </div>
                  <div>
                    <strong>Hours:</strong> Mon-Fri, 8AM-6PM EAT
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
