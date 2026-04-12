"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

type PublisherProfile = {
  webhookUrl?: string;
  apiKey?: string;
  taxId?: string;
  billingCountry?: string;
  bankDetails?: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    branchCode?: string;
  };
};

export default function DeveloperSettingsPage() {
  const profile = useQuery(api.modules.publisher.mutations.profile.getMyProfile, {}) as
    | PublisherProfile
    | undefined;
  const updateProfile = useMutation(api.modules.publisher.mutations.profile.updateProfile);
  const [form, setForm] = useState({
    webhookUrl: "",
    taxId: "",
    billingCountry: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchCode: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      webhookUrl: profile.webhookUrl ?? "",
      taxId: profile.taxId ?? "",
      billingCountry: profile.billingCountry ?? "",
      bankName: profile.bankDetails?.bankName ?? "",
      accountName: profile.bankDetails?.accountName ?? "",
      accountNumber: profile.bankDetails?.accountNumber ?? "",
      branchCode: profile.bankDetails?.branchCode ?? "",
    });
  }, [profile]);

  if (!profile) return <LoadingSkeleton variant="page" />;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        webhookUrl: form.webhookUrl || undefined,
        taxId: form.taxId || undefined,
        billingCountry: form.billingCountry || undefined,
        bankDetails: {
          bankName: form.bankName || undefined,
          accountName: form.accountName || undefined,
          accountNumber: form.accountNumber || undefined,
          branchCode: form.branchCode || undefined,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Live developer payout, billing, and webhook settings stored on your publisher record."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Billing & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Tax ID"
              value={form.taxId}
              onChange={(e) => setForm((current) => ({ ...current, taxId: e.target.value }))}
            />
            <Input
              placeholder="Billing country"
              value={form.billingCountry}
              onChange={(e) =>
                setForm((current) => ({ ...current, billingCountry: e.target.value }))
              }
            />
            <Input
              placeholder="Webhook URL"
              value={form.webhookUrl}
              onChange={(e) => setForm((current) => ({ ...current, webhookUrl: e.target.value }))}
            />
            <div className="rounded-md border p-3 text-sm">
              <p className="font-medium">API Key</p>
              <p className="mt-1 break-all text-muted-foreground">
                {profile.apiKey ?? "No API key provisioned"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Bank name"
              value={form.bankName}
              onChange={(e) => setForm((current) => ({ ...current, bankName: e.target.value }))}
            />
            <Input
              placeholder="Account name"
              value={form.accountName}
              onChange={(e) =>
                setForm((current) => ({ ...current, accountName: e.target.value }))
              }
            />
            <Input
              placeholder="Account number"
              value={form.accountNumber}
              onChange={(e) =>
                setForm((current) => ({ ...current, accountNumber: e.target.value }))
              }
            />
            <Input
              placeholder="Branch code"
              value={form.branchCode}
              onChange={(e) => setForm((current) => ({ ...current, branchCode: e.target.value }))}
            />
          </CardContent>
        </Card>
      </div>

      <Button onClick={handleSave} disabled={saving}>
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  );
}
