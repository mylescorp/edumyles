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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDate, formatDateTime } from "@/lib/formatters";
import {
  Activity,
  AlertTriangle,
  Copy,
  Eye,
  EyeOff,
  Key,
  Plus,
  RefreshCw,
  SearchX,
  Shield,
  Trash2,
} from "lucide-react";
import { SecurityAdminRail } from "@/components/platform/SecurityAdminRail";

type ApiKeyRow = {
  _id: string;
  name: string;
  key: string;
  tenantId: string;
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
};

type UsageStats = {
  totalRequests: number;
  last24h: number;
  last7d: number;
  avgResponseTime: number;
  errorRate: number;
};

const PERMISSION_OPTIONS = [
  "read:tenants",
  "write:tenants",
  "read:users",
  "write:users",
  "read:tickets",
  "write:tickets",
  "read:analytics",
  "read:billing",
  "write:billing",
  "read:crm",
  "write:crm",
] as const;

const EXPIRING_SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PAGE_LOADED_AT = Date.now();

function statusClass(isActive: boolean) {
  return isActive
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
    : "border-rose-500/20 bg-rose-500/10 text-rose-700";
}

export default function ApiKeysPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState("90");
  const [rateLimit, setRateLimit] = useState("1000");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);

  const keys = usePlatformQuery(
    api.platform.apiKeys.queries.listApiKeys,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as ApiKeyRow[] | undefined;

  const usageStats = usePlatformQuery(
    api.platform.apiKeys.queries.getKeyUsageStats,
    sessionToken && selectedKeyId
      ? { sessionToken, keyId: selectedKeyId as never }
      : "skip",
    !!sessionToken && !!selectedKeyId
  ) as UsageStats | undefined;

  const createKey = useMutation(api.platform.apiKeys.mutations.createApiKey);
  const revokeKey = useMutation(api.platform.apiKeys.mutations.revokeApiKey);
  const rotateKey = useMutation(api.platform.apiKeys.mutations.rotateApiKey);

  const filteredKeys = useMemo(() => {
    const rows = keys ?? [];
    const needle = search.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.name, row.key, row.tenantId, row.permissions.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [keys, search]);

  const stats = useMemo(() => {
    const rows = keys ?? [];
    return {
      total: rows.length,
      active: rows.filter((row) => row.isActive).length,
      expiringSoon: rows.filter((row) => row.expiresAt && row.expiresAt < PAGE_LOADED_AT + EXPIRING_SOON_WINDOW_MS).length,
      revoked: rows.filter((row) => !row.isActive).length,
    };
  }, [keys]);

  if (isLoading || keys === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const togglePermission = (permission: string) => {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((entry) => entry !== permission)
        : [...current, permission]
    );
  };

  const handleCreate = async () => {
    if (!sessionToken || !newKeyName.trim() || selectedPermissions.length === 0) return;
    try {
      const result = await createKey({
        sessionToken,
        name: newKeyName.trim(),
        permissions: selectedPermissions,
        expiresInDays: Number(expiryDays),
        rateLimit: Number(rateLimit),
      });
      setNewlyCreatedKey(result.apiKey);
      setNewKeyName("");
      setSelectedPermissions([]);
      setRateLimit("1000");
    } catch (error) {
      toast({
        title: "Unable to create API key",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="API Keys"
        description="Issue and rotate platform API keys, inspect usage, and retire secrets before they become a risk."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "API Keys" },
        ]}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/platform/settings">Settings</Link>
            </Button>
            <Button
              onClick={() => {
                setIsCreateOpen(true);
                setNewlyCreatedKey(null);
                setShowKey(false);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>
        }
      />

      <SecurityAdminRail currentHref="/platform/api-keys" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Total Keys" value={String(stats.total)} icon={Key} />
        <MetricCard title="Active" value={String(stats.active)} icon={Shield} />
        <MetricCard title="Expiring Soon" value={String(stats.expiringSoon)} icon={AlertTriangle} />
        <MetricCard title="Revoked" value={String(stats.revoked)} icon={Trash2} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,1fr]">
        <Card>
          <CardHeader className="gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Key Inventory</CardTitle>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search keys, tenants, or permissions"
                className="w-full md:w-80"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredKeys.length === 0 ? (
              <EmptyState
                icon={search ? SearchX : Key}
                title={search ? "No API keys match this search" : "No API keys created yet"}
                description="Create a platform API key to enable controlled programmatic access."
              />
            ) : (
              <div className="space-y-4">
                {filteredKeys.map((apiKey) => (
                  <div
                    key={String(apiKey._id)}
                    className={`rounded-xl border p-4 ${selectedKeyId === apiKey._id ? "ring-2 ring-primary/20" : ""}`}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-semibold">{apiKey.name}</h3>
                          <Badge variant="outline" className={statusClass(apiKey.isActive)}>
                            {apiKey.isActive ? "Active" : "Revoked"}
                          </Badge>
                        </div>
                        <code className="inline-block rounded bg-muted px-2 py-1 text-sm">{apiKey.key}</code>
                        <div className="flex flex-wrap gap-2">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                        <div className="grid gap-3 md:grid-cols-3 text-sm text-muted-foreground">
                          <InfoItem label="Tenant" value={apiKey.tenantId} />
                          <InfoItem label="Created" value={formatDate(apiKey.createdAt)} />
                          <InfoItem label="Rate Limit" value={`${apiKey.rateLimit}/min`} />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {apiKey.expiresAt ? `Expires ${formatDateTime(apiKey.expiresAt)}` : "No expiry"}
                          {apiKey.lastUsedAt ? ` · Last used ${formatDateTime(apiKey.lastUsedAt)}` : ""}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedKeyId(apiKey._id)}>
                          <Activity className="mr-2 h-4 w-4" />
                          Usage
                        </Button>
                        {apiKey.isActive ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const result = await rotateKey({ sessionToken: sessionToken ?? "", keyId: apiKey._id as never });
                                  setNewlyCreatedKey(result.apiKey);
                                  setShowKey(false);
                                  setIsCreateOpen(true);
                                  toast({ title: "API key rotated" });
                                } catch (error) {
                                  toast({
                                    title: "Unable to rotate API key",
                                    description: error instanceof Error ? error.message : "Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Rotate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  await revokeKey({ sessionToken: sessionToken ?? "", keyId: apiKey._id as never });
                                  toast({ title: "API key revoked" });
                                } catch (error) {
                                  toast({
                                    title: "Unable to revoke API key",
                                    description: error instanceof Error ? error.message : "Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Revoke
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usage Snapshot</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedKeyId ? (
              <EmptyState
                icon={Activity}
                title="Select an API key"
                description="Choose a key from the inventory to inspect request volume, error rate, and response time."
                className="py-10"
              />
            ) : usageStats === undefined ? (
              <LoadingSkeleton variant="card" count={1} />
            ) : (
              <div className="space-y-4">
                <UsageMetric label="Total Requests" value={String(usageStats.totalRequests)} />
                <UsageMetric label="Last 24 Hours" value={String(usageStats.last24h)} />
                <UsageMetric label="Last 7 Days" value={String(usageStats.last7d)} />
                <UsageMetric label="Avg Response Time" value={`${usageStats.avgResponseTime} ms`} />
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className="font-medium">{usageStats.errorRate}%</span>
                  </div>
                  <Progress value={Math.min(usageStats.errorRate, 100)} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{newlyCreatedKey ? "API Key Ready" : "Create API Key"}</DialogTitle>
          </DialogHeader>
          {newlyCreatedKey ? (
            <div className="space-y-4 py-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-sm font-medium">Copy this secret now.</p>
                <p className="mt-1 text-sm text-muted-foreground">For security, the full API key is only shown once.</p>
                <div className="mt-3 flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">
                    {showKey ? newlyCreatedKey : "•".repeat(42)}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => setShowKey((current) => !current)}>
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      void navigator.clipboard.writeText(newlyCreatedKey);
                      toast({ title: "API key copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => {
                  setIsCreateOpen(false);
                  setNewlyCreatedKey(null);
                }}>
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <Field label="Key Name">
                <Input value={newKeyName} onChange={(event) => setNewKeyName(event.target.value)} placeholder="Production CRM integration" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Expiry">
                  <Select value={expiryDays} onValueChange={setExpiryDays}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Rate Limit / min">
                  <Input type="number" value={rateLimit} onChange={(event) => setRateLimit(event.target.value)} />
                </Field>
              </div>
              <Field label="Permissions">
                <div className="grid gap-2 md:grid-cols-2">
                  {PERMISSION_OPTIONS.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission)}
                        onChange={() => togglePermission(permission)}
                        className="rounded"
                      />
                      <span>{permission}</span>
                    </label>
                  ))}
                </div>
              </Field>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newKeyName.trim() || selectedPermissions.length === 0}>
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
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
  icon: typeof Key;
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

function UsageMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
