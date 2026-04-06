"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { MarketplaceAdminRail } from "@/components/platform/MarketplaceAdminRail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { formatDateTime } from "@/lib/formatters";
import { ArrowLeft, Building2, LifeBuoy, Package, Wallet, Webhook } from "lucide-react";

function statusClass(status: string) {
  switch (status) {
    case "approved":
    case "paid":
    case "resolved":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-700";
    case "pending":
    case "processing":
    case "in_progress":
      return "border-amber-500/20 bg-amber-500/10 text-amber-700";
    default:
      return "border-rose-500/20 bg-rose-500/10 text-rose-700";
  }
}

export default function PublisherDetailPage() {
  const { sessionToken, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const publisherId = params.publisherId as string;
  const [saving, setSaving] = useState(false);
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [revenueSharePct, setRevenueSharePct] = useState("");

  const detail = usePlatformQuery(
    api.modules.marketplace.publishers.getPublisherDetailBundle,
    sessionToken ? { sessionToken, publisherId: publisherId as any } : "skip",
    !!sessionToken
  ) as any;

  const approvePublisher = useMutation(api.modules.marketplace.publishers.approvePublisher);
  const rejectPublisher = useMutation(api.modules.marketplace.publishers.rejectPublisher);
  const suspendPublisher = useMutation(api.modules.marketplace.publishers.suspendPublisher);
  const banPublisher = useMutation(api.modules.marketplace.publishers.banPublisher);
  const updateTier = useMutation(api.modules.marketplace.publishers.updatePublisherTier);
  const updateRevenueShare = useMutation(api.modules.marketplace.publishers.updateRevenueShare);

  if (isLoading || detail === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  if (!detail) {
    return (
      <EmptyState
        icon={Building2}
        title="Publisher not found"
        description="The requested publisher record could not be loaded."
      />
    );
  }

  const { publisher, modules, payouts, supportTickets, webhookLogs, stats } = detail;

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setSaving(true);
    try {
      await action();
      toast({ title: successMessage });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevenueShareSave = async () => {
    if (!sessionToken || !revenueSharePct) return;
    setSaving(true);
    try {
      await updateRevenueShare({
        sessionToken,
        publisherId: publisher._id,
        revenueSharePct: Number(revenueSharePct),
      });
      toast({ title: "Revenue share updated" });
      setRevenueDialogOpen(false);
      setRevenueSharePct("");
    } catch (error) {
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={publisher.companyName}
        description="Publisher operations, modules, payouts, support load, and webhook delivery health."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Marketplace", href: "/platform/marketplace" },
          { label: "Publishers", href: "/platform/marketplace/publishers" },
          { label: publisher.companyName },
        ]}
        actions={
          <Button variant="ghost" onClick={() => router.push("/platform/marketplace/publishers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        }
      />

      <MarketplaceAdminRail currentHref="/platform/marketplace/publishers" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Modules</p><p className="text-3xl font-semibold">{stats.totalModules}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Published</p><p className="text-3xl font-semibold">{stats.publishedModules}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Paid out</p><p className="text-3xl font-semibold">KES {stats.totalPayoutKes.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Open support</p><p className="text-3xl font-semibold">{stats.openSupportTickets}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Publisher Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{publisher.email}</p></div>
          <div><p className="text-sm text-muted-foreground">Status</p><Badge variant="outline" className={statusClass(publisher.status)}>{publisher.status}</Badge></div>
          <div><p className="text-sm text-muted-foreground">Tier</p><p className="font-medium">{publisher.tier}</p></div>
          <div><p className="text-sm text-muted-foreground">Revenue Share</p><p className="font-medium">{publisher.revenueSharePct}%</p></div>
          <div><p className="text-sm text-muted-foreground">Website</p><p className="font-medium">{publisher.website ?? "—"}</p></div>
          <div><p className="text-sm text-muted-foreground">Billing Country</p><p className="font-medium">{publisher.billingCountry ?? "—"}</p></div>
          <div><p className="text-sm text-muted-foreground">Tax ID</p><p className="font-medium">{publisher.taxId ?? "—"}</p></div>
          <div><p className="text-sm text-muted-foreground">Created</p><p className="font-medium">{formatDateTime(publisher.createdAt)}</p></div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={saving || publisher.status === "approved"} onClick={() => runAction(() => approvePublisher({ sessionToken: sessionToken!, publisherId: publisher._id }), "Publisher approved")}>Approve</Button>
        <Button variant="outline" disabled={saving || publisher.status === "rejected"} onClick={() => runAction(() => rejectPublisher({ sessionToken: sessionToken!, publisherId: publisher._id }), "Publisher rejected")}>Reject</Button>
        <Button variant="outline" disabled={saving || publisher.status === "suspended"} onClick={() => runAction(() => suspendPublisher({ sessionToken: sessionToken!, publisherId: publisher._id }), "Publisher suspended")}>Suspend</Button>
        <Button variant="destructive" disabled={saving || publisher.status === "banned"} onClick={() => runAction(() => banPublisher({ sessionToken: sessionToken!, publisherId: publisher._id }), "Publisher banned")}>Ban</Button>
        <Select
          defaultValue={publisher.tier}
          onValueChange={(value) =>
            runAction(
              () => updateTier({ sessionToken: sessionToken!, publisherId: publisher._id, tier: value as any }),
              "Publisher tier updated"
            )
          }
        >
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="indie">Indie</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={() => {
            setRevenueSharePct(String(publisher.revenueSharePct ?? 70));
            setRevenueDialogOpen(true);
          }}
        >
          Update Revenue Share
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Modules</CardTitle></CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <EmptyState icon={Package} title="No modules yet" description="This publisher has not submitted any marketplace modules yet." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead><TableHead>Category</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
                <TableBody>
                  {modules.map((module: any) => (
                    <TableRow key={String(module._id)}>
                      <TableCell>{module.name}</TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(module.status)}>{module.status}</Badge></TableCell>
                      <TableCell>{module.category}</TableCell>
                      <TableCell>{formatDateTime(module.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />Recent Payouts</CardTitle></CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <EmptyState icon={Wallet} title="No payouts yet" description="Publisher payouts will appear here once billing activity accrues." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead>Period End</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                <TableBody>
                  {payouts.map((payout: any) => (
                    <TableRow key={String(payout._id)}>
                      <TableCell><Badge variant="outline" className={statusClass(payout.status)}>{payout.status}</Badge></TableCell>
                      <TableCell>{formatDateTime(payout.periodEnd)}</TableCell>
                      <TableCell>KES {payout.amountKes.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LifeBuoy className="h-5 w-5" />Support Tickets</CardTitle></CardHeader>
          <CardContent>
            {supportTickets.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No support tickets" description="Publisher-facing support tickets will appear here." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader>
                <TableBody>
                  {supportTickets.map((ticket: any) => (
                    <TableRow key={String(ticket._id)}>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(ticket.status)}>{ticket.status}</Badge></TableCell>
                      <TableCell>{ticket.priority}</TableCell>
                      <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Webhook className="h-5 w-5" />Webhook Delivery</CardTitle></CardHeader>
          <CardContent>
            {webhookLogs.length === 0 ? (
              <EmptyState icon={Webhook} title="No webhook logs" description="Webhook delivery attempts for this publisher will appear here." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Status</TableHead><TableHead>Attempts</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                <TableBody>
                  {webhookLogs.map((log: any) => (
                    <TableRow key={String(log._id)}>
                      <TableCell>{log.eventType}</TableCell>
                      <TableCell><Badge variant="outline" className={statusClass(log.status)}>{log.status}</Badge></TableCell>
                      <TableCell>{log.attempts}</TableCell>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Revenue Share</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Publisher</Label>
              <p className="text-sm text-muted-foreground">{publisher.companyName}</p>
            </div>
            <div className="space-y-2">
              <Label>Revenue Share %</Label>
              <Input value={revenueSharePct} onChange={(event) => setRevenueSharePct(event.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevenueDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRevenueShareSave} disabled={saving || !revenueSharePct}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
