"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Package,
  Search,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { MarketplaceErrorBoundary } from "../MarketplaceErrorBoundary";

const marketplacePlatformApi =
  (api as any).modules?.marketplace?.platformDashboard ??
  (api as any)["modules/marketplace/platformDashboard"];

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function daysWaiting(timestamp: number) {
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86400000));
}

function QueueMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-red-700"
      : tone === "warning"
        ? "text-amber-700"
        : "text-slate-950";

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardContent className="pt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">{label}</p>
        <p className={`mt-3 text-3xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export default function MarketplaceAdminPage() {
  return (
    <MarketplaceErrorBoundary>
      <MarketplaceAdminContent />
    </MarketplaceErrorBoundary>
  );
}

function MarketplaceAdminContent() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("oldest");
  const [daysFilter, setDaysFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedModule, setSelectedModule] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const pendingModules = usePlatformQuery(
    marketplacePlatformApi.getPlatformMarketplaceSubmissionQueue,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as any[] | undefined;

  const reviewSubmission = useMutation(marketplacePlatformApi.reviewPlatformMarketplaceSubmission);

  const categories = useMemo(() => {
    const values = new Set<string>();
    for (const item of pendingModules || []) {
      if (item.category) values.add(item.category);
    }
    return Array.from(values).sort();
  }, [pendingModules]);

  const filteredModules = useMemo(() => {
    const base = [...(pendingModules || [])].filter((module) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        module.name.toLowerCase().includes(query) ||
        module.slug.toLowerCase().includes(query) ||
        module.description?.toLowerCase().includes(query);

      const matchesCategory = category === "all" || module.category === category;

      const waitDays = daysWaiting(module.submittedAt);
      const matchesDays =
        daysFilter === "all" ||
        (daysFilter === "gt5" && waitDays > 5) ||
        (daysFilter === "lte5" && waitDays <= 5);

      return matchesSearch && matchesCategory && matchesDays;
    });

    base.sort((a, b) => {
      if (sort === "newest") return b.submittedAt - a.submittedAt;
      if (sort === "name") return a.name.localeCompare(b.name);
      return a.submittedAt - b.submittedAt;
    });

    return base;
  }, [pendingModules, search, category, sort, daysFilter]);

  const selectedModules = filteredModules.filter((module) => selectedIds.includes(module.moduleId));
  const overSla = filteredModules.filter((module) => daysWaiting(module.submittedAt) > 5).length;

  async function handleDecision(
    decision: "approved" | "rejected" | "requires_changes",
    targetModules: any[]
  ) {
    if (!sessionToken || targetModules.length === 0) return;

    try {
      for (const queueItem of targetModules) {
        await reviewSubmission({
          sessionToken,
          moduleId: queueItem.moduleId,
          decision,
          notes: reviewNotes || undefined,
        });
      }

      setSelectedIds([]);
      setSelectedModule(null);
      setReviewNotes("");
      toast.success(
        decision === "approved"
          ? `Approved ${targetModules.length} module${targetModules.length === 1 ? "" : "s"}`
          : decision === "rejected"
            ? `Rejected ${targetModules.length} module${targetModules.length === 1 ? "" : "s"}`
            : `Requested changes for ${targetModules.length} module${targetModules.length === 1 ? "" : "s"}`
      );
    } catch (error: any) {
      toast.error(error.message || "Unable to process review action");
    }
  }

  function toggleModule(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  if (!pendingModules) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Review Queue"
          description="Draft marketplace submissions waiting on platform review."
          breadcrumbs={[
            { label: "Platform", href: "/platform" },
            { label: "Marketplace", href: "/platform/marketplace" },
            { label: "Review Queue", href: "/platform/marketplace/admin" },
          ]}
        />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-36 rounded-2xl" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Queue"
        description="Draft marketplace submissions waiting on platform review."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Review Queue", href: "/platform/marketplace/admin" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/platform/marketplace")}>
              Marketplace Dashboard
            </Button>
          </div>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/admin" />

      <div className="grid gap-4 md:grid-cols-4">
        <QueueMetric label="Pending Submissions" value={filteredModules.length.toLocaleString()} />
        <QueueMetric label="Waiting > 5 Days" value={overSla.toLocaleString()} tone={overSla > 0 ? "danger" : "default"} />
        <QueueMetric label="Selected" value={selectedIds.length.toLocaleString()} tone={selectedIds.length > 0 ? "warning" : "default"} />
        <QueueMetric label="Oldest Queue Age" value={`${filteredModules[0] ? daysWaiting(filteredModules[0].submittedAt) : 0}d`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Queue Filters</CardTitle>
          <CardDescription>Filter by category, waiting time, name, slug, or search terms.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search module name, slug, or description"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={daysFilter} onValueChange={setDaysFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Days waiting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All waiting times</SelectItem>
              <SelectItem value="gt5">More than 5 days</SelectItem>
              <SelectItem value="lte5">5 days or less</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="name">Module name</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedModules.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/70">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {selectedModules.length} submission{selectedModules.length === 1 ? "" : "s"} selected
              </p>
              <p className="text-sm text-slate-600">
                Bulk approve, request changes, or reject the current selection from the queue.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setSelectedIds([])}>
                Clear selection
              </Button>
              <Button variant="outline" onClick={() => void handleDecision("requires_changes", selectedModules)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Request Changes
              </Button>
              <Button variant="outline" onClick={() => void handleDecision("rejected", selectedModules)}>
                <XCircle className="mr-2 h-4 w-4" />
                Bulk Reject
              </Button>
              <Button onClick={() => void handleDecision("approved", selectedModules)}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Bulk Approve
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Submissions</CardTitle>
          <CardDescription>Each row includes queue age, pricing context, and direct review actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {filteredModules.length > 0 ? (
            filteredModules.map((module) => {
              const waitDays = daysWaiting(module.submittedAt);
              const urgent = waitDays > 5;

              return (
                <div
                  key={module.moduleId}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(module.moduleId)}
                        onChange={() => toggleModule(module.moduleId)}
                        className="mt-1 h-4 w-4 rounded border-slate-300"
                      />
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 text-emerald-700">
                        <Package className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-950">{module.name}</h3>
                          <Badge variant="outline" className="capitalize">
                            {module.category.replace(/_/g, " ")}
                          </Badge>
                          <Badge variant="secondary">{module.status.replace(/_/g, " ")}</Badge>
                          {urgent && <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Over 5 days</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{module.description}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{module.slug}</span>
                          <span>Submitted {formatDate(module.submittedAt)}</span>
                          <span className={urgent ? "font-semibold text-red-700" : ""}>
                            {waitDays} day{waitDays === 1 ? "" : "s"} waiting
                          </span>
                          <span>v{module.version}</span>
                          <span>{module.pricing ? `Base ${module.pricing.baseRateKes} KES` : "Pricing not set"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <Button variant="outline" size="sm" onClick={() => router.push(`/platform/marketplace/${module.moduleId}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedModule(module);
                          setReviewNotes("");
                        }}
                      >
                        Review
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void handleDecision("rejected", [module])}>
                        Reject
                      </Button>
                      <Button size="sm" onClick={() => void handleDecision("approved", [module])}>
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-200/70 bg-emerald-50/40 text-center">
              <CheckCircle2 className="h-10 w-10 text-emerald-700" />
              <p className="mt-4 text-base font-semibold text-slate-900">No pending submissions</p>
              <p className="mt-1 max-w-sm text-sm text-slate-600">
                The review queue is clear right now. New draft marketplace modules will appear here automatically.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedModule)} onOpenChange={(open) => !open && setSelectedModule(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Submission</DialogTitle>
          </DialogHeader>
          {selectedModule && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-slate-950">{selectedModule.name}</h3>
                  <Badge variant="outline" className="capitalize">
                    {selectedModule.category.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="secondary">{selectedModule.status.replace(/_/g, " ")}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{selectedModule.description}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Slug</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">{selectedModule.slug}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Queue Age</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {daysWaiting(selectedModule.submittedAt)} day{daysWaiting(selectedModule.submittedAt) === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Version</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">v{selectedModule.version}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pricing</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {selectedModule.pricing ? `${selectedModule.pricing.baseRateKes} KES base` : "Not configured"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <Label htmlFor="reviewNotes">Reviewer Notes</Label>
                  <Textarea
                    id="reviewNotes"
                    rows={8}
                    placeholder="Capture reviewer findings, policy concerns, missing metadata, or requested changes."
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                    className="mt-2"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    Queue guidance
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li>Approve when the module is ready for publication.</li>
                    <li>Request changes when metadata, pricing, or docs need work.</li>
                    <li>Reject when the listing should not proceed to marketplace publication.</li>
                    <li>Draft modules older than 5 days should be reviewed first.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedModule(null)}>
                  Close
                </Button>
                <Button variant="outline" onClick={() => void handleDecision("rejected", [selectedModule])}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="outline" onClick={() => void handleDecision("requires_changes", [selectedModule])}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Request Changes
                </Button>
                <Button onClick={() => void handleDecision("approved", [selectedModule])}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Approve & Publish
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
