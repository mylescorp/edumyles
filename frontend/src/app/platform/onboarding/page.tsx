"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { api } from "@/convex/_generated/api";
import { TenantsAdminRail } from "@/components/platform/TenantsAdminRail";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Rocket,
  Search,
  TrendingUp,
} from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  schoolProfile: "School profile",
  rolesConfigured: "Roles configured",
  staffAdded: "Staff added",
  studentsAdded: "Students added",
  classesCreated: "Classes created",
  modulesConfigured: "Modules configured",
  portalCustomized: "Portal customized",
  parentsInvited: "Parents invited",
  firstPaymentProcessed: "First payment processed",
};

type PlatformOnboardingRecord = {
  _id: string;
  tenantId: string;
  tenantName: string;
  tenantStatus?: string;
  planId?: string;
  trialEndsAt?: number;
  healthScore: number;
  wizardCompleted: boolean;
  stalled: boolean;
  lastActivityAt: number;
  createdAt: number;
  updatedAt: number;
  status: "completed" | "stalled" | "in_progress";
  completedCount: number;
  totalSteps: number;
  progressPct: number;
  steps: Record<
    string,
    {
      completed?: boolean;
      completedAt?: number;
      count?: number;
    }
  >;
};

function formatDate(value?: number) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleDateString();
}

function formatRelative(value: number) {
  const diffMs = Date.now() - value;
  const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  if (diffHours < 1) return "Updated just now";
  if (diffHours < 24) return `Updated ${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `Updated ${diffDays}d ago`;
}

function statusBadge(status: PlatformOnboardingRecord["status"]) {
  if (status === "completed") return "bg-green-100 text-green-700 border-green-200";
  if (status === "stalled") return "bg-red-100 text-red-700 border-red-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [isRefreshing, startRefreshing] = useTransition();

  const records = usePlatformQuery(
    api.modules.platform.onboarding.getPlatformOnboardingRecords,
    { sessionToken: sessionToken ?? "" },
    !!sessionToken
  ) as PlatformOnboardingRecord[] | undefined;

  const selectedRecord = usePlatformQuery(
    api.modules.platform.onboarding.getPlatformOnboardingRecord,
    selectedTenantId && sessionToken ? { sessionToken, tenantId: selectedTenantId } : "skip"
  ) as PlatformOnboardingRecord | null | undefined;

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      [record.tenantName, record.tenantId, record.planId ?? "", record.tenantStatus ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [records, search]);

  const stats = useMemo(() => {
    if (!records) {
      return { total: 0, completed: 0, stalled: 0, avgHealth: 0 };
    }
    const completed = records.filter((record) => record.status === "completed").length;
    const stalled = records.filter((record) => record.status === "stalled").length;
    const avgHealth =
      records.length > 0
        ? Math.round(records.reduce((sum, record) => sum + (record.healthScore ?? 0), 0) / records.length)
        : 0;
    return { total: records.length, completed, stalled, avgHealth };
  }, [records]);

  if (records === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant Onboarding"
        description="Monitor real onboarding progress, health score, and trial readiness from Convex."
        actions={
          <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <TenantsAdminRail currentHref="/platform/onboarding" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracked tenants</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Rocket className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Stalled</p>
                <p className="text-2xl font-bold text-red-600">{stats.stalled}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average health</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgHealth}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Onboarding queue</CardTitle>
              <CardDescription>Search and inspect tenant onboarding records without simulated step forms.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tenants"
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredRecords.length === 0 ? (
              <EmptyState
                icon={Rocket}
                title="No onboarding records found"
                description="Try a different search term or start onboarding by provisioning a tenant first."
                className="py-12"
              />
            ) : (
              <div className="space-y-3">
                {filteredRecords.map((record) => (
                  <button
                    type="button"
                    key={record._id}
                    onClick={() => setSelectedTenantId(record.tenantId)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedTenantId === record.tenantId ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{record.tenantName}</p>
                          <Badge variant="outline" className={statusBadge(record.status)}>
                            {record.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{record.tenantId}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Plan: {record.planId ?? "Not assigned"} · Tenant status: {record.tenantStatus ?? "unknown"}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>{record.completedCount}/{record.totalSteps} steps</p>
                        <p>{formatRelative(record.lastActivityAt)}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <Progress value={record.progressPct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Health score: {record.healthScore}%</span>
                        <span>Trial ends: {formatDate(record.trialEndsAt)}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Onboarding detail</CardTitle>
            <CardDescription>Step completion comes from the real tenant onboarding table.</CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTenantId === null ? (
              <EmptyState
                icon={Clock3}
                title="Select a tenant"
                description="Choose an onboarding record from the queue to inspect its completed steps and trial timing."
                className="py-12"
              />
            ) : selectedRecord === undefined ? (
              <LoadingSkeleton variant="card" count={3} />
            ) : selectedRecord === null ? (
              <EmptyState
                icon={AlertTriangle}
                title="Onboarding record missing"
                description="This tenant does not have a matching onboarding record yet."
                className="py-12"
              />
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedRecord.tenantName}</h3>
                    <Badge variant="outline" className={statusBadge(selectedRecord.status)}>
                      {selectedRecord.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedRecord.tenantId}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="border-border/60">
                    <CardContent className="pt-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Health score</p>
                      <p className="text-2xl font-bold">{selectedRecord.healthScore}%</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/60">
                    <CardContent className="pt-4">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Trial ends</p>
                      <p className="text-lg font-semibold">{formatDate(selectedRecord.trialEndsAt)}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-3">
                  {Object.entries(selectedRecord.steps ?? {}).map(([stepKey, step]) => (
                    <div key={stepKey} className="rounded-xl border border-border/60 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{STEP_LABELS[stepKey] ?? stepKey}</p>
                          <p className="text-xs text-muted-foreground">
                            {step.completedAt ? `Completed on ${formatDate(step.completedAt)}` : "Not completed yet"}
                          </p>
                        </div>
                        <Badge variant={step.completed ? "default" : "secondary"}>
                          {step.completed ? "Done" : "Pending"}
                        </Badge>
                      </div>
                      {typeof step.count === "number" ? (
                        <p className="mt-2 text-xs text-muted-foreground">Recorded count: {step.count}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
