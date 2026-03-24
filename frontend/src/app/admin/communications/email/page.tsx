"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmailComposer } from "@/components/communications/EmailComposer";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bgColor: string; label: string }> = {
  sent: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", label: "Sent" },
  delivered: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50", label: "Delivered" },
  running: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50", label: "Running" },
  scheduled: { icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-50", label: "Scheduled" },
  draft: { icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50", label: "Draft" },
  failed: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50", label: "Failed" },
  paused: { icon: AlertCircle, color: "text-orange-600", bgColor: "bg-orange-50", label: "Paused" },
};

export default function EmailPage() {
  const { isLoading, sessionToken } = useAuth();

  const stats = useQuery(
    api.modules.communications.queries.getCommunicationsStats,
    sessionToken ? { sessionToken } : "skip"
  );

  const campaigns = useQuery(
    api.modules.communications.queries.listCampaigns,
    sessionToken ? { sessionToken, limit: 10 } : "skip"
  );

  if (isLoading) return <LoadingSkeleton variant="page" />;

  const campaignList = (campaigns as any[]) ?? [];
  const statsData = (stats as any) ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Email Communications"
        description="Send emails to parents, students, and staff"
        actions={[]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Composer */}
        <EmailComposer />

        {/* Email History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Recent Campaign Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campaignList.map((campaign: any) => {
                const statusKey = campaign.status ?? "draft";
                const status = statusConfig[statusKey] ?? statusConfig.draft;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={campaign._id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className={`p-2 rounded-full ${status.bgColor}`}>
                      <StatusIcon className={`h-4 w-4 ${status.color}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium truncate">{campaign.name}</p>
                        {campaign.channel && (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {campaign.channel}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {campaign.scheduledAt && (
                          <span>Scheduled: {new Date(campaign.scheduledAt).toLocaleString()}</span>
                        )}
                        {campaign.sentAt && (
                          <span>Sent: {new Date(campaign.sentAt).toLocaleString()}</span>
                        )}
                        {!campaign.scheduledAt && !campaign.sentAt && (
                          <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>

                    <Badge variant="outline" className={`${status.color} border-current`}>
                      {status.label}
                    </Badge>
                  </div>
                );
              })}

              {campaignList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaigns yet</p>
                  <p className="text-sm">Start by composing your first email</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Email Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statsData.totalMessages ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{statsData.deliveryRate ?? 0}%</p>
                <p className="text-sm text-muted-foreground">Delivery Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{statsData.openRate ?? 0}%</p>
                <p className="text-sm text-muted-foreground">Open Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{statsData.totalCampaigns ?? 0}</p>
                <p className="text-sm text-muted-foreground">Total Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
