"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { formatDateTime, formatRelativeTime } from "@/lib/formatters";
import { normalizeArray } from "@/lib/normalizeData";
import {
  CalendarClock,
  CheckCircle2,
  GitBranchPlus,
  Mail,
  Presentation,
  Send,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

type LeadDetail = {
  lead: {
    _id: string;
    schoolName: string;
    contactName: string;
    email: string;
    phone?: string;
    country: string;
    studentCount?: number;
    stage: string;
    qualificationScore?: number;
    dealValueKes?: number;
    notes?: string;
    ownerName?: string;
    assignedToName?: string;
  };
  contacts: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    title?: string;
    isPrimary: boolean;
  }>;
  activities: Array<{
    _id: string;
    type: string;
    subject?: string;
    body?: string;
    createdAt: number;
    createdByName?: string;
  }>;
  proposals: Array<{
    _id: string;
    status: string;
    totalKes: number;
    recommendedPlan?: string;
    trackingToken?: string;
  }>;
  followUps: Array<{
    _id: string;
    title: string;
    dueAt: number;
    notes?: string;
    completedAt?: number;
  }>;
  shares: Array<{
    _id: string;
    accessLevel: string;
    sharedWithName?: string;
    expiresAt?: number;
  }>;
  canEdit: boolean;
};

type PipelineView = {
  stages: Array<{
    stage: {
      _id: string;
      slug: string;
      name: string;
      color: string;
      icon: string;
      requiresNote: boolean;
      probabilityDefault: number;
      autoFollowUpDays?: number;
      isWon: boolean;
      isLost: boolean;
      isActive?: boolean;
    };
  }>;
};

type PlatformUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
  department?: string;
  status: string;
};

function formatKes(amount?: number) {
  return amount
    ? new Intl.NumberFormat("en-KE", {
        style: "currency",
        currency: "KES",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    : "—";
}

function displayName(user?: PlatformUser | null) {
  if (!user) return "Unknown teammate";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || user.email || user.id;
}

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = String(params.leadId);
  const { sessionToken } = useAuth();

  const [activityBody, setActivityBody] = useState("");
  const [followUpTitle, setFollowUpTitle] = useState("");
  const [followUpDueAt, setFollowUpDueAt] = useState("");
  const [contactForm, setContactForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    title: "",
    isPrimary: false,
  });
  const [shareForm, setShareForm] = useState({
    sharedWithUserId: "",
    accessLevel: "view",
    message: "",
    expiresAt: "",
  });
  const [proposalForm, setProposalForm] = useState({
    recommendedPlan: "",
    billingPeriod: "monthly",
    studentCount: "",
    customNotes: "",
    validUntil: "",
  });
  const [stageForm, setStageForm] = useState({
    stage: "",
    note: "",
  });
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const lead = usePlatformQuery(
    api.modules.platform.crm.getLead,
    sessionToken ? { sessionToken, leadId: leadId as never } : "skip",
    !!sessionToken
  ) as LeadDetail | null | undefined;

  const pipeline = usePlatformQuery(
    api.modules.platform.crm.getPipelineView,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PipelineView | undefined;

  const platformUsers = usePlatformQuery(
    api.modules.platform.rbac.getPlatformUsers,
    sessionToken ? { sessionToken, status: "active" } : "skip",
    !!sessionToken
  ) as PlatformUser[] | undefined;

  const logActivity = useMutation(api.modules.platform.crm.logActivity);
  const createFollowUp = useMutation(api.modules.platform.crm.createFollowUp);
  const completeFollowUp = useMutation(api.modules.platform.crm.completeFollowUp);
  const addContact = useMutation(api.modules.platform.crm.addContact);
  const shareLead = useMutation(api.modules.platform.crm.shareLead);
  const revokeLeadShare = useMutation(api.modules.platform.crm.revokeLeadShare);
  const createProposal = useMutation(api.modules.platform.crm.createProposal);
  const sendProposal = useMutation(api.modules.platform.crm.sendProposal);
  const changeLeadStage = useMutation(api.modules.platform.crm.changeLeadStage);

  const userOptions = useMemo(
    () =>
      normalizeArray<PlatformUser>(platformUsers)
        .filter((user) => user.status === "active")
        .sort((a, b) => displayName(a).localeCompare(displayName(b))),
    [platformUsers]
  );
  const stages = useMemo(() => pipeline?.stages.map((entry) => entry.stage) ?? [], [pipeline]);
  const currentStage = useMemo(
    () => stages.find((stage) => stage.slug === lead?.lead.stage) ?? null,
    [lead?.lead.stage, stages]
  );
  const overdueFollowUps = useMemo(
    () => (lead?.followUps ?? []).filter((item) => !item.completedAt && item.dueAt < Date.now()),
    [lead]
  );

  if (!sessionToken || lead === undefined || pipeline === undefined || platformUsers === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!lead) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Lead not found"
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "CRM", href: "/platform/crm" },
          ]}
        />
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Users}
              title="This lead could not be loaded"
              description="The record may have been removed or you may no longer have access to it."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const runAction = async (key: string, callback: () => Promise<void>) => {
    setBusyAction(key);
    try {
      await callback();
    } finally {
      setBusyAction(null);
    }
  };

  const handleLogActivity = async () => {
    if (!sessionToken || !activityBody.trim()) return;
    await runAction("activity", async () => {
      try {
        await logActivity({
          sessionToken,
          leadId: leadId as never,
          type: "note",
          subject: "Quick note",
          body: activityBody,
        });
        setActivityBody("");
        toast.success("Activity logged.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to log activity.");
      }
    });
  };

  const handleCreateFollowUp = async () => {
    if (!sessionToken || !followUpTitle.trim() || !followUpDueAt) return;
    await runAction("follow-up", async () => {
      try {
        await createFollowUp({
          sessionToken,
          leadId: leadId as never,
          title: followUpTitle,
          dueAt: new Date(followUpDueAt).getTime(),
        });
        setFollowUpTitle("");
        setFollowUpDueAt("");
        toast.success("Follow-up created.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create follow-up.");
      }
    });
  };

  const handleCompleteFollowUp = async (followUpId: string) => {
    if (!sessionToken) return;
    await runAction(`complete-${followUpId}`, async () => {
      try {
        await completeFollowUp({ sessionToken, followUpId: followUpId as never });
        toast.success("Follow-up completed.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to complete follow-up.");
      }
    });
  };

  const handleAddContact = async () => {
    if (!sessionToken || !contactForm.firstName.trim() || !contactForm.lastName.trim()) return;
    await runAction("contact", async () => {
      try {
        await addContact({
          sessionToken,
          leadId: leadId as never,
          firstName: contactForm.firstName,
          lastName: contactForm.lastName,
          email: contactForm.email || undefined,
          phone: contactForm.phone || undefined,
          title: contactForm.title || undefined,
          isPrimary: contactForm.isPrimary,
        });
        setContactForm({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          title: "",
          isPrimary: false,
        });
        toast.success("Contact added.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to add contact.");
      }
    });
  };

  const handleShareLead = async () => {
    if (!sessionToken || !shareForm.sharedWithUserId) return;
    await runAction("share", async () => {
      try {
        await shareLead({
          sessionToken,
          leadId: leadId as never,
          sharedWithUserId: shareForm.sharedWithUserId,
          accessLevel: shareForm.accessLevel as "view" | "edit",
          message: shareForm.message || undefined,
          expiresAt: shareForm.expiresAt ? new Date(shareForm.expiresAt).getTime() : undefined,
        });
        setShareForm({
          sharedWithUserId: "",
          accessLevel: "view",
          message: "",
          expiresAt: "",
        });
        toast.success("Lead shared.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to share lead.");
      }
    });
  };

  const handleRevokeShare = async (shareId: string) => {
    if (!sessionToken) return;
    await runAction(`share-${shareId}`, async () => {
      try {
        await revokeLeadShare({ sessionToken, shareId: shareId as never });
        toast.success("Lead share revoked.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to revoke share.");
      }
    });
  };

  const handleCreateProposal = async () => {
    if (!sessionToken || !proposalForm.recommendedPlan.trim() || !proposalForm.studentCount.trim()) return;
    await runAction("proposal", async () => {
      try {
        const result = await createProposal({
          sessionToken,
          leadId: leadId as never,
          recommendedPlan: proposalForm.recommendedPlan.trim(),
          billingPeriod: proposalForm.billingPeriod as "monthly" | "termly" | "annual",
          studentCount: Number(proposalForm.studentCount),
          customNotes: proposalForm.customNotes || undefined,
          validUntil: proposalForm.validUntil ? new Date(proposalForm.validUntil).getTime() : undefined,
        });
        setProposalForm({
          recommendedPlan: "",
          billingPeriod: "monthly",
          studentCount: String(lead.lead.studentCount ?? ""),
          customNotes: "",
          validUntil: "",
        });
        toast.success("Proposal draft created.");
        if (result?.proposalId) {
          window.location.href = `/platform/crm/proposals/${result.proposalId}`;
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create proposal.");
      }
    });
  };

  const handleSendProposal = async (proposalId: string) => {
    if (!sessionToken) return;
    await runAction(`proposal-${proposalId}`, async () => {
      try {
        await sendProposal({ sessionToken, proposalId: proposalId as never });
        toast.success("Proposal sent.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to send proposal.");
      }
    });
  };

  const handleChangeStage = async () => {
    if (!sessionToken || !stageForm.stage) return;
    await runAction("stage", async () => {
      try {
        await changeLeadStage({
          sessionToken,
          leadId: leadId as never,
          newStage: stageForm.stage,
          note: stageForm.note || undefined,
        });
        setStageForm({ stage: "", note: "" });
        toast.success("Lead stage updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update stage.");
      }
    });
  };

  const availableShareUsers = userOptions.filter((user) => displayName(user) !== lead.lead.ownerName);

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.lead.schoolName}
        description="Operate the whole commercial thread from one record: stage movement, follow-ups, contacts, proposals, and controlled sharing."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: lead.lead.schoolName },
        ]}
      />

      <CrmAdminRail currentHref="/platform/crm/leads" />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="border-emerald-100 bg-[linear-gradient(180deg,rgba(240,253,250,0.6),rgba(255,255,255,0.98))]">
            <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              <Metric label="Stage" value={lead.lead.stage} tone="emerald" />
              <Metric label="Qualification score" value={String(lead.lead.qualificationScore ?? 0)} tone="sky" />
              <Metric label="Potential value" value={formatKes(lead.lead.dealValueKes)} tone="amber" />
              <Metric label="Overdue follow-ups" value={String(overdueFollowUps.length)} tone="rose" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lead snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Info label="Contact" value={lead.lead.contactName} />
              <Info label="Email" value={lead.lead.email} />
              <Info label="Phone" value={lead.lead.phone ?? "Not provided"} />
              <Info label="Country" value={lead.lead.country} />
              <Info label="Owner" value={lead.lead.ownerName ?? "Not set"} />
              <Info label="Assigned" value={lead.lead.assignedToName ?? "Not assigned"} />
              <Info label="Student count" value={lead.lead.studentCount ? String(lead.lead.studentCount) : "Unknown"} />
              <Info label="Current stage posture" value={currentStage ? `${currentStage.name} · ${currentStage.probabilityDefault}%` : lead.lead.stage} />
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="share">Share</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-4 lg:grid-cols-[1fr_0.95fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Commercial notes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{lead.lead.stage}</Badge>
                      <Badge variant="outline">Score {lead.lead.qualificationScore ?? 0}</Badge>
                      {currentStage?.requiresNote ? <Badge variant="outline">Stage requires note</Badge> : null}
                    </div>
                    <div className="rounded-2xl border p-4">
                      <p className="text-sm text-muted-foreground">Internal notes</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{lead.lead.notes ?? "No notes captured yet."}</p>
                    </div>
                  </CardContent>
                </Card>

                <PermissionGate permission="crm.edit_own_lead">
                  <Card>
                    <CardHeader>
                      <CardTitle>Stage management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Move to stage</Label>
                        <Select value={stageForm.stage} onValueChange={(value) => setStageForm((current) => ({ ...current, stage: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select next stage" />
                          </SelectTrigger>
                          <SelectContent>
                            {stages.map((stage) => (
                              <SelectItem key={stage.slug} value={stage.slug}>
                                {stage.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Stage note</Label>
                        <Textarea
                          rows={4}
                          value={stageForm.note}
                          onChange={(event) => setStageForm((current) => ({ ...current, note: event.target.value }))}
                          placeholder="Capture why the lead is moving, what changed, or the objection that was resolved."
                        />
                      </div>
                      <Button className="w-full gap-2" onClick={handleChangeStage} disabled={!lead.canEdit || !stageForm.stage || busyAction === "stage"}>
                        <GitBranchPlus className="h-4 w-4" />
                        Update stage
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionGate>
              </div>
            </TabsContent>

            <TabsContent value="activities">
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <Label>Quick activity log</Label>
                    <Textarea
                      value={activityBody}
                      onChange={(event) => setActivityBody(event.target.value)}
                      rows={4}
                      placeholder="Capture the latest call, objection, commitment, or procurement update..."
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleLogActivity} disabled={busyAction === "activity" || !activityBody.trim()}>
                        Add activity
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {lead.activities.length === 0 ? (
                      <EmptyState
                        icon={Mail}
                        title="No activities yet"
                        description="The activity timeline will appear here once the lead gets its first note, stage change, or proposal event."
                      />
                    ) : (
                      lead.activities.map((activity) => (
                        <div key={activity._id} className="rounded-xl border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{activity.subject ?? activity.type}</p>
                              <p className="text-sm text-muted-foreground">
                                {activity.createdByName ?? "Unknown"} · {formatRelativeTime(activity.createdAt)}
                              </p>
                            </div>
                            <Badge variant="outline">{activity.type}</Badge>
                          </div>
                          {activity.body ? <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{activity.body}</p> : null}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <PermissionGate permission="crm.edit_own_lead">
                  <Card>
                    <CardHeader>
                      <CardTitle>Add contact</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <Field label="First name">
                        <Input value={contactForm.firstName} onChange={(event) => setContactForm((current) => ({ ...current, firstName: event.target.value }))} />
                      </Field>
                      <Field label="Last name">
                        <Input value={contactForm.lastName} onChange={(event) => setContactForm((current) => ({ ...current, lastName: event.target.value }))} />
                      </Field>
                      <Field label="Email">
                        <Input value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} />
                      </Field>
                      <Field label="Phone">
                        <Input value={contactForm.phone} onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))} />
                      </Field>
                      <Field label="Title">
                        <Input value={contactForm.title} onChange={(event) => setContactForm((current) => ({ ...current, title: event.target.value }))} />
                      </Field>
                      <div className="flex items-end gap-3 rounded-xl border p-3">
                        <Checkbox
                          id="contact-primary"
                          checked={contactForm.isPrimary}
                          onCheckedChange={(checked) => setContactForm((current) => ({ ...current, isPrimary: Boolean(checked) }))}
                        />
                        <Label htmlFor="contact-primary">Set as primary stakeholder</Label>
                      </div>
                      <div className="md:col-span-2">
                        <Button className="w-full" onClick={handleAddContact} disabled={!lead.canEdit || busyAction === "contact"}>
                          Add contact
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </PermissionGate>

                <Card>
                  <CardHeader>
                    <CardTitle>Current stakeholders</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lead.contacts.length === 0 ? (
                      <EmptyState icon={Users} title="No extra contacts" description="Add more stakeholders here so proposals and follow-ups have the right recipients." />
                    ) : (
                      lead.contacts.map((contact) => (
                        <div key={contact._id} className="rounded-xl border p-4">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              {contact.firstName} {contact.lastName}
                            </p>
                            {contact.isPrimary ? <Badge variant="outline">Primary</Badge> : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contact.title ?? "No title"} · {contact.email ?? "No email"} · {contact.phone ?? "No phone"}
                          </p>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="proposals">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <PermissionGate permission="crm.create_proposal">
                  <Card>
                    <CardHeader>
                      <CardTitle>Create proposal draft</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <Field label="Recommended plan">
                        <Input
                          value={proposalForm.recommendedPlan}
                          onChange={(event) => setProposalForm((current) => ({ ...current, recommendedPlan: event.target.value }))}
                          placeholder="Starter, Pro, Enterprise"
                        />
                      </Field>
                      <Field label="Billing period">
                        <Select
                          value={proposalForm.billingPeriod}
                          onValueChange={(value) => setProposalForm((current) => ({ ...current, billingPeriod: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="termly">Termly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Student count">
                        <Input
                          type="number"
                          value={proposalForm.studentCount}
                          onChange={(event) => setProposalForm((current) => ({ ...current, studentCount: event.target.value }))}
                          placeholder={String(lead.lead.studentCount ?? 0)}
                        />
                      </Field>
                      <Field label="Valid until">
                        <Input
                          type="datetime-local"
                          value={proposalForm.validUntil}
                          onChange={(event) => setProposalForm((current) => ({ ...current, validUntil: event.target.value }))}
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label="Custom notes">
                          <Textarea
                            rows={4}
                            value={proposalForm.customNotes}
                            onChange={(event) => setProposalForm((current) => ({ ...current, customNotes: event.target.value }))}
                            placeholder="Capture implementation caveats, discounts already approved, or rollout notes."
                          />
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Button className="w-full gap-2" onClick={handleCreateProposal} disabled={!lead.canEdit || busyAction === "proposal"}>
                          <Presentation className="h-4 w-4" />
                          Create proposal draft
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </PermissionGate>

                <Card>
                  <CardHeader>
                    <CardTitle>Proposal history</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lead.proposals.length === 0 ? (
                      <EmptyState icon={Presentation} title="No proposals yet" description="Create a draft here once the commercial shape is clear." />
                    ) : (
                      lead.proposals.map((proposal) => (
                        <div key={proposal._id} className="rounded-xl border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link href={`/platform/crm/proposals/${proposal._id}`} className="font-medium hover:text-emerald-700">
                                {proposal.recommendedPlan ?? "Custom proposal"}
                              </Link>
                              <p className="text-sm text-muted-foreground">{proposal.status}</p>
                            </div>
                            <p className="font-semibold">{formatKes(proposal.totalKes)}</p>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/platform/crm/proposals/${proposal._id}`}>Open detail</Link>
                            </Button>
                            {proposal.status === "draft" ? (
                              <Button
                                size="sm"
                                className="gap-2"
                                onClick={() => handleSendProposal(proposal._id)}
                                disabled={busyAction === `proposal-${proposal._id}`}
                              >
                                <Send className="h-4 w-4" />
                                Send
                              </Button>
                            ) : null}
                            {proposal.trackingToken ? (
                              <Button asChild variant="ghost" size="sm">
                                <Link href={`/proposals/${proposal.trackingToken}`}>Public page</Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="share">
              <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                <PermissionGate permission="crm.share_lead">
                  <Card>
                    <CardHeader>
                      <CardTitle>Share this lead</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Field label="Share with">
                        <Select
                          value={shareForm.sharedWithUserId}
                          onValueChange={(value) => setShareForm((current) => ({ ...current, sharedWithUserId: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a platform teammate" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableShareUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {displayName(user)} · {user.role.replace(/_/g, " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Access level">
                        <Select
                          value={shareForm.accessLevel}
                          onValueChange={(value) => setShareForm((current) => ({ ...current, accessLevel: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View only</SelectItem>
                            <SelectItem value="edit">Can edit</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Expiry">
                        <Input
                          type="datetime-local"
                          value={shareForm.expiresAt}
                          onChange={(event) => setShareForm((current) => ({ ...current, expiresAt: event.target.value }))}
                        />
                      </Field>
                      <Field label="Message">
                        <Textarea
                          rows={4}
                          value={shareForm.message}
                          onChange={(event) => setShareForm((current) => ({ ...current, message: event.target.value }))}
                          placeholder="Add context before the lead is handed over."
                        />
                      </Field>
                      <Button className="w-full gap-2" onClick={handleShareLead} disabled={busyAction === "share"}>
                        <Share2 className="h-4 w-4" />
                        Share lead
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionGate>

                <Card>
                  <CardHeader>
                    <CardTitle>Active shares</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {lead.shares.length === 0 ? (
                      <EmptyState icon={Share2} title="No active shares" description="Shared access will appear here once this lead is delegated or reviewed collaboratively." />
                    ) : (
                      lead.shares.map((share) => (
                        <div key={share._id} className="rounded-xl border p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-medium">{share.sharedWithName ?? "Unknown user"}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {share.expiresAt ? `Expires ${formatDateTime(share.expiresAt)}` : "No expiry"}
                              </p>
                            </div>
                            <Badge variant="outline">{share.accessLevel}</Badge>
                          </div>
                          <div className="mt-3 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeShare(share._id)}
                              disabled={busyAction === `share-${share._id}`}
                            >
                              Revoke share
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={followUpTitle} onChange={(event) => setFollowUpTitle(event.target.value)} placeholder="Book commercial check-in" />
              </div>
              <div className="space-y-2">
                <Label>Due date</Label>
                <Input type="datetime-local" value={followUpDueAt} onChange={(event) => setFollowUpDueAt(event.target.value)} />
              </div>
              <Button className="w-full" onClick={handleCreateFollowUp} disabled={!lead.canEdit || busyAction === "follow-up"}>
                Create follow-up
              </Button>
              <div className="space-y-3">
                {lead.followUps.length === 0 ? (
                  <EmptyState
                    icon={CalendarClock}
                    title="No follow-ups scheduled"
                    description="Add one above to make the next commercial action explicit."
                  />
                ) : (
                  lead.followUps.map((item) => (
                    <div key={item._id} className="rounded-xl border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{formatDateTime(item.dueAt)}</p>
                          {item.notes ? <p className="mt-1 text-sm text-muted-foreground">{item.notes}</p> : null}
                        </div>
                        {item.completedAt ? <Badge variant="outline">Done</Badge> : <Badge variant={item.dueAt < Date.now() ? "destructive" : "outline"}>{item.dueAt < Date.now() ? "Overdue" : "Pending"}</Badge>}
                      </div>
                      {!item.completedAt ? (
                        <div className="mt-3 flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-2"
                            onClick={() => handleCompleteFollowUp(item._id)}
                            disabled={busyAction === `complete-${item._id}`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Mark done
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operator cues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <Cue title="Score posture" body={`Qualification score is ${lead.lead.qualificationScore ?? 0}, which should guide whether you keep discovery open or push commercial close.`} />
              <Cue title="Commercial gravity" body={`${formatKes(lead.lead.dealValueKes)} is currently attributed to this lead in pipeline value.`} />
              <Cue title="Sharing discipline" body="Share with the smallest access level first, then widen to edit only when the handoff really requires it." />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
  } as const;

  return (
    <div className="rounded-2xl border bg-white/90 p-4">
      <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{label}</div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function Cue({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-2 leading-6">{body}</p>
    </div>
  );
}
