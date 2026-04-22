"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { CrmAdminRail } from "@/components/platform/CrmAdminRail";
import { PermissionGate } from "@/components/platform/PermissionGate";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import {
  ArrowRightLeft,
  Columns3,
  GripVertical,
  Hand,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type StageBucket = {
  stage: {
    slug: string;
    name: string;
    color: string;
    requiresNote: boolean;
    probabilityDefault: number;
    isWon: boolean;
    isLost: boolean;
  };
  totalValueKes: number;
  count: number;
  leads: Array<{
    _id: string;
    schoolName: string;
    contactName: string;
    dealValueKes?: number;
    updatedAt?: number;
  }>;
};

type PipelineView = {
  stages: StageBucket[];
};

type PendingMove = {
  leadId: string;
  leadName: string;
  fromStage: string;
  toStage: StageBucket["stage"];
};

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CRMPipelinePage() {
  const { sessionToken } = useAuth();
  const { can } = usePlatformPermissions();
  const pipeline = usePlatformQuery(
    api.modules.platform.crm.getPipelineView,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PipelineView | undefined;

  const changeLeadStage = useMutation(api.modules.platform.crm.changeLeadStage);

  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [activeStageSlug, setActiveStageSlug] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [transitionNote, setTransitionNote] = useState("");
  const [busy, setBusy] = useState(false);

  const stages = useMemo(() => pipeline?.stages ?? [], [pipeline]);
  const totalPipelineValue = useMemo(
    () => stages.reduce((sum, bucket) => sum + bucket.totalValueKes, 0),
    [stages]
  );
  const totalLeads = useMemo(
    () => stages.reduce((sum, bucket) => sum + bucket.count, 0),
    [stages]
  );
  const movable = can("crm.edit_own_lead") || can("crm.edit_any_lead");

  if (!sessionToken || pipeline === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const findLead = (leadId: string) => {
    for (const bucket of stages) {
      const lead = bucket.leads.find((item) => item._id === leadId);
      if (lead) {
        return { lead, stage: bucket.stage };
      }
    }
    return null;
  };

  const resetDnD = () => {
    setDraggedLeadId(null);
    setActiveStageSlug(null);
  };

  const applyStageChange = async (move: PendingMove, note?: string) => {
    if (!sessionToken) return;
    setBusy(true);
    try {
      await changeLeadStage({
        sessionToken,
        leadId: move.leadId as never,
        newStage: move.toStage.slug,
        note: note?.trim() ? note.trim() : undefined,
      });
      toast.success(`${move.leadName} moved to ${move.toStage.name}.`);
      setPendingMove(null);
      setTransitionNote("");
      resetDnD();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to move lead.");
    } finally {
      setBusy(false);
    }
  };

  const handleDrop = async (targetStage: StageBucket["stage"]) => {
    if (!draggedLeadId || !movable) return;
    const located = findLead(draggedLeadId);
    if (!located || located.stage.slug === targetStage.slug) {
      resetDnD();
      return;
    }

    if (targetStage.requiresNote) {
      setPendingMove({
        leadId: located.lead._id,
        leadName: located.lead.schoolName,
        fromStage: located.stage.name,
        toStage: targetStage,
      });
      setTransitionNote("");
      return;
    }

    await applyStageChange(
      {
        leadId: located.lead._id,
        leadName: located.lead.schoolName,
        fromStage: located.stage.name,
        toStage: targetStage,
      },
      undefined
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Work the CRM as a live kanban board. Drag leads between stages, capture notes when required, and keep commercial momentum visible."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Pipeline" },
        ]}
      />
      <CrmAdminRail currentHref="/platform/crm/pipeline" />

      {stages.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Columns3}
              title="No pipeline stages available"
              description="CRM pipeline stages need to be seeded or re-enabled before leads can be visualized here."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_32%),linear-gradient(180deg,rgba(240,253,250,0.82),rgba(255,255,255,0.98))]">
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-0 bg-emerald-600/10 text-emerald-700">Drag & drop board</Badge>
                  <Badge variant="outline" className="border-slate-300 bg-white/80">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Live Convex pipeline
                  </Badge>
                </div>
                <div className="space-y-2">
                  <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                    Move schools through the funnel with less friction and more commercial clarity.
                  </h2>
                  <p className="max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                    The board is now a real operator surface: drag a lead to the next stage, and if that
                    stage requires a note, the system stops for the context before it commits the move.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <PipelineStat label="Accessible leads" value={String(totalLeads)} />
                <PipelineStat label="Pipeline value" value={formatKes(totalPipelineValue)} />
                <PipelineStat label="Move posture" value={movable ? "Interactive" : "View only"} />
              </div>
            </CardContent>
          </Card>

          <PermissionGate
            permission="crm.edit_own_lead"
            showDisabled
            disabledTooltip="You can view the pipeline, but moving leads requires CRM edit access."
          >
            <div className="flex items-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-muted-foreground">
              <Hand className="h-4 w-4" />
              Drag a lead card onto another column to change its stage. Stages marked note-required will ask for context first.
            </div>
          </PermissionGate>

          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {stages.map((bucket) => {
                const isActiveDrop = activeStageSlug === bucket.stage.slug;
                const isToneWon = bucket.stage.isWon;
                const isToneLost = bucket.stage.isLost;

                return (
                  <div
                    key={bucket.stage.slug}
                    className={`w-[320px] shrink-0 rounded-[28px] border bg-white shadow-sm transition ${
                      isActiveDrop ? "border-emerald-400 bg-emerald-50/50 shadow-emerald-100" : "border-slate-200"
                    }`}
                    onDragOver={(event) => {
                      if (!movable) return;
                      event.preventDefault();
                      setActiveStageSlug(bucket.stage.slug);
                    }}
                    onDragLeave={() => {
                      if (activeStageSlug === bucket.stage.slug) {
                        setActiveStageSlug(null);
                      }
                    }}
                    onDrop={async (event) => {
                      if (!movable) return;
                      event.preventDefault();
                      await handleDrop(bucket.stage);
                    }}
                  >
                    <div
                      className="rounded-t-[28px] border-b px-5 py-4"
                      style={{
                        background: isToneWon
                          ? "linear-gradient(135deg, rgba(22,163,74,0.12), rgba(255,255,255,0.95))"
                          : isToneLost
                            ? "linear-gradient(135deg, rgba(244,63,94,0.12), rgba(255,255,255,0.95))"
                            : `linear-gradient(135deg, ${bucket.stage.color}18, rgba(255,255,255,0.96))`,
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-2">
                          <Badge
                            variant="outline"
                            className="border-transparent px-3 py-1 text-xs font-semibold"
                            style={{ backgroundColor: `${bucket.stage.color}16`, color: bucket.stage.color }}
                          >
                            {bucket.stage.name}
                          </Badge>
                          <div>
                            <p className="text-xl font-semibold text-slate-950">{formatKes(bucket.totalValueKes)}</p>
                            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                              {bucket.count} lead{bucket.count === 1 ? "" : "s"} · {bucket.stage.probabilityDefault}% close
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          {bucket.stage.requiresNote ? <p>Note required</p> : <p>Free move</p>}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      {bucket.leads.length === 0 ? (
                        <div
                          className={`rounded-2xl border border-dashed p-4 text-sm ${
                            isActiveDrop ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 text-muted-foreground"
                          }`}
                        >
                          {isActiveDrop ? "Release to move the dragged lead here." : "No leads in this stage yet."}
                        </div>
                      ) : (
                        bucket.leads.map((lead) => {
                          const dragging = draggedLeadId === lead._id;
                          return (
                            <div
                              key={lead._id}
                              draggable={movable}
                              onDragStart={() => setDraggedLeadId(lead._id)}
                              onDragEnd={resetDnD}
                              className={`group rounded-2xl border bg-white p-4 transition ${
                                dragging
                                  ? "cursor-grabbing border-emerald-400 opacity-65 shadow-lg"
                                  : movable
                                    ? "cursor-grab hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40"
                                    : "cursor-default"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <Link href={`/platform/crm/${lead._id}`} className="line-clamp-2 font-medium text-slate-950 hover:text-emerald-700">
                                    {lead.schoolName}
                                  </Link>
                                  <p className="mt-1 text-sm text-muted-foreground">{lead.contactName}</p>
                                </div>
                                {movable ? (
                                  <div className="rounded-full border border-slate-200 bg-slate-50 p-1.5 text-slate-400 transition group-hover:border-emerald-200 group-hover:text-emerald-600">
                                    <GripVertical className="h-4 w-4" />
                                  </div>
                                ) : null}
                              </div>
                              <div className="mt-4 flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-900">{formatKes(lead.dealValueKes ?? 0)}</p>
                                <Badge variant="secondary" className="border-0 bg-slate-100 text-slate-700">
                                  {bucket.stage.name}
                                </Badge>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Dialog open={Boolean(pendingMove)} onOpenChange={(open) => !open && !busy && setPendingMove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transition note required</DialogTitle>
            <DialogDescription>
              {pendingMove
                ? `${pendingMove.toStage.name} requires a note before ${pendingMove.leadName} can move from ${pendingMove.fromStage}.`
                : "This stage requires a transition note."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
              Capture the reason for the move, the decision made, or the signal that changed so the next teammate has full context.
            </div>
            <Textarea
              rows={5}
              value={transitionNote}
              onChange={(event) => setTransitionNote(event.target.value)}
              placeholder="Example: Procurement approved the budget envelope, and the principal requested a final pricing walkthrough for Friday."
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setPendingMove(null);
                setTransitionNote("");
                resetDnD();
              }}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button
              className="gap-2"
              onClick={() => pendingMove && applyStageChange(pendingMove, transitionNote)}
              disabled={busy || !transitionNote.trim()}
            >
              <ArrowRightLeft className="h-4 w-4" />
              Save note and move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PipelineStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}
