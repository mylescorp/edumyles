"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { BarChart3, ChevronRight, Eye, Shield, UserCog, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    label: "All Users",
    href: "/platform/users",
    description: "Registry and account actions",
    icon: Users,
  },
  {
    label: "Invite Staff",
    href: "/platform/users/invite",
    description: "Send secure onboarding links",
    icon: UserPlus,
  },
  {
    label: "Roles",
    href: "/platform/users/roles",
    description: "Review role structure",
    icon: UserCog,
  },
  {
    label: "Impersonation",
    href: "/platform/impersonation",
    description: "Controlled support access",
    icon: Eye,
  },
  {
    label: "Staff Performance",
    href: "/platform/staff-performance",
    description: "Team visibility and trends",
    icon: BarChart3,
  },
];

interface UsersAdminRailProps {
  variant?: "bar" | "rail";
  className?: string;
}

function isActive(pathname: string, href: string) {
  if (href === "/platform/users") {
    return pathname === href || pathname.startsWith("/platform/users/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function UsersAdminRail({
  variant = "bar",
  className,
}: UsersAdminRailProps) {
  const pathname = usePathname();
  const isRail = variant === "rail";

  return (
    <div className={cn("flex items-center", className)}>
      <div
        className={cn(
          "w-full rounded-3xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/20 shadow-sm",
          isRail ? "p-4" : "p-3"
        )}
      >
        <div
          className={cn(
            "mb-3 flex flex-wrap gap-3 px-1",
            isRail ? "items-start justify-start" : "items-center justify-between"
          )}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Users Navigation
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isRail
                ? "Jump between staff operations, access control, and support flows from one place."
                : "Move between staff operations without losing your place in the workflow."}
            </p>
          </div>
          <Badge
            variant="outline"
            className="w-fit border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
          >
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Admin workspace
          </Badge>
        </div>

        <div className={cn("grid gap-2", isRail ? "grid-cols-1" : "md:grid-cols-2 xl:grid-cols-5")}>
          {ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group rounded-2xl border px-4 py-3 transition-all",
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                    : "border-border/70 bg-background/90 text-slate-700 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50/70 hover:shadow-sm"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl transition-colors",
                      active ? "bg-white/15 text-white" : "bg-emerald-500/10 text-emerald-700"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <ChevronRight
                    className={cn(
                      "mt-1 h-4 w-4 transition-all",
                      active
                        ? "text-white/80"
                        : "text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground"
                    )}
                  />
                </div>
                <div className="mt-4">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      active ? "text-white" : "text-foreground"
                    )}
                  >
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      "mt-1 text-xs leading-5",
                      active ? "text-white/75" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
