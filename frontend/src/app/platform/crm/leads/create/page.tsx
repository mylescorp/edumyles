"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";

export default function CreateLeadPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const createLead = useMutation(api.modules.platform.crm.createLead);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    schoolName: "",
    contactName: "",
    contactEmail: "",
    phone: "",
    country: "Kenya",
    studentCount: "",
    source: "landing_waitlist",
    sourceType: "waitlist",
    timeline: "",
    decisionMaker: "",
    dealValueKes: "",
    notes: "",
    tags: "",
  });

  const update = (field: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sessionToken) return;
    setIsSubmitting(true);
    try {
      const result = await createLead({
        sessionToken,
        schoolName: form.schoolName,
        contactName: form.contactName,
        contactEmail: form.contactEmail,
        phone: form.phone || undefined,
        country: form.country,
        studentCount: form.studentCount ? Number(form.studentCount) : undefined,
        source: form.source,
        sourceType: form.sourceType,
        timeline: form.timeline || undefined,
        decisionMaker: form.decisionMaker || undefined,
        dealValueKes: form.dealValueKes ? Number(form.dealValueKes) : undefined,
        notes: form.notes || undefined,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      toast.success("Lead created.");
      router.push(`/platform/crm/${result.leadId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <PageHeader
          title="Create CRM Lead"
          description="Capture the commercial context, score inputs, and follow-up posture before the first handoff."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "CRM", href: "/platform/crm" },
            { label: "Leads", href: "/platform/crm/leads" },
            { label: "Create lead" },
          ]}
        />
      </div>

      <CrmAdminRail currentHref="/platform/crm/leads/create" />

      <Card className="max-w-5xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Lead intake
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="School name" required>
                <Input value={form.schoolName} onChange={(event) => update("schoolName")(event.target.value)} placeholder="Riverside Secondary School" required />
              </Field>
              <Field label="Primary contact" required>
                <Input value={form.contactName} onChange={(event) => update("contactName")(event.target.value)} placeholder="Alice Wanjiku" required />
              </Field>
              <Field label="Contact email" required>
                <Input type="email" value={form.contactEmail} onChange={(event) => update("contactEmail")(event.target.value)} placeholder="alice@school.ac.ke" required />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(event) => update("phone")(event.target.value)} placeholder="+254 700 000 000" />
              </Field>
              <Field label="Country" required>
                <Input value={form.country} onChange={(event) => update("country")(event.target.value)} required />
              </Field>
              <Field label="Estimated student count">
                <Input type="number" value={form.studentCount} onChange={(event) => update("studentCount")(event.target.value)} placeholder="320" />
              </Field>
              <Field label="Source">
                <Select value={form.source} onValueChange={update("source")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landing_waitlist">Landing waitlist</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Source type">
                <Select value={form.sourceType} onValueChange={update("sourceType")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waitlist">Waitlist</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Timeline">
                <Input value={form.timeline} onChange={(event) => update("timeline")(event.target.value)} placeholder="Needs go-live this term" />
              </Field>
              <Field label="Decision maker">
                <Input value={form.decisionMaker} onChange={(event) => update("decisionMaker")(event.target.value)} placeholder="Principal / Finance Director" />
              </Field>
              <Field label="Potential value (KES)">
                <Input type="number" value={form.dealValueKes} onChange={(event) => update("dealValueKes")(event.target.value)} placeholder="250000" />
              </Field>
            </div>

            <Field label="Tags">
              <Input value={form.tags} onChange={(event) => update("tags")(event.target.value)} placeholder="high_value, urgent, referral" />
            </Field>

            <Field label="Internal notes">
              <Textarea value={form.notes} onChange={(event) => update("notes")(event.target.value)} rows={5} placeholder="Capture the pain points, urgency, and any deal blockers here." />
            </Field>

            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.schoolName || !form.contactName || !form.contactEmail}>
                {isSubmitting ? "Creating..." : "Create lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required ? " *" : null}
      </Label>
      {children}
    </div>
  );
}
