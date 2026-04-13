"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MARKETPLACE_LINKS = [
  { label: "Overview", href: "/platform/marketplace" },
  { label: "Modules", href: "/platform/marketplace/modules" },
  { label: "Review Queue", href: "/platform/marketplace/admin" },
  { label: "Pricing Controls", href: "/platform/marketplace/pricing" },
  { label: "Billing", href: "/platform/marketplace/billing" },
  { label: "Flags", href: "/platform/marketplace/flags" },
  { label: "Reviews", href: "/platform/marketplace/reviews" },
  { label: "Pilot Grants", href: "/platform/marketplace/pilot-grants" },
  { label: "Publishers", href: "/platform/marketplace/publishers" },
] as const;

export function MarketplaceAdminRail({ currentHref }: { currentHref: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-start pb-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-emerald-950/10 bg-white/95 p-2 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.24)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="flex w-max min-w-max items-center gap-2">
          {MARKETPLACE_LINKS.map((action) => {
            const active = currentHref === action.href;
            return (
              <Button
                key={action.href}
                variant={active ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-9 rounded-lg px-3 text-sm whitespace-nowrap",
                  active
                    ? "bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                    : "border-emerald-200 bg-white/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-900"
                )}
                onClick={() => router.push(action.href)}
              >
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
