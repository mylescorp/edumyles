"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PmProjectRail({
  workspaceSlug,
  projectId,
  currentHref,
}: {
  workspaceSlug: string;
  projectId: string;
  currentHref: string;
}) {
  const router = useRouter();
  const links = [
    { label: "Board", href: `/platform/pm/${workspaceSlug}/${projectId}` },
    { label: "List", href: `/platform/pm/${workspaceSlug}/${projectId}/list` },
    { label: "Backlog", href: `/platform/pm/${workspaceSlug}/${projectId}/backlog` },
    { label: "Timeline", href: `/platform/pm/${workspaceSlug}/${projectId}/timeline` },
    { label: "Calendar", href: `/platform/pm/${workspaceSlug}/${projectId}/calendar` },
    { label: "Settings", href: `/platform/pm/${workspaceSlug}/${projectId}/settings` },
  ] as const;

  return (
    <div className="flex justify-start pb-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-slate-900/10 bg-white/95 p-2 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.24)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex w-max min-w-max items-center gap-2">
          {links.map((link) => {
            const active = currentHref === link.href;
            return (
              <Button
                key={link.href}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-lg px-3 text-sm whitespace-nowrap",
                  active
                    ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800"
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
