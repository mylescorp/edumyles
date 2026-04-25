"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { CheckCircle2, FileText, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";

function formatKes(value?: number | null) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function ProposalTrackingPage() {
  const params = useParams();
  const trackingToken = params.trackingToken as string;
  const [viewTracked, setViewTracked] = useState(false);
  const [decision, setDecision] = useState<"idle" | "accepted" | "rejected">("idle");
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState<"accept" | "reject" | null>(null);

  const proposal = useQuery(
    api.modules.platform.crm.getPublicProposalByTrackingToken,
    trackingToken ? { trackingToken } : "skip"
  );

  const trackView = useMutation(api.modules.platform.crm.trackProposalView);
  const acceptProposal = useMutation(api.modules.platform.crm.acceptProposal);
  const rejectProposal = useMutation(api.modules.platform.crm.rejectProposal);

  useEffect(() => {
    if (!trackingToken || !proposal || viewTracked) return;
    setViewTracked(true);
    void trackView({
      trackingToken,
      viewerIp: undefined,
    }).catch(() => undefined);
  }, [proposal, trackView, trackingToken, viewTracked]);

  const pricingRows = useMemo(
    () => [
      { label: "Recommended plan", value: proposal?.recommendedPlan ?? "Custom plan" },
      { label: "Billing period", value: proposal?.billingPeriod ?? "Annual" },
      { label: "Students", value: String(proposal?.studentCount ?? proposal?.lead?.studentCount ?? "—") },
      { label: "Monthly total", value: formatKes(proposal?.totalMonthlyKes) },
      { label: "Annual total", value: formatKes(proposal?.totalAnnualKes) },
    ],
    [proposal]
  );

  const handleAccept = async () => {
    setPendingAction("accept");
    try {
      await acceptProposal({ trackingToken });
      setDecision("accepted");
      toast.success("Proposal accepted successfully.");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to accept proposal.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleReject = async () => {
    setPendingAction("reject");
    try {
      await rejectProposal({ trackingToken, reason: reason.trim() || undefined });
      setDecision("rejected");
      toast.success("Proposal response recorded.");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to reject proposal.");
    } finally {
      setPendingAction(null);
    }
  };

  if (proposal === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.12),_transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eefbf4_100%)] px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={FileText}
                title="Proposal not found"
                description="This proposal link is invalid, expired, or no longer available."
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.16),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#edf7f1_100%)] px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-emerald-100 bg-white/95 shadow-xl shadow-emerald-950/5">
            <CardContent className="space-y-6 p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">EduMyles Proposal</Badge>
                <Badge variant="outline" className="capitalize">{proposal.status}</Badge>
              </div>

              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
                  Proposal for {proposal.lead?.schoolName ?? "your institution"}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600">
                  This proposal outlines the recommended EduMyles rollout, pricing posture, and delivery fit for your team.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-emerald-700">Primary Contact</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">{proposal.lead?.contactName ?? "School contact"}</p>
                  <p className="mt-1 text-sm text-slate-600">{proposal.lead?.email ?? "No email captured"}</p>
                  <p className="text-sm text-slate-500">{proposal.lead?.phone ?? "No phone captured"}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Institution Snapshot</p>
                  <p className="mt-3 text-lg font-semibold text-slate-950">
                    {proposal.lead?.studentCount ?? proposal.studentCount ?? "—"} students
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {proposal.lead?.county ?? "County pending"}, {proposal.lead?.country ?? "KE"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Proposal Scope</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {pricingRows.map((row) => (
                <div key={row.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{row.label}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-950">{row.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {(proposal.customNotes || proposal.description) && (
            <Card>
              <CardHeader>
                <CardTitle>Implementation Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposal.description ? (
                  <p className="text-sm leading-7 text-slate-600">{proposal.description}</p>
                ) : null}
                {proposal.customNotes ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-600">
                    {proposal.customNotes}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-8">
          <Card className="border-slate-200 shadow-lg shadow-slate-900/5">
            <CardHeader>
              <CardTitle>Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-sm font-medium">Secure review link</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Your review is tracked so the EduMyles team can follow up with the right implementation next step.
                </p>
              </div>

              {decision === "accepted" || proposal.status === "accepted" ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Proposal accepted
                  </div>
                  <p className="mt-2">The EduMyles team has been notified and will continue onboarding from here.</p>
                </div>
              ) : decision === "rejected" || proposal.status === "rejected" ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  <div className="flex items-center gap-2 font-medium">
                    <XCircle className="h-4 w-4" />
                    Proposal declined
                  </div>
                  <p className="mt-2">Your response has been recorded. The team can revisit the proposal with adjustments if needed.</p>
                </div>
              ) : (
                <>
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleAccept} disabled={pendingAction !== null}>
                    {pendingAction === "accept" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Accept Proposal
                  </Button>
                  <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                    <p className="text-sm font-medium text-slate-900">Need changes before proceeding?</p>
                    <Textarea
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={5}
                      placeholder="Tell the EduMyles team what needs to change before approval."
                    />
                    <Button variant="outline" className="w-full" onClick={handleReject} disabled={pendingAction !== null}>
                      {pendingAction === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Decline / Request Revision
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
