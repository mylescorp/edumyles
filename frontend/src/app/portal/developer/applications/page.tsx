"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Building2, FileText, Save, Send, ShieldCheck, XCircle } from "lucide-react";

type PublisherApplication = {
  _id: string;
  businessName: string;
  businessType: "individual" | "company";
  businessDescription: string;
  website?: string;
  contactPhone: string;
  contactAddress: string;
  country: string;
  experience: string;
  modules: string[];
  status:
    | "submitted"
    | "under_review"
    | "approved"
    | "rejected"
    | "on_hold"
    | "withdrawn";
  submittedAt: number;
  updatedAt: number;
  reviewNotes?: string;
  rejectedReason?: string;
};

const emptyForm = {
  businessName: "",
  businessType: "company" as "individual" | "company",
  businessDescription: "",
  website: "",
  contactPhone: "",
  contactAddress: "",
  country: "",
  experience: "",
  modules: "",
};

export default function DeveloperApplicationsPage() {
  const application = useQuery(
    api.modules.publisher.mutations.applications.getMyApplication,
    {}
  ) as PublisherApplication | null | undefined;
  const submitApplication = useMutation(
    api.modules.publisher.mutations.applications.submitApplication
  );
  const updateApplication = useMutation(
    api.modules.publisher.mutations.applications.updateApplication
  );
  const withdrawApplication = useMutation(
    api.modules.publisher.mutations.applications.withdrawApplication
  );

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!application) return;
    setForm({
      businessName: application.businessName,
      businessType: application.businessType,
      businessDescription: application.businessDescription,
      website: application.website ?? "",
      contactPhone: application.contactPhone,
      contactAddress: application.contactAddress,
      country: application.country,
      experience: application.experience,
      modules: application.modules.join(", "),
    });
  }, [application]);

  if (application === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  async function handleSubmit() {
    setSaving(true);
    const payload = {
      businessName: form.businessName,
      businessType: form.businessType,
      businessDescription: form.businessDescription,
      website: form.website || undefined,
      contactPhone: form.contactPhone,
      contactAddress: form.contactAddress,
      country: form.country,
      experience: form.experience,
      modules: form.modules
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    };

    try {
      if (application) {
        await updateApplication(payload);
      } else {
        await submitApplication(payload);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleWithdraw() {
    setSaving(true);
    try {
      await withdrawApplication({});
    } finally {
      setSaving(false);
    }
  }

  if (application?.status === "approved") {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Applications"
          description="Your developer account is already live and managed through your approved publisher profile."
          badge={<Badge>approved</Badge>}
        />
        <Card>
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <ShieldCheck className="h-10 w-10 text-emerald-500" />
            <div>
              <h2 className="text-lg font-semibold">{application.businessName}</h2>
              <p className="text-sm text-muted-foreground">
                Your publisher application has already been approved, so this area now reflects the
                live publisher account instead of mock review data.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <a href="/portal/developer/profile">Open Profile</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/portal/developer/modules">Manage Modules</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Developer Applications"
        description="Submit or manage your live publisher application record from Convex."
        badge={
          application ? (
            <Badge variant="outline">{application.status.replaceAll("_", " ")}</Badge>
          ) : undefined
        }
      />

      {application ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Business Name</label>
                  <Input
                    value={form.businessName}
                    disabled={!["submitted", "on_hold"].includes(application.status)}
                    onChange={(e) => setForm((current) => ({ ...current, businessName: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Business Type</label>
                  <select
                    value={form.businessType}
                    disabled={!["submitted", "on_hold"].includes(application.status)}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        businessType: e.target.value as "individual" | "company",
                      }))
                    }
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="company">Company</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Business Description</label>
                <Textarea
                  rows={4}
                  value={form.businessDescription}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, businessDescription: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.website}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
                  placeholder="Website"
                />
                <Input
                  value={form.contactPhone}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, contactPhone: e.target.value }))
                  }
                  placeholder="Phone"
                />
              </div>
              <Input
                value={form.contactAddress}
                disabled={!["submitted", "on_hold"].includes(application.status)}
                onChange={(e) =>
                  setForm((current) => ({ ...current, contactAddress: e.target.value }))
                }
                placeholder="Address"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={form.country}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
                  placeholder="Country"
                />
                <Input
                  value={form.experience}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, experience: e.target.value }))
                  }
                  placeholder="Experience"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Planned Modules</label>
                <Textarea
                  rows={3}
                  value={form.modules}
                  disabled={!["submitted", "on_hold"].includes(application.status)}
                  onChange={(e) => setForm((current) => ({ ...current, modules: e.target.value }))}
                  placeholder="Comma-separated module ideas"
                />
              </div>
              {["submitted", "on_hold"].includes(application.status) ? (
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handleSubmit} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? "Saving..." : "Update Application"}
                  </Button>
                  <Button variant="destructive" onClick={handleWithdraw} disabled={saving}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Withdraw
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-medium">{application.businessName}</p>
                <p>Status: {application.status.replaceAll("_", " ")}</p>
                <p>Submitted: {new Date(application.submittedAt).toLocaleString()}</p>
                <p>Last updated: {new Date(application.updatedAt).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Review Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{application.reviewNotes ?? "No reviewer notes yet."}</p>
                {application.rejectedReason ? (
                  <p className="text-red-600">
                    Rejection reason: {application.rejectedReason}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submit Publisher Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Business Name</label>
                <Input
                  value={form.businessName}
                  onChange={(e) => setForm((current) => ({ ...current, businessName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Business Type</label>
                <select
                  value={form.businessType}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      businessType: e.target.value as "individual" | "company",
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                </select>
              </div>
            </div>
            <Textarea
              rows={4}
              value={form.businessDescription}
              onChange={(e) => setForm((current) => ({ ...current, businessDescription: e.target.value }))}
              placeholder="Describe your development business"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={form.website}
                onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
                placeholder="Website"
              />
              <Input
                value={form.contactPhone}
                onChange={(e) =>
                  setForm((current) => ({ ...current, contactPhone: e.target.value }))
                }
                placeholder="Phone"
              />
            </div>
            <Input
              value={form.contactAddress}
              onChange={(e) => setForm((current) => ({ ...current, contactAddress: e.target.value }))}
              placeholder="Address"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={form.country}
                onChange={(e) => setForm((current) => ({ ...current, country: e.target.value }))}
                placeholder="Country"
              />
              <Input
                value={form.experience}
                onChange={(e) => setForm((current) => ({ ...current, experience: e.target.value }))}
                placeholder="Experience"
              />
            </div>
            <Textarea
              rows={3}
              value={form.modules}
              onChange={(e) => setForm((current) => ({ ...current, modules: e.target.value }))}
              placeholder="Comma-separated module ideas"
            />
            <Button onClick={handleSubmit} disabled={saving}>
              <Send className="mr-2 h-4 w-4" />
              {saving ? "Submitting..." : "Submit Application"}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Application Record</p>
              <p className="text-lg font-semibold">{application ? "Live" : "Not started"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Building2 className="h-8 w-8 text-emerald-500" />
            <div>
              <p className="text-sm text-muted-foreground">Business Type</p>
              <p className="text-lg font-semibold">
                {application?.businessType ?? form.businessType}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <ShieldCheck className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold">
                {application ? application.status.replaceAll("_", " ") : "Drafting"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
