"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Activity,
  Settings,
  Key,
  Download,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { cn } from "@/lib/utils";

interface UsersNavigationRailProps {
  className?: string;
}

export function UsersNavigationRail({ className }: UsersNavigationRailProps) {
  const { can } = usePlatformPermissions();
  const { user: currentUser } = useAuth();

  const managementLinks = [
    {
      href: "/platform/users",
      label: "All Users",
      description: "Browse platform staff accounts and access coverage.",
      icon: Users,
      show: true,
    },
    {
      href: "/platform/users/invite",
      label: "Invite Staff",
      description: "Create secure staff invitations with role defaults.",
      icon: UserPlus,
      show: can("platform_users.invite"),
    },
    {
      href: "/platform/users/activity",
      label: "Activity Log",
      description: "Trace admin actions, sign-ins, and audit activity.",
      icon: Activity,
      show: can("platform_users.view_activity"),
    },
    {
      href: "/platform/users/bulk",
      label: "Bulk Operations",
      description: "Run imports and exports for staff records.",
      icon: Download,
      show: can("platform_users.edit"),
    },
    {
      href: "/platform/users/sessions",
      label: "Active Sessions",
      description: "Inspect live sessions and recent login movement.",
      icon: Clock,
      show: can("platform_users.view_sessions"),
    },
  ].filter((item) => item.show);

  const adminLinks = [
    {
      href: "/platform/admin",
      label: "Admin",
      description: "Open platform administration settings and controls.",
      icon: Settings,
      show: can("platform_admin.view"),
    },
    {
      href: "/platform/users/permissions",
      label: "Permissions",
      description: "Adjust role rules and access boundaries.",
      icon: Key,
      show: can("platform_users.edit_role"),
    },
  ].filter((item) => item.show);

  return (
    <Card
      className={cn(
        "w-full overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm",
        className
      )}
    >
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <Badge
              variant="outline"
              className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
            >
              Users & Staff
            </Badge>
            <CardTitle className="text-2xl">
              Control access, invites, and audit visibility
            </CardTitle>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Keep the staff registry tidy, route urgent actions faster, and move between user
              operations without forcing the page to do all the work at once.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {can("platform_users.invite") ? (
              <Button asChild className="min-w-[170px]">
                <Link href="/platform/users/invite">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Staff
                </Link>
              </Button>
            ) : null}
            {can("platform_admin.view") ? (
              <Button
                asChild
                variant="outline"
                className="min-w-[170px] border-border/70 bg-background/70"
              >
                <Link href="/platform/admin">
                  <Settings className="mr-2 h-4 w-4" />
                  Admin Settings
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  User Management
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Core routes for daily staffing operations and access reviews.
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {managementLinks.length} tools
              </Badge>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {managementLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group rounded-2xl border border-border/70 bg-background/90 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                        <Icon className="h-4 w-4" />
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </div>
                    <div className="mt-5 space-y-1">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Platform Controls
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump into adjacent administration surfaces when access rules change.
              </p>
            </div>
            <div className="space-y-3">
              {adminLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-start gap-4 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4 transition-all hover:border-emerald-500/40 hover:bg-background"
                  >
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-background text-foreground shadow-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{item.label}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                  </Link>
                );
              })}
            </div>
            {currentUser ? (
              <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-5">
                <p className="text-sm font-semibold text-foreground">Quick launch</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Use the main filters below for review work, then switch into invite or admin flows
                  when you need a dedicated workspace.
                </p>
              </div>
            ) : null}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
