"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Priority = "P0" | "P1" | "P2" | "P3";
type Category =
  | "billing"
  | "technical"
  | "data"
  | "feature"
  | "onboarding"
  | "account"
  | "legal"
  | "other";

export default function AdminCreateTicketPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const createTicket = useMutation(api.tickets.createTenantTicket);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState<Priority>("P2");
  const [category, setCategory] = useState<Category>("technical");

  const canSubmit = useMemo(
    () => Boolean(sessionToken && title.trim() && body.trim()),
    [sessionToken, title, body]
  );

  const handleSubmit = async () => {
    if (!sessionToken || !canSubmit) return;

    setIsSubmitting(true);
    try {
      const ticketId = await createTicket({
        sessionToken,
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
      });
      toast.success("Support ticket created");
      router.push(`/admin/tickets/${ticketId}`);
    } catch (error) {
      console.error("Failed to create admin ticket:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Support Ticket"
        description="Create a tenant-scoped support ticket for school operations or platform escalation."
      />

      <Card>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Subject</Label>
            <Input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Brief summary of the issue"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="data">Data</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(value) => setPriority(value as Priority)}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="P0">Critical</SelectItem>
                  <SelectItem value="P1">High</SelectItem>
                  <SelectItem value="P2">Medium</SelectItem>
                  <SelectItem value="P3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Description</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Describe the issue, expected behavior, and any steps already taken."
              rows={8}
            />
          </div>

          <div className="flex flex-col gap-3 md:flex-row">
            <Button onClick={handleSubmit} disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/admin/tickets")} disabled={isSubmitting}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

