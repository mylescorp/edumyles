"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPERATIONS_LINKS = [
  { label: "Announcements", href: "/platform/communications" },
  { label: "Broadcast", href: "/platform/communications/broadcast" },
  { label: "Knowledge Base", href: "/platform/knowledge-base" },
] as const;

export function OperationsAdminRail({ currentHref }: { currentHref: string }) {
  const router = useRouter();

  return (
    <div className="flex justify-start pb-2">
      <div className="w-fit max-w-full overflow-x-auto rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/85">
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
                    ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                    : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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
