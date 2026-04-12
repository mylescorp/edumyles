"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, ShieldCheck, Sparkles, UserPlus, Waypoints } from "lucide-react";
import { PlatformAdminInviteForm } from "../PlatformAdminInviteForm";

export default function InviteAdminPage() {
  const { isLoading, sessionToken } = useAuth();
  const { can, isLoaded } = usePlatformPermissions();
  const canInvite = can("platform_users.invite");

  if (isLoading || !isLoaded) return <LoadingSkeleton variant="page" />;

  if (!canInvite || !sessionToken) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">
          You do not have permission to invite platform staff.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invite Platform Admin"
        description="Create a platform operator account with role context, department ownership, and a cleaner access review before the invite is sent."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Users", href: "/platform/users" },
          { label: "Invite" },
        ]}
      />

      <UsersAdminRail variant="bar" />

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="border-emerald-200/70 bg-gradient-to-br from-white via-emerald-50/50 to-slate-50 shadow-md xl:col-span-2 dark:from-background dark:via-background dark:to-muted/20">
          <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-7">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/15 text-emerald-800"
                >
                  Invite Flow
                </Badge>
                <Badge variant="secondary" className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-slate-700 shadow-sm">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Secure onboarding
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-700 shadow-sm">
                  <UserPlus className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
                    Invite the next platform operator with clarity and control.
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600 dark:text-muted-foreground">
                    This version is organized around how platform leaders actually work: identify
                    the person, place them in the right operational department, review the role
                    footprint, and then send the onboarding path.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px] lg:grid-cols-1">
              <div className="rounded-2xl border border-white/80 bg-white/95 p-4 shadow-sm dark:border-border/70 dark:bg-background/90">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Waypoints className="h-4 w-4 text-emerald-700" />
                  What this page handles
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-muted-foreground">
                  Role assignment, department ownership, invite messaging, and access preview.
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/12 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Operational safety
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-muted-foreground">
                  Permission exposure is visible before sending, reducing accidental
                  over-provisioning.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Activity className="h-4 w-4 text-sky-700" />
                  Admin hygiene
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-muted-foreground">
                  Use departments to keep platform ownership visible across support, billing,
                  operations, security, and marketplace workflows.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-lg">
          <CardContent className="space-y-4 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/80">
              Professional Invite Standard
            </p>
            <h3 className="text-xl font-semibold tracking-tight">
              Keep every new platform invite structured, auditable, and easy to understand.
            </h3>
            <ul className="space-y-3 text-sm leading-6 text-emerald-50/80">
              <li>Use the role preview to verify access before the invite leaves the platform.</li>
              <li>Choose a department so ownership is visible in future support and ops workflows.</li>
              <li>Reserve broad roles for people who truly need cross-platform control.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <PlatformAdminInviteForm
        mode="page"
        sessionToken={sessionToken}
        onCancel={() => window.history.back()}
      />
    </div>
  );
}
