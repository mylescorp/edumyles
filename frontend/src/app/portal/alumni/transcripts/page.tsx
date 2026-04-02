"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileText, Send, Clock, CheckCircle, XCircle, Download } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/formatters";

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  pending:    { label: "Pending",    icon: Clock,        className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  processing: { label: "Processing", icon: Clock,        className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  ready:      { label: "Ready",      icon: CheckCircle,  className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  rejected:   { label: "Rejected",   icon: XCircle,      className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

export default function AlumniTranscriptsPage() {
  const { isLoading, sessionToken } = useAuth();
  const { toast } = useToast();
  const [requestType, setRequestType] = useState<"official" | "unofficial">("official");
  const [requestNotes, setRequestNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const transcripts = useQuery(
    api.modules.portal.alumni.queries.getTranscripts,
    sessionToken ? {} : "skip"
  );

  const requestTranscript = useMutation(api.modules.portal.alumni.mutations.requestTranscript);

  const handleRequest = async () => {
    setSubmitting(true);
    try {
      await requestTranscript({
        type: requestType,
        notes: requestNotes.trim() || undefined,
      });
      setRequestNotes("");
      toast({ title: "Request submitted", description: "Your transcript request is now pending review." });
    } catch (err) {
      toast({ title: "Request failed", description: String(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || transcripts === undefined) return <LoadingSkeleton variant="page" />;

  const requests = transcripts?.requests ?? [];
  const pendingCount = requests.filter((r: any) => r.status === "pending" || r.status === "processing").length;
  const readyCount   = requests.filter((r: any) => r.status === "ready").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transcripts"
        description="Request and track your academic transcript downloads"
      />

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{requests.length}</p>
              <p className="text-sm text-muted-foreground">Total Requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{readyCount}</p>
              <p className="text-sm text-muted-foreground">Ready to Download</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request form */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              New Request
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Transcript Type</Label>
              <Select value={requestType} onValueChange={(v: "official" | "unofficial") => setRequestType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="official">Official (Sealed)</SelectItem>
                  <SelectItem value="unofficial">Unofficial (PDF)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {requestType === "official"
                  ? "Physical sealed document — processing takes 3–5 business days."
                  : "Downloadable PDF — usually ready within 24 hours."}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                rows={3}
                placeholder="e.g. Required for graduate school application…"
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleRequest} disabled={submitting}>
              <Send className="mr-2 h-4 w-4" />
              {submitting ? "Submitting…" : "Submit Request"}
            </Button>
          </CardContent>
        </Card>

        {/* Request history */}
        <div className="space-y-3 lg:col-span-2">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Request History</h2>
          {requests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">No transcript requests yet.</p>
                <p className="text-sm text-muted-foreground mt-1">Use the form to submit your first request.</p>
              </CardContent>
            </Card>
          ) : (
            requests.map((req: any) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.pending ?? {
                label: "Pending",
                icon: Clock,
                className: "",
              };
              const StatusIcon = cfg.icon;
              return (
                <Card key={req._id}>
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${cfg.className}`}>
                        <StatusIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{req.type} Transcript</p>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatRelativeTime(req.createdAt)}
                          {req.notes && <span> · {req.notes}</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`${cfg.className} border-0`}>{cfg.label}</Badge>
                      {req.status === "ready" && req.downloadUrl && (
                        <a href={req.downloadUrl} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
