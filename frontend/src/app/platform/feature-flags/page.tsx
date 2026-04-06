"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { AlertTriangle, Flag, Globe, Plus, Rocket, SearchX, Settings2, Users } from "lucide-react";
import { SecurityAdminRail } from "@/components/platform/SecurityAdminRail";

type FeatureFlagRow = {
  _id: string;
  key: string;
  enabledGlobally: boolean;
  enabledTenantIds: string[];
  rolloutPct?: number;
  updatedAt: number;
};

function rolloutLabel(flag: FeatureFlagRow) {
  if (flag.enabledGlobally) return "Global";
  if ((flag.enabledTenantIds?.length ?? 0) > 0) return "Tenant override";
  if (typeof flag.rolloutPct === "number" && flag.rolloutPct > 0) return "Gradual rollout";
  return "Disabled";
}

function rolloutIcon(flag: FeatureFlagRow) {
  if (flag.enabledGlobally) return Globe;
  if ((flag.enabledTenantIds?.length ?? 0) > 0) return Users;
  if (typeof flag.rolloutPct === "number" && flag.rolloutPct > 0) return Rocket;
  return Settings2;
}

export default function FeatureFlagsPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    key: "",
    enabledGlobally: false,
    enabledTenantIds: "",
    rolloutPct: "",
  });

  const flags = usePlatformQuery(
    api.modules.platform.ops.getFeatureFlags,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as FeatureFlagRow[] | undefined;

  const upsertFeatureFlag = useMutation(api.modules.platform.ops.upsertFeatureFlag);

  const filteredFlags = useMemo(() => {
    const rows = flags ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((flag) =>
      [flag.key, flag.enabledTenantIds.join(" "), rolloutLabel(flag)].join(" ").toLowerCase().includes(needle)
    );
  }, [flags, search]);

  const stats = useMemo(() => {
    const rows = flags ?? [];
    return {
      total: rows.length,
      global: rows.filter((flag) => flag.enabledGlobally).length,
      tenantScoped: rows.filter((flag) => flag.enabledTenantIds.length > 0).length,
      gradual: rows.filter((flag) => typeof flag.rolloutPct === "number" && flag.rolloutPct > 0 && flag.rolloutPct < 100).length,
    };
  }, [flags]);

  if (isLoading || flags === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const handleSave = async () => {
    if (!sessionToken || !form.key.trim()) return;
    try {
      await upsertFeatureFlag({
        sessionToken,
        key: form.key.trim(),
        enabledGlobally: form.enabledGlobally,
        enabledTenantIds: form.enabledTenantIds.split(",").map((value) => value.trim()).filter(Boolean),
        rolloutPct: form.rolloutPct ? Number(form.rolloutPct) : undefined,
      });
      toast({ title: "Feature flag saved" });
      setDialogOpen(false);
      setForm({ key: "", enabledGlobally: false, enabledTenantIds: "", rolloutPct: "" });
    } catch (error) {
      toast({
        title: "Unable to save feature flag",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feature Flags"
        description="Control platform rollouts, tenant overrides, and gradual enablement without shipping new code."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Feature Flags" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/platform/settings">Settings</Link>
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Flag
            </Button>
          </div>
        }
      />

      <SecurityAdminRail currentHref="/platform/feature-flags" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total flags" value={String(stats.total)} icon={Flag} />
        <MetricCard title="Global flags" value={String(stats.global)} icon={Globe} />
        <MetricCard title="Tenant scoped" value={String(stats.tenantScoped)} icon={Users} />
        <MetricCard title="Gradual rollouts" value={String(stats.gradual)} icon={Rocket} />
      </div>

      <Card className="border-amber-500/20 bg-amber-500/5">
        <CardContent className="flex items-start gap-3 pt-6 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-700" />
          <p>
            Global flags affect every tenant immediately. Use gradual rollout percentages or tenant overrides first when a feature has any delivery or support risk.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Rollout console</CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search flag keys or rollout mode"
              className="w-full md:w-80"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredFlags.length === 0 ? (
            <EmptyState
              icon={search ? SearchX : Flag}
              title={search ? "No feature flags match this search" : "No feature flags yet"}
              description="Create flags here to control staged rollouts, tenant-specific access, and emergency kill switches."
            />
          ) : (
            <div className="space-y-4">
              {filteredFlags.map((flag) => {
                const Icon = rolloutIcon(flag);
                const rolloutPct = flag.enabledGlobally ? 100 : flag.rolloutPct ?? 0;

                return (
                  <div key={String(flag._id)} className="rounded-xl border p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{flag.key}</h3>
                          <Badge variant="outline" className={flag.enabledGlobally ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700" : "border-slate-500/20 bg-slate-500/10 text-slate-700"}>
                            {rolloutLabel(flag)}
                          </Badge>
                          {flag.enabledTenantIds.length > 0 ? (
                            <Badge variant="outline" className="border-sky-500/20 bg-sky-500/10 text-sky-700">
                              {flag.enabledTenantIds.length} tenant override{flag.enabledTenantIds.length === 1 ? "" : "s"}
                            </Badge>
                          ) : null}
                        </div>

                        <div className="grid gap-3 md:grid-cols-3">
                          <InfoItem label="Updated" value={formatDateTime(flag.updatedAt)} />
                          <InfoItem label="Rollout" value={`${rolloutPct}%`} />
                          <InfoItem label="Mode" value={rolloutLabel(flag)} />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon className="h-4 w-4" />
                            <span>Exposure level</span>
                          </div>
                          <Progress value={rolloutPct} />
                        </div>

                        {flag.enabledTenantIds.length > 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Tenant IDs: {flag.enabledTenantIds.join(", ")}
                          </p>
                        ) : null}
                      </div>

                      <div className="min-w-[220px] rounded-xl border bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Global enablement</p>
                            <p className="text-sm text-muted-foreground">Turn the flag on for every tenant.</p>
                          </div>
                          <Switch
                            checked={flag.enabledGlobally}
                            onCheckedChange={async (checked) => {
                              try {
                                await upsertFeatureFlag({
                                  sessionToken: sessionToken ?? "",
                                  key: flag.key,
                                  enabledGlobally: checked,
                                  enabledTenantIds: flag.enabledTenantIds,
                                  rolloutPct: flag.rolloutPct,
                                });
                                toast({ title: checked ? "Flag enabled globally" : "Global enablement removed" });
                              } catch (error) {
                                toast({
                                  title: "Unable to update feature flag",
                                  description: error instanceof Error ? error.message : "Please try again.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create feature flag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Flag key">
              <Input
                value={form.key}
                onChange={(event) => setForm({ ...form, key: event.target.value })}
                placeholder="marketplace.beta_checkout"
              />
            </Field>
            <Field label="Tenant overrides (comma-separated tenant IDs)">
              <Textarea
                rows={3}
                value={form.enabledTenantIds}
                onChange={(event) => setForm({ ...form, enabledTenantIds: event.target.value })}
                placeholder="tenant_abc, tenant_xyz"
              />
            </Field>
            <Field label="Rollout %">
              <Input
                type="number"
                min="0"
                max="100"
                value={form.rolloutPct}
                onChange={(event) => setForm({ ...form, rolloutPct: event.target.value })}
                placeholder="25"
              />
            </Field>
            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">Enable globally</p>
                <p className="text-sm text-muted-foreground">Use only when the rollout is ready for every tenant.</p>
              </div>
              <Switch
                checked={form.enabledGlobally}
                onCheckedChange={(checked) => setForm({ ...form, enabledGlobally: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Flag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Flag;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold">{value}</p>
          </div>
          <div className="rounded-xl border bg-muted/40 p-2">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
