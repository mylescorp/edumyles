"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PM_LINKS = [
  { label: "Dashboard", href: "/platform/pm" },
  { label: "Boards", href: "/platform/pm/boards" },
  { label: "Workspaces", href: "/platform/pm/workspaces" },
  { label: "My Tasks", href: "/platform/pm/my-tasks" },
] as const;

export function PmAdminRail({ currentHref }: { currentHref: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-start pb-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/85">
        <div className="flex w-max min-w-max items-center gap-2">
          {PM_LINKS.map((link) => {
            const active = currentHref === link.href;
            return (
              <Button
                key={link.href}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-lg px-3 text-sm whitespace-nowrap",
                  active
                    ? "bg-platform-chrome text-white shadow-sm hover:bg-platform-chrome/90"
                    : "border-slate-200 bg-white/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                )}
                onClick={() => router.push(link.href)}
              >
                {link.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
