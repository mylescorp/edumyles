"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { toast } from "@/components/ui/use-toast";
import { Star, TrendingUp, TrendingDown, Minus, Award, Users, ClipboardCheck } from "lucide-react";

type StaffRow = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role: string;
  status: string;
};

type ReviewRow = {
  staffId: string;
  period: string;
  overallScore: number;
  scores: Record<string, number>;
};

type ScoreFields = {
  attendance: number;
  punctuality: number;
  teaching: number;
  teamwork: number;
  professionalism: number;
};

const CURRENT_YEAR = new Date().getFullYear();
const PERIODS = [
  `Q1 ${CURRENT_YEAR}`,
  `Q2 ${CURRENT_YEAR}`,
  `Q3 ${CURRENT_YEAR}`,
  `Q4 ${CURRENT_YEAR}`,
  `Annual ${CURRENT_YEAR}`,
];

function ScoreInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-sm">{label}</Label>
        <span className="text-sm font-mono font-medium text-primary">{value}/100</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const variant = score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive";
  return <Badge variant={variant}>{score}/100</Badge>;
}

export default function HRPerformancePage() {
  const { isLoading, sessionToken } = useAuth();
  const [reviewStaff, setReviewStaff] = useState<StaffRow | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0]);
  const [scores, setScores] = useState<ScoreFields>({ attendance: 80, punctuality: 80, teaching: 80, teamwork: 80, professionalism: 80 });
  const [comments, setComments] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState(PERIODS[0]);

  const staff = useQuery(
    api.modules.hr.queries.listStaff,
    sessionToken ? { sessionToken } : "skip"
  ) as StaffRow[] | undefined;

  const reviews = useQuery(
    api.modules.hr.queries.listPerformanceReviews,
    sessionToken ? { sessionToken, period: filterPeriod } : "skip"
  ) as ReviewRow[] | undefined;

  const saveReview = useMutation(api.modules.hr.mutations.savePerformanceReview);

  if (isLoading || staff === undefined) return <LoadingSkeleton variant="page" />;

  // Build a map of staffId → latest review
  const reviewMap = new Map<string, ReviewRow>();
  (reviews ?? []).forEach((r) => reviewMap.set(r.staffId, r));

  const avgScore = reviews && reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
    : null;

  const openReviewModal = (row: StaffRow) => {
    const existing = reviewMap.get(row._id);
    setScores(existing?.scores as ScoreFields ?? { attendance: 80, punctuality: 80, teaching: 80, teamwork: 80, professionalism: 80 });
    setComments("");
    setGoals("");
    setReviewStaff(row);
  };

  const handleSave = async () => {
    if (!reviewStaff || !sessionToken) return;
    setSaving(true);
    try {
      await saveReview({
        sessionToken,
        staffId: reviewStaff._id,
        period: selectedPeriod,
        scores,
        comments: comments || undefined,
        goals: goals || undefined,
      });
      toast({ title: "Review saved", description: `Performance review for ${reviewStaff.firstName} saved.` });
      setReviewStaff(null);
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<StaffRow>[] = [
    {
      key: "name",
      header: "Staff member",
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium">{row.firstName} {row.lastName}</p>
          <p className="text-sm text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: "department", header: "Department", cell: (row) => row.department || "Unassigned" },
    { key: "role", header: "Role", cell: (row) => <span className="capitalize">{row.role.replace("_", " ")}</span> },
    {
      key: "status",
      header: "Status",
      cell: (row) => <Badge variant={row.status === "active" ? "default" : "secondary"}>{row.status}</Badge>,
    },
    {
      key: "score",
      header: "Score",
      cell: (row) => {
        const rev = reviewMap.get(row._id);
        return rev ? <ScoreBadge score={rev.overallScore} /> : <span className="text-sm text-muted-foreground">No review</span>;
      },
    },
    {
      key: "actions",
      header: "",
      cell: (row) => (
        <Button size="sm" variant="outline" onClick={() => openReviewModal(row)}>
          {reviewMap.has(row._id) ? "Update Review" : "Record Review"}
        </Button>
      ),
    },
  ];

  const totalReviewed = (reviews ?? []).length;
  const pending = staff.filter((s) => s.status === "active" && !reviewMap.has(s._id)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance Reviews"
        description={`Track and record staff performance for ${filterPeriod}`}
      />

      {/* Period picker */}
      <div className="flex items-center gap-3 print:hidden">
        <Label className="shrink-0 text-sm font-medium">Period:</Label>
        <div className="flex gap-2 flex-wrap">
          {PERIODS.map((p) => (
            <Button
              key={p}
              variant={filterPeriod === p ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPeriod(p)}
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgScore ?? "—"}</p>
              <p className="text-sm text-muted-foreground">Avg score</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
              <ClipboardCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalReviewed}</p>
              <p className="text-sm text-muted-foreground">Reviews completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-3">
              <Users className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pending}</p>
              <p className="text-sm text-muted-foreground">Pending reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        data={staff}
        columns={columns}
        searchable
        searchPlaceholder="Search staff..."
        searchKey={(row) => `${row.firstName} ${row.lastName} ${row.email} ${row.department ?? ""} ${row.role}`}
        emptyTitle="No staff found"
        emptyDescription="Staff members will appear here once HR records are available."
      />

      {/* Review Modal */}
      <Dialog open={!!reviewStaff} onOpenChange={(open) => !open && setReviewStaff(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Performance Review — {reviewStaff?.firstName} {reviewStaff?.lastName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Period */}
            <div className="space-y-1">
              <Label>Review Period</Label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Scores */}
            <div className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-semibold">KPI Scores (0 – 100)</p>
              <ScoreInput label="Attendance & Punctuality" value={scores.attendance} onChange={(v) => setScores((s) => ({ ...s, attendance: v }))} />
              <ScoreInput label="Time-keeping" value={scores.punctuality} onChange={(v) => setScores((s) => ({ ...s, punctuality: v }))} />
              <ScoreInput label="Teaching / Role Performance" value={scores.teaching} onChange={(v) => setScores((s) => ({ ...s, teaching: v }))} />
              <ScoreInput label="Teamwork & Collaboration" value={scores.teamwork} onChange={(v) => setScores((s) => ({ ...s, teamwork: v }))} />
              <ScoreInput label="Professionalism" value={scores.professionalism} onChange={(v) => setScores((s) => ({ ...s, professionalism: v }))} />
              <div className="mt-2 flex items-center justify-between rounded-md bg-muted px-3 py-2">
                <span className="text-sm font-medium">Overall Score</span>
                <span className="font-bold text-primary">
                  {Math.round((scores.attendance + scores.punctuality + scores.teaching + scores.teamwork + scores.professionalism) / 5)}/100
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Comments (optional)</Label>
              <Textarea placeholder="Observations and feedback..." value={comments} onChange={(e) => setComments(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Goals for next period (optional)</Label>
              <Textarea placeholder="Targets and improvement areas..." value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewStaff(null)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Review"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
