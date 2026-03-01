"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TIER_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  starter: "bg-blue-50 text-blue-700 border-blue-200",
  standard: "bg-purple-50 text-purple-700 border-purple-200",
  growth: "bg-purple-50 text-purple-700 border-purple-200",
  pro: "bg-amber-50 text-amber-700 border-amber-200",
  enterprise: "bg-emerald-50 text-emerald-700 border-emerald-200",
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
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        TIER_COLORS[tier] ?? TIER_COLORS["free"],
        className
      )}
    >
      {TIER_LABELS[tier] ?? tier}
    </Badge>
  );
}
