"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { BillingAdminRail } from "@/components/platform/BillingAdminRail";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { Boxes, Pencil, Plus, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";

type ApiAccess = "none" | "read" | "read_write";
type WhiteLabel = "none" | "logo" | "full";

type PlanCatalogItem = {
  id: string;
  name: string;
  priceMonthlyKes: number;
  priceAnnualKes: number;
  studentLimit?: number;
  staffLimit?: number;
  storageGb?: number;
  includedModuleIds: string[];
  maxAdditionalModules?: number;
  apiAccess: ApiAccess;
  whiteLabel: WhiteLabel;
  customDomain: boolean;
  supportTier: string;
  slaHours?: number;
  isActive: boolean;
  isDefault: boolean;
  subscriberCount: number;
  includedModules: Array<{ id: string; name: string; category: string }>;
};

type ModuleRow = {
  moduleId: string;
  name: string;
  category?: string;
  slug?: string;
};

type EditForm = {
  planName: string;
  priceMonthlyKes: string;
  priceAnnualKes: string;
  studentLimit: string;
  staffLimit: string;
  storageGb: string;
  maxAdditionalModules: string;
  apiAccess: ApiAccess;
  whiteLabel: WhiteLabel;
  customDomain: boolean;
  supportTier: string;
  slaHours: string;
  isActive: boolean;
  isDefault: boolean;
  includedModuleIds: string[];
};

function formatKes(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function buildForm(plan: PlanCatalogItem): EditForm {
  return {
    planName: plan.name,
    priceMonthlyKes: String(plan.priceMonthlyKes),
    priceAnnualKes: String(plan.priceAnnualKes),
    studentLimit: plan.studentLimit?.toString() ?? "",
    staffLimit: plan.staffLimit?.toString() ?? "",
    storageGb: plan.storageGb?.toString() ?? "",
    maxAdditionalModules: plan.maxAdditionalModules?.toString() ?? "",
    apiAccess: plan.apiAccess,
    whiteLabel: plan.whiteLabel,
    customDomain: plan.customDomain,
    supportTier: plan.supportTier,
    slaHours: plan.slaHours?.toString() ?? "",
    isActive: plan.isActive,
    isDefault: plan.isDefault,
    includedModuleIds: plan.includedModuleIds,
  };
}

export default function BillingPlansPage() {
  const { sessionToken, isLoading } = useAuth();
  const [search, setSearch] = useState("");
  const [editingPlan, setEditingPlan] = useState<PlanCatalogItem | null>(null);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [saving, setSaving] = useState(false);

  const plans = usePlatformQuery(
    api.modules.platform.subscriptions.getPlatformPlanCatalog,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PlanCatalogItem[] | undefined;

  const publishedModules = usePlatformQuery(
    api.modules.marketplace.platformDashboard.getPlatformMarketplaceModules,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as ModuleRow[] | undefined;

  const updatePlan = useMutation(api.modules.platform.subscriptions.updateSubscriptionPlan);
  const createPlan = useMutation(api.modules.platform.subscriptions.createSubscriptionPlan);
  const ensureTechSpecPlans = useMutation(api.modules.platform.subscriptions.ensureTechSpecPlans);

  const filteredPlans = useMemo(() => {
    const rows = plans ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((plan) =>
      [plan.name, plan.supportTier, ...plan.includedModules.map((module) => module.name)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [plans, search]);

  const totals = useMemo(() => {
    const rows = plans ?? [];
    return {
      totalSubscribers: rows.reduce((sum, plan) => sum + plan.subscriberCount, 0),
      activePlans: rows.filter((plan) => plan.isActive).length,
      moduleCoverage: new Set(rows.flatMap((plan) => plan.includedModuleIds)).size,
    };
  }, [plans]);

  const modulesByCategory = useMemo(() => {
    const rows = publishedModules ?? [];
    return rows.reduce(
      (acc, module) => {
        const category = module.category || "general";
        acc[category] = [...(acc[category] ?? []), module];
        return acc;
      },
      {} as Record<string, ModuleRow[]>
    );
  }, [publishedModules]);

  if (isLoading || plans === undefined || publishedModules === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleOpenEdit = (plan: PlanCatalogItem) => {
    setEditingPlan(plan);
    setForm(buildForm(plan));
  };

  const handleOpenCreate = () => {
    setCreatingPlan(true);
    setEditingPlan(null);
    setForm({
      planName: "",
      priceMonthlyKes: "0",
      priceAnnualKes: "0",
      studentLimit: "",
      staffLimit: "",
      storageGb: "",
      maxAdditionalModules: "",
      apiAccess: "none",
      whiteLabel: "none",
      customDomain: false,
      supportTier: "standard",
      slaHours: "",
      isActive: true,
      isDefault: false,
      includedModuleIds: [],
    });
  };

  const handleModuleToggle = (moduleId: string, checked: boolean) => {
    if (!form) return;
    setForm({
      ...form,
      includedModuleIds: checked
        ? [...form.includedModuleIds, moduleId]
        : form.includedModuleIds.filter((value) => value !== moduleId),
    });
  };

  const handleSave = async () => {
    if (!sessionToken || !form) return;
    if (!form.planName.trim()) {
      toast.error("Plan name is required.");
      return;
    }

    const monthly = Number(form.priceMonthlyKes);
    const annual = Number(form.priceAnnualKes);
    if (!Number.isFinite(monthly) || !Number.isFinite(annual)) {
      toast.error("Monthly and annual pricing must be valid numbers.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        sessionToken,
        planName: form.planName.trim().toLowerCase(),
        priceMonthlyKes: monthly,
        priceAnnualKes: annual,
        studentLimit: form.studentLimit ? Number(form.studentLimit) : undefined,
        staffLimit: form.staffLimit ? Number(form.staffLimit) : undefined,
        storageGb: form.storageGb ? Number(form.storageGb) : undefined,
        includedModuleIds: form.includedModuleIds,
        maxAdditionalModules: form.maxAdditionalModules
          ? Number(form.maxAdditionalModules)
          : undefined,
        apiAccess: form.apiAccess,
        whiteLabel: form.whiteLabel,
        customDomain: form.customDomain,
        supportTier: form.supportTier,
        slaHours: form.slaHours ? Number(form.slaHours) : undefined,
        isActive: form.isActive,
        isDefault: form.isDefault,
      } as const;

      if (creatingPlan) {
        await createPlan(payload);
        toast.success("Subscription plan created.");
      } else {
        await updatePlan(payload);
        toast.success("Subscription plan updated.");
      }
      setEditingPlan(null);
      setCreatingPlan(false);
      setForm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${creatingPlan ? "create" : "update"} plan.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription Plans"
        description="Configure plan pricing, usage ceilings, and included marketplace modules."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Billing", href: "/platform/billing" },
          { label: "Plans", href: "/platform/billing/plans" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button
              onClick={handleOpenCreate}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Plan
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!sessionToken) return;
                try {
                  const result = await ensureTechSpecPlans({ sessionToken });
                  toast.success(`Tech spec plans synced (${result.created} created, ${result.updated} updated).`);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Failed to sync tech spec plans.");
                }
              }}
            >
              Sync Tech Spec Plans
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/billing">Billing overview</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform/billing/subscriptions">Subscriptions</Link>
            </Button>
          </div>
        }
      />

      <BillingAdminRail currentHref="/platform/billing/plans" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{totals.totalSubscribers}</p>
              <p className="text-sm text-muted-foreground">Active subscribers</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <ShieldCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{totals.activePlans}</p>
              <p className="text-sm text-muted-foreground">Enabled plans</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Boxes className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold">{totals.moduleCoverage}</p>
              <p className="text-sm text-muted-foreground">Modules bundled</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-sm">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plans or included modules"
        />
      </div>

      {filteredPlans.length === 0 ? (
        <EmptyState
          title="No plans found"
          description="Adjust the search terms to find a subscription plan."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredPlans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="capitalize">{plan.name}</CardTitle>
                    {plan.isDefault ? <Badge>Default</Badge> : null}
                    {!plan.isActive ? <Badge variant="secondary">Inactive</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatKes(plan.priceMonthlyKes)} / month and {formatKes(plan.priceAnnualKes)} / year
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(plan)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Subscribers</div>
                    <div className="mt-1 text-lg font-semibold">{plan.subscriberCount}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Support tier</div>
                    <div className="mt-1 text-lg font-semibold capitalize">{plan.supportTier}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Student limit</div>
                    <div className="mt-1 text-lg font-semibold">{plan.studentLimit ?? "Unlimited"}</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-muted-foreground">Storage</div>
                    <div className="mt-1 text-lg font-semibold">{plan.storageGb ?? "Unlimited"} GB</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <Badge variant="outline">API: {plan.apiAccess.replace("_", " ")}</Badge>
                  <Badge variant="outline">White-label: {plan.whiteLabel}</Badge>
                  <Badge variant="outline">
                    {plan.customDomain ? "Custom domains enabled" : "No custom domains"}
                  </Badge>
                  {plan.slaHours ? <Badge variant="outline">SLA {plan.slaHours}h</Badge> : null}
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Included modules</div>
                  {plan.includedModules.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No bundled modules on this plan.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {plan.includedModules.map((module) => (
                        <Badge key={module.id} variant="secondary">
                          {module.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={editingPlan !== null || creatingPlan}
        onOpenChange={(open) => {
          if (!open) {
            setEditingPlan(null);
            setCreatingPlan(false);
            setForm(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {creatingPlan ? `Create ${form?.planName ?? "subscription"} plan` : `Edit ${editingPlan?.name} plan`}
            </DialogTitle>
          </DialogHeader>

          {form ? (
            <div className="space-y-6 py-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan name</Label>
                  {creatingPlan ? (
                    <Select
                      value={form.planName}
                      onValueChange={(value) => setForm({ ...form, planName: value })}
                    >
                      <SelectTrigger id="plan-name">
                        <SelectValue placeholder="Select official plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {["free", "starter", "pro", "enterprise"].map((planName) => (
                          <SelectItem key={planName} value={planName}>
                            {planName.charAt(0).toUpperCase() + planName.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input id="plan-name" value={form.planName} disabled />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monthly-price">Monthly price (KES)</Label>
                  <Input
                    id="monthly-price"
                    value={form.priceMonthlyKes}
                    onChange={(event) => setForm({ ...form, priceMonthlyKes: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="annual-price">Annual price (KES)</Label>
                  <Input
                    id="annual-price"
                    value={form.priceAnnualKes}
                    onChange={(event) => setForm({ ...form, priceAnnualKes: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-limit">Student limit</Label>
                  <Input
                    id="student-limit"
                    value={form.studentLimit}
                    onChange={(event) => setForm({ ...form, studentLimit: event.target.value })}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-limit">Staff limit</Label>
                  <Input
                    id="staff-limit"
                    value={form.staffLimit}
                    onChange={(event) => setForm({ ...form, staffLimit: event.target.value })}
                    placeholder="Leave blank for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storage-gb">Storage (GB)</Label>
                  <Input
                    id="storage-gb"
                    value={form.storageGb}
                    onChange={(event) => setForm({ ...form, storageGb: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional-modules">Max additional modules</Label>
                  <Input
                    id="additional-modules"
                    value={form.maxAdditionalModules}
                    onChange={(event) =>
                      setForm({ ...form, maxAdditionalModules: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>API access</Label>
                  <Select
                    value={form.apiAccess}
                    onValueChange={(value) => setForm({ ...form, apiAccess: value as ApiAccess })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                      <SelectItem value="read_write">Read / Write</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>White-label level</Label>
                  <Select
                    value={form.whiteLabel}
                    onValueChange={(value) => setForm({ ...form, whiteLabel: value as WhiteLabel })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="logo">Logo only</SelectItem>
                      <SelectItem value="full">Full white-label</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support-tier">Support tier</Label>
                  <Input
                    id="support-tier"
                    value={form.supportTier}
                    onChange={(event) => setForm({ ...form, supportTier: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sla-hours">SLA hours</Label>
                  <Input
                    id="sla-hours"
                    value={form.slaHours}
                    onChange={(event) => setForm({ ...form, slaHours: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <Switch
                    checked={form.customDomain}
                    onCheckedChange={(checked) => setForm({ ...form, customDomain: checked })}
                  />
                  <span className="text-sm font-medium">Custom domain support</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
                  />
                  <span className="text-sm font-medium">Plan active</span>
                </label>
                <label className="flex items-center gap-3 rounded-lg border p-3">
                  <Switch
                    checked={form.isDefault}
                    onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                  />
                  <span className="text-sm font-medium">Default onboarding plan</span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold">Included modules</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the marketplace modules bundled with this subscription plan.
                  </p>
                </div>
                <div className="space-y-4">
                  {Object.entries(modulesByCategory).map(([category, modules]) => (
                    <div key={category} className="rounded-lg border p-4">
                      <div className="mb-3 text-sm font-medium capitalize">{category}</div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {modules.map((module) => (
                          <label key={module.moduleId} className="flex items-center gap-3 rounded-md border p-3">
                            <Checkbox
                              checked={form.includedModuleIds.includes(module.moduleId)}
                              onCheckedChange={(checked) =>
                                handleModuleToggle(module.moduleId, Boolean(checked))
                              }
                            />
                            <div>
                              <div className="font-medium">{module.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {module.category || "general"}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingPlan(null);
                    setCreatingPlan(false);
                    setForm(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : creatingPlan ? "Create plan" : "Save changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
