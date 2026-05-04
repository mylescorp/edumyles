"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, DollarSign, FileText, Save, ShieldCheck, Users } from "lucide-react";

type ResellerProgramSettings = {
  commission: {
    tiers: Record<string, { rate: number; minRevenueKes: number; supportHours: number }>;
    minimumPayoutKes: number;
    payoutSchedule: string;
    paymentMethod: string;
    taxWithholdingPct: number;
  };
  applications: {
    autoApproveTier: string;
    reviewProcess: string;
    probationDays: number;
    requiredDocuments: string[];
    welcomeEmail: boolean;
    onboardingMaterials: boolean;
  };
  support: {
    responseHours: Record<string, number>;
    supportChannels: string[];
    escalationPolicy: boolean;
  };
  notifications: Record<string, boolean>;
};

const DOCUMENTS = [
  "business_registration",
  "tax_compliance",
  "bank_statement",
  "business_plan",
  "financial_statements",
  "references",
];

const CHANNELS = ["email", "phone", "chat", "knowledge_base", "training"];

function titleize(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function PlatformResellerSettings() {
  const { isLoading, sessionToken } = useAuth();
  const settings = useQuery(
    api.platform.resellers.queries.getResellerProgramSettings,
    sessionToken ? { sessionToken } : "skip"
  ) as ResellerProgramSettings | undefined;
  const updateSettings = useMutation(api.platform.resellers.mutations.updateResellerProgramSettings);
  const [draft, setDraft] = useState<ResellerProgramSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const dirty = useMemo(() => {
    if (!settings || !draft) return false;
    return JSON.stringify(settings) !== JSON.stringify(draft);
  }, [draft, settings]);

  if (isLoading || !draft) return <LoadingSkeleton variant="page" />;

  async function save() {
    if (!sessionToken || !draft) return;
    setSaving(true);
    try {
      await updateSettings({ sessionToken, settings: draft });
      toast.success("Reseller program settings saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save reseller settings.");
    } finally {
      setSaving(false);
    }
  }

  function update(path: (string | number)[], value: unknown) {
    setDraft((current) => {
      if (!current) return current;
      const next = structuredClone(current) as any;
      let cursor = next;
      for (const key of path.slice(0, -1)) cursor = cursor[key];
      if (path.length === 0) return current;
      const lastKey = path[path.length - 1] as string | number;
      cursor[lastKey] = value;
      return next;
    });
  }

  function toggleArray(path: string[], item: string, checked: boolean) {
    const current = path.reduce((cursor: any, key) => cursor[key], draft) as string[];
    update(path, checked ? Array.from(new Set([...current, item])) : current.filter((value) => value !== item));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reseller Settings"
        description="Configure live reseller commission, application, support, and notification policy."
        actions={
          <Button onClick={save} disabled={!dirty || saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        }
      />

      <Tabs defaultValue="commission">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="commission">Commission</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="commission" className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            {Object.entries(draft.commission.tiers).map(([tier, tierSettings]) => (
              <Card key={tier}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    {titleize(tier)} Tier
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Commission Rate (%)</Label>
                    <Input type="number" value={tierSettings.rate} onChange={(e) => update(["commission", "tiers", tier, "rate"], Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Revenue (KES)</Label>
                    <Input type="number" value={tierSettings.minRevenueKes} onChange={(e) => update(["commission", "tiers", tier, "minRevenueKes"], Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Support SLA (hours)</Label>
                    <Input type="number" value={tierSettings.supportHours} onChange={(e) => update(["commission", "tiers", tier, "supportHours"], Number(e.target.value))} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4" />
                Payout Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Minimum Payout (KES)</Label>
                <Input type="number" value={draft.commission.minimumPayoutKes} onChange={(e) => update(["commission", "minimumPayoutKes"], Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payout Schedule</Label>
                <Select value={draft.commission.payoutSchedule} onValueChange={(value) => update(["commission", "payoutSchedule"], value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={draft.commission.paymentMethod} onValueChange={(value) => update(["commission", "paymentMethod"], value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Withholding (%)</Label>
                <Input type="number" value={draft.commission.taxWithholdingPct} onChange={(e) => update(["commission", "taxWithholdingPct"], Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" />Application Rules</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Auto-Approve Tier</Label>
                <Select value={draft.applications.autoApproveTier} onValueChange={(value) => update(["applications", "autoApproveTier"], value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No auto approval</SelectItem>
                    {Object.keys(draft.commission.tiers).map((tier) => <SelectItem key={tier} value={tier}>{titleize(tier)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Review Process</Label>
                <Select value={draft.applications.reviewProcess} onValueChange={(value) => update(["applications", "reviewProcess"], value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="automated">Automated</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Probation Days</Label>
                <Input type="number" value={draft.applications.probationDays} onChange={(e) => update(["applications", "probationDays"], Number(e.target.value))} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Required Documents</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {DOCUMENTS.map((document) => (
                <label key={document} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{titleize(document)}</span>
                  <Switch checked={draft.applications.requiredDocuments.includes(document)} onCheckedChange={(checked) => toggleArray(["applications", "requiredDocuments"], document, checked)} />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Onboarding</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>Send welcome email</span>
                <Switch checked={draft.applications.welcomeEmail} onCheckedChange={(checked) => update(["applications", "welcomeEmail"], checked)} />
              </label>
              <label className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>Enable onboarding materials</span>
                <Switch checked={draft.applications.onboardingMaterials} onCheckedChange={(checked) => update(["applications", "onboardingMaterials"], checked)} />
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4" />Support SLAs</CardTitle></CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              {Object.entries(draft.support.responseHours).map(([tier, hours]) => (
                <div key={tier} className="space-y-2">
                  <Label>{titleize(tier)} Hours</Label>
                  <Input type="number" value={hours} onChange={(e) => update(["support", "responseHours", tier], Number(e.target.value))} />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Support Channels</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {CHANNELS.map((channel) => (
                <label key={channel} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{titleize(channel)}</span>
                  <Switch checked={draft.support.supportChannels.includes(channel)} onCheckedChange={(checked) => toggleArray(["support", "supportChannels"], channel, checked)} />
                </label>
              ))}
              <label className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>Escalation policy</span>
                <Switch checked={draft.support.escalationPolicy} onCheckedChange={(checked) => update(["support", "escalationPolicy"], checked)} />
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4" />Notifications</CardTitle></CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {Object.entries(draft.notifications).map(([key, enabled]) => (
                <label key={key} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{titleize(key)}</span>
                  <Switch checked={enabled} onCheckedChange={(checked) => update(["notifications", key], checked)} />
                </label>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
