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

        <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm">
          <CardContent className="p-0">
            <div className="grid gap-0 xl:grid-cols-[1.05fr_1.45fr]">
              <div className="border-b border-border/60 bg-muted/20 p-6 lg:p-8 xl:border-b-0 xl:border-r">
                <div className="space-y-6">
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

                  <div className="space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-700 shadow-sm">
                      <UserPlus className="h-6 w-6" />
                    </div>
                    <h2 className="max-w-lg text-3xl font-semibold tracking-tight text-foreground">
                      Invite the next platform operator with confidence.
                    </h2>
                    <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                      A professional onboarding flow should surface role context, safety cues, and
                      access impact before the invite is ever sent. This layout is tuned for that.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-background/90 p-5">
                      <p className="text-sm font-medium text-foreground">What this page handles</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Role assignment, department context, invite message, and access preview in a
                        single review flow.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-background to-background p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-700" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Operational safety</p>
                          <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            Permission scope is visible before sending, which reduces accidental
                            over-provisioning and makes handoffs cleaner.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                        Best practice
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Use the smallest role that matches responsibility, then expand access only if
                        the job actually requires it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 lg:p-8">
                <PlatformAdminInviteForm
                  mode="page"
                  sessionToken={sessionToken}
                  onCancel={() => window.history.back()}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
