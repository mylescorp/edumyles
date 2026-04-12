"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { SearchInput } from "@/components/shared/SearchInput";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Package, Plus, Send, Trash2 } from "lucide-react";

type ModuleRecord = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status:
    | "draft"
    | "pending_review"
    | "changes_requested"
    | "published"
    | "deprecated"
    | "suspended"
    | "banned";
  installs: number;
  activeInstalls: number;
  revenueKes: number;
  averageRating: number;
  reviewCount: number;
  updatedAt: number;
};

type ModulesResult = {
  modules: ModuleRecord[];
  total: number;
};

const blankModule = {
  moduleId: "",
  name: "",
  description: "",
  category: "academic_tools",
  supportEmail: "",
  price: "0",
  pricingType: "free" as "free" | "paid" | "freemium",
  billingCycle: "monthly" as "monthly" | "quarterly" | "annual",
  features: "",
  requirements: "",
  documentation: "",
};

function money(value: number) {
  return `KES ${value.toLocaleString()}`;
}

export default function DeveloperModulesPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [openCreate, setOpenCreate] = useState(false);
  const [draft, setDraft] = useState(blankModule);

  const data = useQuery(api.modules.publisher.mutations.modules.getMyModules, {}) as
    | ModulesResult
    | undefined;
  const createModule = useMutation(api.modules.publisher.mutations.modules.createModule);
  const submitForReview = useMutation(api.modules.publisher.mutations.modules.submitForReview);
  const deleteModule = useMutation(api.modules.publisher.mutations.modules.deleteModule);

  const filteredModules = useMemo(
    () =>
      (data?.modules ?? []).filter((module) => {
        const matchesSearch = [module.name, module.description, module.category]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchesStatus = status === "all" || module.status === status;
        return matchesSearch && matchesStatus;
      }),
    [data, search, status]
  );

  if (!data) return <LoadingSkeleton variant="page" />;

  async function handleCreate() {
    await createModule({
      moduleId: draft.moduleId,
      name: draft.name,
      description: draft.description,
      category: draft.category,
      pricing: {
        type: draft.pricingType,
        amount: Number(draft.price) || 0,
        currency: "KES",
        billingCycle: draft.billingCycle,
      },
      features: draft.features.split(",").map((item) => item.trim()).filter(Boolean),
      requirements: draft.requirements.split(",").map((item) => item.trim()).filter(Boolean),
      documentation: draft.documentation || undefined,
      supportEmail: draft.supportEmail,
    });
    setDraft(blankModule);
    setOpenCreate(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Modules"
        description="Live module catalog for your developer account, including install, revenue, and review metrics."
        actions={
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Module
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-semibold">{data.total}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Published</p><p className="text-2xl font-semibold">{data.modules.filter((module) => module.status === "published").length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Installs</p><p className="text-2xl font-semibold">{data.modules.reduce((sum, module) => sum + module.installs, 0)}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Revenue</p><p className="text-2xl font-semibold">{money(data.modules.reduce((sum, module) => sum + module.revenueKes, 0))}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Modules</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search modules..."
            className="max-w-xl"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="pending_review">Pending review</option>
            <option value="changes_requested">Changes requested</option>
            <option value="published">Published</option>
            <option value="suspended">Suspended</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Module Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredModules.length === 0 ? (
            <EmptyState
              icon={Package}
              title="No modules found"
              description="Create a module or widen the current filters."
            />
          ) : (
            <div className="space-y-3">
              {filteredModules.map((module) => (
                <div key={module._id} className="rounded-md border p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{module.name}</p>
                        <Badge variant="outline">{module.status.replaceAll("_", " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {module.category} · Updated {new Date(module.updatedAt).toLocaleString()}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>{module.installs} installs</span>
                        <span>{module.activeInstalls} active</span>
                        <span>{money(module.revenueKes)}</span>
                        <span>
                          {module.averageRating > 0
                            ? `${module.averageRating.toFixed(1)} rating`
                            : "No ratings"}
                        </span>
                        <span>{module.reviewCount} reviews</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {module.status === "draft" ? (
                        <Button
                          variant="outline"
                          onClick={() => submitForReview({ moduleId: module.slug })}
                        >
                          <Send className="mr-2 h-4 w-4" />
                          Submit For Review
                        </Button>
                      ) : null}
                      <Button
                        variant="destructive"
                        onClick={() => deleteModule({ moduleId: module.slug })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Module</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Module ID / slug"
                value={draft.moduleId}
                onChange={(e) => setDraft((current) => ({ ...current, moduleId: e.target.value }))}
              />
              <Input
                placeholder="Module name"
                value={draft.name}
                onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
              />
            </div>
            <Textarea
              rows={4}
              placeholder="Describe the module"
              value={draft.description}
              onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                placeholder="Category"
                value={draft.category}
                onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))}
              />
              <Input
                placeholder="Support email"
                value={draft.supportEmail}
                onChange={(e) =>
                  setDraft((current) => ({ ...current, supportEmail: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <select
                value={draft.pricingType}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    pricingType: e.target.value as "free" | "paid" | "freemium",
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
                <option value="freemium">Freemium</option>
              </select>
              <Input
                placeholder="Price in KES"
                value={draft.price}
                onChange={(e) => setDraft((current) => ({ ...current, price: e.target.value }))}
              />
              <select
                value={draft.billingCycle}
                onChange={(e) =>
                  setDraft((current) => ({
                    ...current,
                    billingCycle: e.target.value as "monthly" | "quarterly" | "annual",
                  }))
                }
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            <Textarea
              rows={3}
              placeholder="Features, comma separated"
              value={draft.features}
              onChange={(e) => setDraft((current) => ({ ...current, features: e.target.value }))}
            />
            <Textarea
              rows={3}
              placeholder="Supported roles / requirements, comma separated"
              value={draft.requirements}
              onChange={(e) =>
                setDraft((current) => ({ ...current, requirements: e.target.value }))
              }
            />
            <Input
              placeholder="Documentation URL"
              value={draft.documentation}
              onChange={(e) =>
                setDraft((current) => ({ ...current, documentation: e.target.value }))
              }
            />
            <Button
              onClick={handleCreate}
              disabled={!draft.moduleId || !draft.name || !draft.description || !draft.supportEmail}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Module
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
