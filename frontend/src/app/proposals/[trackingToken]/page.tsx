"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

function formatKes(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PublicProposalPage() {
  const params = useParams();
  const trackingToken = String(params.trackingToken);
  const trackProposalView = useMutation(api.modules.platform.crm.trackProposalView);
  const acceptProposal = useMutation(api.modules.platform.crm.acceptProposal);
  const rejectProposal = useMutation(api.modules.platform.crm.rejectProposal);
  const [status, setStatus] = useState<"idle" | "accepted" | "rejected">("idle");

  useEffect(() => {
    void trackProposalView({ trackingToken });
  }, [trackProposalView, trackingToken]);

  const handleAccept = async () => {
    try {
      await acceptProposal({ trackingToken });
      setStatus("accepted");
      toast.success("Proposal accepted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept proposal.");
    }
  };

  const handleReject = async () => {
    try {
      await rejectProposal({ trackingToken });
      setStatus("rejected");
      toast.success("Proposal declined.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to decline proposal.");
    }
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_45%),linear-gradient(180deg,#f8fffc_0%,#ffffff_55%,#f5f7fb_100%)] px-4 py-16">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-3 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-700">EduMyles Proposal</p>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950">Review your school proposal</h1>
          <p className="mx-auto max-w-2xl text-slate-600">
            This secure link records proposal views and lets your school confirm whether to proceed with onboarding.
          </p>
        </div>

        <Card className="border-emerald-100 shadow-[0_30px_80px_-40px_rgba(15,118,110,0.35)]">
          <CardHeader>
            <CardTitle>What this proposal covers</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Info label="Platform" value="EduMyles school operations suite" />
            <Info label="Commercial posture" value="Tracked from the live CRM workspace" />
            <Info label="Response token" value={trackingToken.slice(0, 8).toUpperCase()} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next step</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              If the proposal aligns with your school’s rollout needs, accept it here and the EduMyles platform team will continue onboarding from the CRM handoff.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="gap-2" onClick={handleAccept} disabled={status === "accepted"}>
                <CheckCircle2 className="h-4 w-4" />
                {status === "accepted" ? "Accepted" : "Accept proposal"}
              </Button>
              <Button variant="outline" className="gap-2" onClick={handleReject} disabled={status === "rejected"}>
                <XCircle className="h-4 w-4" />
                {status === "rejected" ? "Declined" : "Decline proposal"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 font-medium text-slate-900">{value}</p>
    </div>
  );
}
