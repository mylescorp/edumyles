"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CreatePlatformTicketPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [tenantId, setTenantId] = useState("");
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const createSupportTicket = useMutation(api.modules.platform.support.createSupportTicket);

  const tenantOptions = useMemo(() => {
    return [...(tenants ?? [])].sort((a, b) => (a.name ?? a.tenantId).localeCompare(b.name ?? b.tenantId));
  }, [tenants]);

  const handleSubmit = async () => {
    if (!sessionToken || !tenantId || !subject.trim() || !message.trim()) {
      toast.error("Tenant, subject, and initial message are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSupportTicket({
        sessionToken,
        tenantId,
        subject: subject.trim(),
        priority,
        source: "platform",
        message: message.trim(),
      });
      toast.success("Support ticket created.");
      router.push("/platform/tickets");
    } catch (error: any) {
      console.error("Failed to create platform ticket:", error);
      toast.error(error?.message || "Failed to create support ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sessionToken || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Ticket"
        description="Open a support ticket against a tenant from the platform operations console."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Tickets", href: "/platform/tickets" },
          { label: "Create", href: "/platform/tickets/create" },
        ]}
      />

      <Card className="mx-auto max-w-3xl">
        <CardHeader>
          <CardTitle>Ticket details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tenant</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenantOptions.map((tenant) => (
                  <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                    {tenant.name ?? tenant.tenantId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Billing escalation for renewal discrepancy" />
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value) => setPriority(value as typeof priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Initial message</Label>
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={10}
              placeholder="Add the issue summary, impact, and the next action needed from the support team."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/platform/tickets")} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create ticket"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
