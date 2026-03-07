"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Target,
  Calendar,
  Award,
  Download,
  Eye,
  Plus,
  BarChart3
} from "lucide-react";
import { format } from "date-fns";

export default function PartnerDashboardPage() {
  const { isLoading } = useAuth();

  const partnerProfile = useQuery(api.modules.portal.partner.queries.getPartnerProfile, {});
  const sponsoredStudents = useQuery(api.modules.portal.partner.queries.getSponsoredStudents, {});
  const sponsorshipReport = useQuery(api.modules.portal.partner.queries.getSponsorshipReport, {});
  const partnerPayments = useQuery(api.modules.portal.partner.queries.getPartnerPayments, {});
  const announcements = useQuery(api.modules.portal.partner.queries.getPartnerAnnouncements, {});

  if (
    isLoading ||
    partnerProfile === undefined ||
    sponsoredStudents === undefined ||
    sponsorshipReport === undefined ||
    partnerPayments === undefined ||
    announcements === undefined
  ) {
    return <LoadingSkeleton variant="page" />;
  }

  const sponsorshipStats = {
    totalSponsorships: (partnerPayments.upcomingDues?.length ?? 0) + (partnerPayments.payments?.length ?? 0),
    activeSponsorships: sponsoredStudents.length,
    totalInvestment: sponsorshipReport.totalInvestedCents ?? 0,
    studentsSponsored: sponsoredStudents.length,
    impactScore: Math.min(
      100,
      Math.round(
        (((sponsorshipReport.summary?.averageScore ?? 70) / 100) * 60) +
          ((sponsoredStudents.length > 0 ? 1 : 0) * 20) +
          20
      )
    ),
  };

  const recentSponsorships = (sponsorshipReport.students ?? []).slice(0, 5).map((s: any) => ({
    _id: s.studentId,
    studentName: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || "Student",
    amount: Math.round((sponsorshipStats.totalInvestment || 0) / Math.max(1, sponsoredStudents.length)),
    type: "Sponsorship",
    startDate: new Date().toISOString(),
    status: "active",
    impact: s.averageScore != null && s.averageScore >= 75 ? "High" : "Medium",
  }));

  const upcomingEvents = (announcements ?? []).slice(0, 5).map((a: any) => ({
    _id: String(a._id),
    title: a.title ?? "Partner Update",
    date: new Date(a.createdAt ?? Date.now()).toISOString(),
    type: a.type ?? "announcement",
    attendees: sponsoredStudents.length,
  }));

  return (
    <div>
      <PageHeader
        title="Partner Portal"
        description="Manage sponsorships and track your educational impact"
      />

      <div className="space-y-6">
        {/* Sponsorship Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sponsorship Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {sponsorshipStats.totalSponsorships}
                </div>
                <p className="text-sm text-muted-foreground">Total Sponsorships</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {sponsorshipStats.activeSponsorships}
                </div>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  KES {(sponsorshipStats.totalInvestment / 100).toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">Total Investment</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {sponsorshipStats.studentsSponsored}
                </div>
                <p className="text-sm text-muted-foreground">Students Sponsored</p>
              </div>
            </div>

            {/* Impact Score */}
            <div className="mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Impact Score</span>
                <span className="text-sm text-muted-foreground">{sponsorshipStats.impactScore}%</span>
              </div>
              <Progress value={sponsorshipStats.impactScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Sponsorships */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Sponsorships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSponsorships.map((sponsorship) => (
                <div key={sponsorship._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{sponsorship.studentName}</h4>
                        <Badge 
                          variant={sponsorship.status === "active" ? "default" : "secondary"}
                        >
                          {sponsorship.status}
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">KES {(sponsorship.amount / 100).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{sponsorship.type}</p>
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Start Date</p>
                          <p className="font-medium">{format(new Date(sponsorship.startDate), "PPP")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Impact</p>
                          <Badge variant="outline">{sponsorship.impact}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Sponsorship
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event._id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{event.title}</h4>
                        <Badge variant="outline">{event.type}</Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium">
                            {format(new Date(event.date), "PPP")}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Attendees</p>
                          <p className="font-medium">{event.attendees} partners</p>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      RSVP
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
