"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save, Wallet } from "lucide-react";

type ResellerProfile = {
  banking: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    branchCode?: string;
    payPalEmail?: string;
  };
  settings: {
    emailNotifications: boolean;
    monthlyReports: boolean;
    referralTracking: boolean;
  };
  commission: {
    minPayout: number;
  };
};

export default function ResellerSettingsPage() {
  const profile = useQuery(api.modules.reseller.mutations.profile.getMyProfile, {}) as
    | ResellerProfile
    | undefined;
  const updateProfile = useMutation(api.modules.reseller.mutations.profile.updateProfile);

  const [form, setForm] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    branchCode: "",
    payPalEmail: "",
    emailNotifications: true,
    monthlyReports: true,
    referralTracking: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      bankName: profile.banking.bankName,
      accountNumber: profile.banking.accountNumber,
      accountName: profile.banking.accountName,
      branchCode: profile.banking.branchCode ?? "",
      payPalEmail: profile.banking.payPalEmail ?? "",
      emailNotifications: profile.settings.emailNotifications,
      monthlyReports: profile.settings.monthlyReports,
      referralTracking: profile.settings.referralTracking,
    });
  }, [profile]);

  if (!profile) return <LoadingSkeleton variant="page" />;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        banking: {
          bankName: form.bankName,
          accountNumber: form.accountNumber,
          accountName: form.accountName,
          branchCode: form.branchCode || undefined,
          payPalEmail: form.payPalEmail || undefined,
        },
        settings: {
          emailNotifications: form.emailNotifications,
          monthlyReports: form.monthlyReports,
          referralTracking: form.referralTracking,
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
        description="Live payout and notification settings stored on your reseller profile."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payout Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Bank Name</label>
              <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Account Name</label>
              <Input value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Account Number</label>
              <Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Branch Code</label>
              <Input value={form.branchCode} onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">PayPal Email</label>
              <Input value={form.payPalEmail} onChange={(e) => setForm((f) => ({ ...f, payPalEmail: e.target.value }))} />
            </div>
            <p className="text-sm text-muted-foreground">
              <Wallet className="mr-2 inline h-4 w-4" />
              Minimum payout: KES {profile.commission.minPayout.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive reseller updates and alerts.</p>
              </div>
              <Switch checked={form.emailNotifications} onCheckedChange={(checked) => setForm((f) => ({ ...f, emailNotifications: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Monthly Reports</p>
                <p className="text-sm text-muted-foreground">Send monthly reseller performance reports.</p>
              </div>
              <Switch checked={form.monthlyReports} onCheckedChange={(checked) => setForm((f) => ({ ...f, monthlyReports: checked }))} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="font-medium">Referral Tracking</p>
                <p className="text-sm text-muted-foreground">Track referral code usage and attribution.</p>
              </div>
              <Switch checked={form.referralTracking} onCheckedChange={(checked) => setForm((f) => ({ ...f, referralTracking: checked }))} />
            </div>
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
