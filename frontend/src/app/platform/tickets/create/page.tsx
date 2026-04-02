"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowLeft, Clock, MessageSquare, Send } from "lucide-react";

const CATEGORIES = [
  { value: "technical", label: "Technical", color: "bg-em-info-bg text-em-info" },
  { value: "billing", label: "Billing", color: "bg-em-warning-bg text-em-accent-dark" },
  { value: "account", label: "Account", color: "bg-blue-100 text-blue-700" },
  { value: "feature_request", label: "Feature Request", color: "bg-em-success-bg text-em-success" },
  { value: "bug_report", label: "Bug Report", color: "bg-em-danger-bg text-em-danger" },
  { value: "general", label: "General", color: "bg-muted text-muted-foreground" },
] as const;

const PRIORITIES = [
  { value: "urgent", label: "Critical", color: "bg-em-danger-bg text-em-danger", response: "Within 1 hour" },
  { value: "high", label: "High", color: "bg-em-warning-bg text-em-accent-dark", response: "Within 4 hours" },
  { value: "medium", label: "Medium", color: "bg-em-info-bg text-em-info", response: "Within 24 hours" },
  { value: "low", label: "Low", color: "bg-em-success-bg text-em-success", response: "Within 48 hours" },
] as const;

export default function CreateTicketPage() {
  const { isLoading, sessionToken, user } = useAuth();
  const router = useRouter();
  const createTicket = useMutation(api.platform.support.mutations.createAISupportTicket);

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  );

  const tenantOptions = useMemo(
    () =>
      (tenants ?? [])
        .map((tenant: any) => ({
          id: tenant.tenantId,
          name: tenant.name ?? tenant.tenantId,
          status: tenant.status ?? "active",
        }))
        .sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name)),
    [tenants]
  );

  const [form, setForm] = useState({
    tenantId: "",
    title: "",
    description: "",
    category: "technical",
    priority: "high",
    tags: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionToken || !user) {
      setSubmitError("Your session is no longer active. Refresh and try again.");
      return;
    }

    if (!form.tenantId || !form.title.trim() || !form.description.trim()) {
      setSubmitError("Please select a tenant and fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createTicket({
        sessionToken,
        tenantId: form.tenantId,
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category as "technical" | "billing" | "account" | "feature_request" | "bug_report" | "general",
        priority: form.priority as "low" | "medium" | "high" | "urgent",
        userId: String(user._id),
        submittedBy: user.email,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        contactInfo: {
          email: user.email,
          role: user.role,
        },
      });

      router.push("/platform/tickets");
    } catch (error) {
      console.error("Failed to create platform support ticket:", error);
      setSubmitError("Failed to create ticket. Please review the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSubmitError(null);
  };

  if (isLoading || (sessionToken && tenants === undefined)) {
    return <LoadingSkeleton variant="page" />;
  }

  const selectedCategory = CATEGORIES.find((category) => category.value === form.category);
  const selectedPriority = PRIORITIES.find((priority) => priority.value === form.priority);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title="Create Support Ticket"
          description="Create a platform-managed support ticket and link it to the right tenant."
        />
      </div>

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <span>Ticket Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tenantId">Tenant *</Label>
                <Select value={form.tenantId} onValueChange={(value) => handleInputChange("tenantId", value)}>
                  <SelectTrigger id="tenantId">
                    <SelectValue placeholder="Select tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantOptions.map((tenant: { id: string; name: string; status: string }) => (
                      <SelectItem key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Submitted By</Label>
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {user?.email ?? "Unknown user"}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Brief description of the issue"
                value={form.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">Maximum 200 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue, expected behavior, reproduction notes, and business impact."
                value={form.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="min-h-[140px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">Maximum 2000 characters</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCategory ? (
                  <Badge className={selectedCategory.color} variant="secondary">
                    {selectedCategory.label}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={form.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        {priority.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPriority ? (
                  <Badge className={selectedPriority.color} variant="secondary">
                    {selectedPriority.label}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Comma-separated labels, e.g. billing, urgent, onboarding"
                value={form.tags}
                onChange={(e) => handleInputChange("tags", e.target.value)}
              />
            </div>

            {submitError ? (
              <Card className="border-em-danger bg-em-danger-bg/10">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-em-danger">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">{submitError}</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="flex items-center justify-between border-t pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.tenantId || !form.title.trim() || !form.description.trim()}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Create Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-3xl border-border/50 bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-em-info" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Expected Response Times</h4>
              <p className="text-xs text-muted-foreground">
                The selected priority feeds the platform support workflow and AI escalation recommendations.
              </p>
              <div className="space-y-1 text-xs">
                {PRIORITIES.map((priority) => (
                  <div key={priority.value} className="flex items-center gap-2">
                    <Badge className={priority.color} variant="secondary">
                      {priority.label}
                    </Badge>
                    <span>{priority.response}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
