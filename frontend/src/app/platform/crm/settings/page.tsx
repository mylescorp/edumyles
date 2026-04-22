"use client";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { ChevronDown, ChevronUp, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";

type Stage = {
  _id: string;
  slug: string;
  name: string;
  color: string;
  icon: string;
  requiresNote: boolean;
  probabilityDefault: number;
  autoFollowUpDays?: number;
  isWon: boolean;
  isLost: boolean;
  isActive?: boolean;
};

type PipelineView = {
  stages: Array<{
    stage: Stage;
  }>;
};

export default function CRMSettingsPage() {
  const { sessionToken } = useAuth();
  const [busyStage, setBusyStage] = useState<string | null>(null);
  const [draftStage, setDraftStage] = useState({
    name: "",
    slug: "",
    color: "#0f766e",
    icon: "CircleDot",
    probabilityDefault: "10",
    autoFollowUpDays: "",
    requiresNote: false,
    isWon: false,
    isLost: false,
  });

  const pipeline = usePlatformQuery(
    api.modules.platform.crm.getPipelineView,
    sessionToken ? { sessionToken } : "skip",
    !!sessionToken
  ) as PipelineView | undefined;

  const createPipelineStage = useMutation(api.modules.platform.crm.createPipelineStage);
  const updatePipelineStage = useMutation(api.modules.platform.crm.updatePipelineStage);
  const reorderPipelineStages = useMutation(api.modules.platform.crm.reorderPipelineStages);

  const stages = useMemo(() => pipeline?.stages.map((entry) => entry.stage) ?? [], [pipeline]);

  if (!sessionToken || pipeline === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  const runStageAction = async (key: string, callback: () => Promise<void>) => {
    setBusyStage(key);
    try {
      await callback();
    } finally {
      setBusyStage(null);
    }
  };

  const updateStage = async (stageId: string, patch: Partial<Stage>) => {
    if (!sessionToken) return;
    await runStageAction(stageId, async () => {
      try {
        await updatePipelineStage({
          sessionToken,
          stageId: stageId as never,
          name: patch.name,
          color: patch.color,
          icon: patch.icon,
          probabilityDefault: patch.probabilityDefault,
          requiresNote: patch.requiresNote,
          autoFollowUpDays: patch.autoFollowUpDays,
          isWon: patch.isWon,
          isLost: patch.isLost,
          isActive: patch.isActive,
        });
        toast.success("Stage updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to update stage.");
      }
    });
  };

  const moveStage = async (index: number, direction: -1 | 1) => {
    if (!sessionToken) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stages.length) return;
    const reordered = [...stages];
    const [moved] = reordered.splice(index, 1);
    if (!moved) return;
    reordered.splice(nextIndex, 0, moved);
    await runStageAction(`reorder-${moved._id}`, async () => {
      try {
        await reorderPipelineStages({
          sessionToken,
          stageIds: reordered.map((stage) => stage._id as never),
        });
        toast.success("Pipeline order updated.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to reorder stages.");
      }
    });
  };

  const createStage = async () => {
    if (!sessionToken || !draftStage.name.trim() || !draftStage.slug.trim()) return;
    await runStageAction("create", async () => {
      try {
        await createPipelineStage({
          sessionToken,
          name: draftStage.name.trim(),
          slug: draftStage.slug.trim(),
          color: draftStage.color,
          icon: draftStage.icon,
          probabilityDefault: Number(draftStage.probabilityDefault),
          autoFollowUpDays: draftStage.autoFollowUpDays ? Number(draftStage.autoFollowUpDays) : undefined,
          requiresNote: draftStage.requiresNote,
          isWon: draftStage.isWon,
          isLost: draftStage.isLost,
        });
        setDraftStage({
          name: "",
          slug: "",
          color: "#0f766e",
          icon: "CircleDot",
          probabilityDefault: "10",
          autoFollowUpDays: "",
          requiresNote: false,
          isWon: false,
          isLost: false,
        });
        toast.success("Stage created.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to create stage.");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Settings"
        description="Tune live pipeline stages, note enforcement, probability posture, and follow-up defaults without leaving the CRM surface."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "CRM", href: "/platform/crm" },
          { label: "Settings" },
        ]}
      />

      <CrmAdminRail currentHref="/platform/crm/settings" />

      <PermissionGate
        permission="crm.manage_pipeline"
        fallback={
          <Card>
            <CardContent className="pt-6">
              <EmptyState
                icon={Settings2}
                title="Pipeline settings are view-restricted"
                description="You can review the current configuration, but editing requires the CRM pipeline permission."
              />
            </CardContent>
          </Card>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            {stages.map((stage, index) => (
              <Card key={stage._id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{stage.name}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{stage.slug}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => moveStage(index, -1)} disabled={index === 0 || busyStage?.startsWith("reorder-")}>
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => moveStage(index, 1)} disabled={index === stages.length - 1 || busyStage?.startsWith("reorder-")}>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <EditableField label="Name" value={stage.name} onSave={(value) => updateStage(stage._id, { name: value })} />
                  <EditableField label="Color" value={stage.color} onSave={(value) => updateStage(stage._id, { color: value })} />
                  <EditableField label="Icon" value={stage.icon} onSave={(value) => updateStage(stage._id, { icon: value })} />
                  <EditableField
                    label="Probability %"
                    value={String(stage.probabilityDefault)}
                    type="number"
                    onSave={(value) => updateStage(stage._id, { probabilityDefault: Number(value) })}
                  />
                  <EditableField
                    label="Auto follow-up days"
                    value={stage.autoFollowUpDays ? String(stage.autoFollowUpDays) : ""}
                    type="number"
                    onSave={(value) => updateStage(stage._id, { autoFollowUpDays: value ? Number(value) : undefined })}
                  />
                  <div className="rounded-xl border p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">State</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">{stage.requiresNote ? "Note required" : "Free move"}</Badge>
                      <Badge variant="outline">{stage.isWon ? "Won stage" : "Open stage"}</Badge>
                      <Badge variant="outline">{stage.isLost ? "Lost stage" : "Recoverable"}</Badge>
                      <Badge variant="outline">{stage.isActive === false ? "Inactive" : "Active"}</Badge>
                    </div>
                    <div className="mt-4 space-y-3">
                      <ToggleRow label="Require note" checked={stage.requiresNote} onChange={(checked) => updateStage(stage._id, { requiresNote: checked })} />
                      <ToggleRow label="Mark as won" checked={stage.isWon} onChange={(checked) => updateStage(stage._id, { isWon: checked, isLost: checked ? false : stage.isLost })} />
                      <ToggleRow label="Mark as lost" checked={stage.isLost} onChange={(checked) => updateStage(stage._id, { isLost: checked, isWon: checked ? false : stage.isWon })} />
                      <ToggleRow label="Active in pipeline" checked={stage.isActive !== false} onChange={(checked) => updateStage(stage._id, { isActive: checked })} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Create pipeline stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Stage name">
                <Input value={draftStage.name} onChange={(event) => setDraftStage((current) => ({ ...current, name: event.target.value }))} placeholder="Procurement review" />
              </Field>
              <Field label="Slug">
                <Input value={draftStage.slug} onChange={(event) => setDraftStage((current) => ({ ...current, slug: event.target.value.toLowerCase().replace(/\s+/g, "_") }))} placeholder="procurement_review" />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Color">
                  <Input value={draftStage.color} onChange={(event) => setDraftStage((current) => ({ ...current, color: event.target.value }))} />
                </Field>
                <Field label="Icon">
                  <Input value={draftStage.icon} onChange={(event) => setDraftStage((current) => ({ ...current, icon: event.target.value }))} />
                </Field>
                <Field label="Probability %">
                  <Input type="number" value={draftStage.probabilityDefault} onChange={(event) => setDraftStage((current) => ({ ...current, probabilityDefault: event.target.value }))} />
                </Field>
                <Field label="Auto follow-up days">
                  <Input type="number" value={draftStage.autoFollowUpDays} onChange={(event) => setDraftStage((current) => ({ ...current, autoFollowUpDays: event.target.value }))} />
                </Field>
              </div>
              <ToggleRow compact label="Require note on entry" checked={draftStage.requiresNote} onChange={(checked) => setDraftStage((current) => ({ ...current, requiresNote: checked }))} />
              <ToggleRow compact label="Terminal won stage" checked={draftStage.isWon} onChange={(checked) => setDraftStage((current) => ({ ...current, isWon: checked, isLost: checked ? false : current.isLost }))} />
              <ToggleRow compact label="Terminal lost stage" checked={draftStage.isLost} onChange={(checked) => setDraftStage((current) => ({ ...current, isLost: checked, isWon: checked ? false : current.isWon }))} />
              <Button className="w-full gap-2" onClick={createStage} disabled={busyStage === "create"}>
                <Plus className="h-4 w-4" />
                Create stage
              </Button>
            </CardContent>
          </Card>
        </div>
      </PermissionGate>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function EditableField({
  label,
  value,
  onSave,
  type = "text",
}: {
  label: string;
  value: string;
  onSave: (value: string) => void;
  type?: string;
}) {
  const [draft, setDraft] = useState(value);

  return (
    <div className="rounded-xl border p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <div className="mt-3 flex gap-2">
        <Input type={type} value={draft} onChange={(event) => setDraft(event.target.value)} />
        <Button variant="outline" onClick={() => onSave(draft)}>
          Save
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  compact = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border ${compact ? "px-4 py-3" : "px-3 py-2"}`}>
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
