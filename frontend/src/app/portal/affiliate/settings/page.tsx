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
import { Save } from "lucide-react";

type Profile = {
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
};

export default function AffiliateSettingsPage() {
  const profile = useQuery(api.modules.reseller.mutations.profile.getMyProfile, {}) as Profile | undefined;
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

  async function save() {
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
      <PageHeader title="Affiliate Settings" description="Manage your live affiliate payout and notification settings." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Payout Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={form.bankName} onChange={(e) => setForm((f) => ({ ...f, bankName: e.target.value }))} placeholder="Bank name" />
            <Input value={form.accountName} onChange={(e) => setForm((f) => ({ ...f, accountName: e.target.value }))} placeholder="Account name" />
            <Input value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} placeholder="Account number" />
            <Input value={form.branchCode} onChange={(e) => setForm((f) => ({ ...f, branchCode: e.target.value }))} placeholder="Branch code" />
            <Input value={form.payPalEmail} onChange={(e) => setForm((f) => ({ ...f, payPalEmail: e.target.value }))} placeholder="PayPal email" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3"><span>Email notifications</span><Switch checked={form.emailNotifications} onCheckedChange={(checked) => setForm((f) => ({ ...f, emailNotifications: checked }))} /></div>
            <div className="flex items-center justify-between rounded-md border p-3"><span>Monthly reports</span><Switch checked={form.monthlyReports} onCheckedChange={(checked) => setForm((f) => ({ ...f, monthlyReports: checked }))} /></div>
            <div className="flex items-center justify-between rounded-md border p-3"><span>Referral tracking</span><Switch checked={form.referralTracking} onCheckedChange={(checked) => setForm((f) => ({ ...f, referralTracking: checked }))} /></div>
          </CardContent>
        </Card>
      </div>
      <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Settings"}</Button>
    </div>
  );
}
