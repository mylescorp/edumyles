"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPERATIONS_LINKS = [
  { label: "Analytics", href: "/platform/analytics" },
  { label: "Scheduled Reports", href: "/platform/scheduled-reports" },
  { label: "SLA", href: "/platform/sla" },
] as const;

export function OperationsSuiteRail({ currentHref }: { currentHref: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-start pb-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-emerald-950/10 bg-white/95 p-2 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.24)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex w-max min-w-max items-center gap-2">
          {OPERATIONS_LINKS.map((link) => {
            const active = currentHref === link.href;
            return (
              <Button
                key={link.href}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-lg px-3 text-sm whitespace-nowrap",
                  active
                    ? "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                    : "border-emerald-200 bg-white/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
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
