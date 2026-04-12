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
import { Award, Globe, Mail, Save, ShieldCheck, Wallet } from "lucide-react";

type PublisherProfile = {
  companyName: string;
  email: string;
  website?: string;
  status: "pending" | "approved" | "rejected" | "suspended" | "banned";
  tier: "indie" | "verified" | "enterprise";
  revenueSharePct: number;
  webhookUrl?: string;
  taxId?: string;
  billingCountry?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
  };
};

type PublisherStats = {
  totalModules: number;
  publishedModules: number;
  totalInstalls: number;
  activeInstalls: number;
  revenueSharePct: number;
  status: string;
  tier: string;
};

export default function DeveloperProfilePage() {
  const profile = useQuery(api.modules.publisher.mutations.profile.getMyProfile, {}) as
    | PublisherProfile
    | undefined;
  const stats = useQuery(api.modules.publisher.mutations.profile.getStats, {}) as
    | PublisherStats
    | undefined;
  const updateProfile = useMutation(api.modules.publisher.mutations.profile.updateProfile);

  const [form, setForm] = useState({
    businessName: "",
    email: "",
    website: "",
    taxId: "",
    billingCountry: "",
    webhookUrl: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      businessName: profile.companyName,
      email: profile.email,
      website: profile.website ?? "",
      taxId: profile.taxId ?? "",
      billingCountry: profile.billingCountry ?? "",
      webhookUrl: profile.webhookUrl ?? "",
    });
  }, [profile]);

  if (!profile || !stats) return <LoadingSkeleton variant="page" />;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        businessName: form.businessName,
        email: form.email,
        website: form.website || undefined,
        taxId: form.taxId || undefined,
        billingCountry: form.billingCountry || undefined,
        webhookUrl: form.webhookUrl || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage the live publisher identity attached to your developer account."
        badge={<Badge>{profile.tier} tier</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Publisher Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              value={form.businessName}
              onChange={(e) => setForm((current) => ({ ...current, businessName: e.target.value }))}
              placeholder="Business name"
            />
            <Input
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="Account email"
            />
            <Input
              value={form.website}
              onChange={(e) => setForm((current) => ({ ...current, website: e.target.value }))}
              placeholder="Website"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                value={form.taxId}
                onChange={(e) => setForm((current) => ({ ...current, taxId: e.target.value }))}
                placeholder="Tax ID"
              />
              <Input
                value={form.billingCountry}
                onChange={(e) =>
                  setForm((current) => ({ ...current, billingCountry: e.target.value }))
                }
                placeholder="Billing country"
              />
            </div>
            <Input
              value={form.webhookUrl}
              onChange={(e) => setForm((current) => ({ ...current, webhookUrl: e.target.value }))}
              placeholder="Webhook URL"
            />
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                {profile.status}
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                {profile.tier} tier
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {profile.email}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                {profile.website ?? "No website configured"}
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                {profile.revenueSharePct}% revenue share
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{stats.totalModules} total modules</p>
              <p>{stats.publishedModules} published modules</p>
              <p>{stats.totalInstalls} installs</p>
              <p>{stats.activeInstalls} active installs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{profile.bankDetails?.bankName ?? "No bank name configured"}</p>
              <p>{profile.bankDetails?.accountName ?? "No account name configured"}</p>
              <p>{profile.bankDetails?.accountNumber ?? "No account number configured"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
