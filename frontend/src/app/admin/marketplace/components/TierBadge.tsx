"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground border",
  starter: "bg-info-bg text-info border-info",
  standard: "bg-[#EDE9FE] text-role-student border-[#DDD6FE]",
  growth: "bg-[#EDE9FE] text-role-student border-[#DDD6FE]",
  pro: "bg-warning-bg text-em-accent-dark border-warning",
  enterprise: "bg-success-bg text-success border-success",
};

const TIER_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  standard: "Standard",
  growth: "Growth",
  pro: "Pro",
  enterprise: "Enterprise",
};

interface TierBadgeProps {
  tier: string;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const normalizedTier = tier === "free" ? "starter" : tier;
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        TIER_COLORS[normalizedTier] ?? TIER_COLORS["starter"],
        className
      )}
    >
      {TIER_LABELS[normalizedTier] ?? normalizedTier}
    </Badge>
  );
}
