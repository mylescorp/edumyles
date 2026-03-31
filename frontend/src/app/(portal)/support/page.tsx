"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Id } from "@/convex/_generated/dataModel";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Headphones,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Phone,
  Mail,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const QUICK_LINKS = [
  {
    title: "Billing & Payments",
    description: "Fee structures, invoices, M-Pesa issues",
    category: "billing",
    icon: "💳",
  },
  {
    title: "Technical Issues",
    description: "Login problems, system errors, performance",
    category: "technical",
    icon: "⚙️",
  },
  {
    title: "Data & Reports",
    description: "Export issues, missing data, report generation",
    category: "data",
    icon: "📊",
  },
  {
    title: "Feature Requests",
    description: "Suggest improvements or new features",
    category: "feature",
    icon: "💡",
  },
  {
    title: "Onboarding Help",
    description: "Setup guidance, configuration, training",
    category: "onboarding",
    icon: "🚀",
  },
  {
    title: "Account Management",
    description: "User access, permissions, profile issues",
    category: "account",
    icon: "👤",
  },
];

export default function SupportPage() {
  const { tenantId: rawTenantId } = useAuth();
  const tenantId = (rawTenantId ?? "") as Id<"tenants">;

  const tickets = useQuery(
    api.tickets.getTenantTickets,
    tenantId ? { tenantId } : "skip"
  );

  const openCount = tickets?.filter((t) => t.status === "open").length ?? 0;
  const inProgressCount = tickets?.filter((t) => t.status === "in_progress").length ?? 0;
  const resolvedCount = tickets?.filter((t) => t.status === "resolved" || t.status === "closed").length ?? 0;
  const overdueCount = tickets?.filter((t) => t.slaBreached).length ?? 0;

  const recentTickets = tickets?.slice(0, 5) ?? [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P0": return "bg-destructive/10 text-destructive border-destructive/20";
      case "P1": return "bg-orange-50 text-orange-700 border-orange-200";
      case "P2": return "bg-blue-50 text-blue-700 border-blue-200";
      case "P3": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-50 text-blue-700";
      case "in_progress": return "bg-orange-50 text-orange-700";
      case "pending_school": return "bg-purple-50 text-purple-700";
      case "resolved": return "bg-green-50 text-green-700";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support Center"
        description="Get help from our team or browse common solutions"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{openCount}</div>
                <div className="text-xs text-muted-foreground">Open</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{inProgressCount}</div>
                <div className="text-xs text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{resolvedCount}</div>
                <div className="text-xs text-muted-foreground">Resolved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{overdueCount}</div>
                <div className="text-xs text-muted-foreground">Overdue</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — quick actions + categories */}
        <div className="lg:col-span-2 space-y-6">
          {/* New ticket CTA */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Headphones className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Need Help?</h3>
                  <p className="text-sm text-muted-foreground">
                    Submit a ticket and our team will respond within your SLA window.
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/support/tickets/create">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Category quick links */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Common Topics
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {QUICK_LINKS.map((link) => (
                <Link
                  key={link.category}
                  href={`/support/tickets/create?category=${link.category}`}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-2xl">{link.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {link.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {link.description}
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Recent tickets */}
          {recentTickets.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Recent Tickets
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/support/tickets">
                      View All <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="divide-y">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket._id}
                    href={`/support/tickets/${ticket._id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate">{ticket.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{ticket.category}</div>
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                        {ticket.priority}
                      </Badge>
                      <Badge className={getStatusColor(ticket.status)}>
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — contact info + SLA */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Us Directly</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Email</div>
                  <div className="text-muted-foreground">support@edumyles.com</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Phone</div>
                  <div className="text-muted-foreground">+254 700 000 000</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <div className="font-medium">Business Hours</div>
                  <div className="text-muted-foreground">Mon–Fri, 8 AM – 6 PM EAT</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Response Times (SLA)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "P0 — Critical", response: "2h", resolution: "4h", color: "text-destructive" },
                { label: "P1 — High", response: "8h", resolution: "24h", color: "text-orange-600" },
                { label: "P2 — Medium", response: "24h", resolution: "72h", color: "text-blue-600" },
                { label: "P3 — Low", response: "72h", resolution: "7d", color: "text-muted-foreground" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className={`font-medium ${row.color}`}>{row.label}</span>
                  <div className="text-right text-muted-foreground">
                    <span>{row.response} response</span>
                    <span className="mx-1">·</span>
                    <span>{row.resolution} resolution</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" asChild>
            <Link href="/support/tickets">
              <MessageSquare className="h-4 w-4 mr-2" />
              View All Tickets
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
