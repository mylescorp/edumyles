"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { UsersAdminRail } from "@/components/platform/UsersAdminRail";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformPermissions } from "@/hooks/usePlatformPermissions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Sparkles, UserPlus } from "lucide-react";
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

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="xl:sticky xl:top-6 xl:self-start">
          <UsersAdminRail variant="rail" />
        </aside>

        <div className="space-y-6">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-r from-emerald-500/8 via-background to-sky-500/5 shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_320px] xl:items-end">
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                    >
                      Invite Flow
                    </Badge>
                    <Badge variant="secondary" className="rounded-full px-3 py-1">
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Secure onboarding
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-700 shadow-sm">
                      <UserPlus className="h-5 w-5" />
                    </div>
                    <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground">
                      Invite the next platform operator with a cleaner, review-first flow.
                    </h2>
                    <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                      Keep identity, role posture, scope restrictions, and permission overrides in
                      one place without forcing operators to scan three competing panels.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-2xl border border-border/70 bg-background/85 p-4">
                    <p className="text-sm font-medium text-foreground">What this page handles</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Identity capture, role assignment, scoped access, permission overrides, and
                      invite delivery.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Operational safety</p>
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                          Review the effective access posture before the invite is sent so handoffs
                          stay controlled.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <PlatformAdminInviteForm
            mode="page"
            sessionToken={sessionToken}
            onCancel={() => window.history.back()}
          />
        </div>
      </div>
    </div>
  );
}
