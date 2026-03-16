"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Megaphone, FileText, Clock3, Send, AlertTriangle, Search, Plus, Eye } from "lucide-react";

type StatusFilter = "" | "draft" | "scheduled" | "sending" | "sent" | "failed";
type TypeFilter = "" | "broadcast" | "campaign" | "alert" | "transactional" | "drip_step";
type ChannelFilter = "" | "in_app" | "email" | "sms";

export default function PlatformCommunicationsPage() {
  const { sessionToken, isLoading: authLoading } = useAuth();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [type, setType] = useState<TypeFilter>("");
  const [channel, setChannel] = useState<ChannelFilter>("");

  const { data: stats, isLoading: statsLoading } = useQuery(
    api.platform.communications.queries.getPlatformCommunicationStats,
    { sessionToken: sessionToken || "" }
  );

  const { data: messages, isLoading: messagesLoading } = useQuery(
    api.platform.communications.queries.listPlatformMessages,
    {
      sessionToken: sessionToken || "",
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(channel ? { channel } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
      limit: 50,
    }
  );

  const isLoading = authLoading || statsLoading || messagesLoading;

  const safeMessages = useMemo(() => {
    return Array.isArray(messages) ? messages : [];
  }, [messages]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <PageHeader
          title="Communications"
          description="Manage master admin broadcasts and platform message history"
        />
        <Link href="/platform/communications/broadcast">
          <Button className="bg-em-accent hover:bg-em-accent-dark">
            <Plus className="h-4 w-4 mr-2" />
            New Broadcast
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold">{stats?.total ?? 0}</p>
            </div>
            <Megaphone className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className="text-2xl font-semibold">{stats?.drafts ?? 0}</p>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-semibold">{stats?.scheduled ?? 0}</p>
            </div>
            <Clock3 className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sent</p>
              <p className="text-2xl font-semibold">{stats?.sent ?? 0}</p>
            </div>
            <Send className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-semibold">{stats?.failed ?? 0}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as TypeFilter)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All types</option>
            <option value="broadcast">Broadcast</option>
            <option value="campaign">Campaign</option>
            <option value="alert">Alert</option>
            <option value="transactional">Transactional</option>
            <option value="drip_step">Drip Step</option>
          </select>

          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as ChannelFilter)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All channels</option>
            <option value="in_app">In-app</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading communications...</p>
          ) : safeMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No communications found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 pr-4">Subject</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Channels</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Delivered</th>
                    <th className="py-3 pr-4">Created</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {safeMessages.map((message: any) => (
                    <tr key={message._id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">{message.subject}</td>
                      <td className="py-3 pr-4">{message.type}</td>
                      <td className="py-3 pr-4">{(message.channels || []).join(", ")}</td>
                      <td className="py-3 pr-4">{message.status}</td>
                      <td className="py-3 pr-4">{message.stats?.delivered ?? 0}</td>
                      <td className="py-3 pr-4">
                        {message.createdAt ? new Date(message.createdAt).toLocaleString() : "-"}
                      </td>
                      <td className="py-3">
                        <Link href={`/platform/communications/${message._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
