"use client";

import Link from "next/link";
import { Bot, BookOpen, Headphones, LifeBuoy, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const supportAreas = [
  {
    title: "Support Queue",
    description: "Manage tenant tickets, assignment flow, SLA posture, and live support operations from the platform queue.",
    href: "/platform/tickets",
    icon: Headphones,
    badge: "Operations",
  },
  {
    title: "AI Support",
    description: "Use AI-assisted analysis, response drafting, escalation guidance, and support insights for faster triage.",
    href: "/platform/ai-support",
    icon: Bot,
    badge: "AI assisted",
  },
  {
    title: "Knowledge Base",
    description: "Maintain support articles, reusable answers, and documented resolutions for the platform team.",
    href: "/platform/knowledge-base",
    icon: BookOpen,
    badge: "Content",
  },
] as const;

export default function PlatformSupportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        description="Central support workspace for ticket operations, AI-assisted help, and support knowledge."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Support", href: "/platform/support" },
        ]}
        badge={
          <Badge className="gap-1.5 border border-[#26A65B]/40 bg-[rgba(38,166,91,0.07)] text-xs text-[#26A65B]">
            <Sparkles className="h-3.5 w-3.5" />
            Support hub
          </Badge>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {supportAreas.map((area) => {
          const Icon = area.icon;
          return (
            <Card key={area.href} className="border-border/60 shadow-sm">
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F4C2A]/8 text-[#0F4C2A]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {area.badge}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-lg">{area.title}</CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Link href={area.href}>
                  <Button className="w-full bg-[#0F4C2A] text-white hover:bg-[#1A7A4A]">
                    Open {area.title}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <LifeBuoy className="h-4 w-4 text-[#1565C0]" />
              How Support Should Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>1. Capture all live issues in Support Queue.</p>
            <p>2. Use AI Support when you need faster triage, assisted replies, or escalation guidance.</p>
            <p>3. Promote recurring solutions into Knowledge Base content for reuse.</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-[#0D9488]" />
              Governance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Support actions should stay traceable through tickets, activity feeds, and audit-backed operational workflows.</p>
            <p>Security-sensitive issues should be routed onward from support into the Security workspace after triage.</p>
            <div className="pt-1">
              <Link href="/platform/security">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Open Security Workspace
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
