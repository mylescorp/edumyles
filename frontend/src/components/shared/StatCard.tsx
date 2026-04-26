import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantConfig = {
  default: {
    iconBg: "bg-[var(--platform-accent-soft)]",
    iconColor: "text-[var(--platform-accent)]",
    borderAccent: "border-l-[var(--platform-accent)]",
  },
  success: {
    iconBg: "bg-[var(--platform-success-soft)]",
    iconColor: "text-[var(--em-success)]",
    borderAccent: "border-l-[var(--em-success)]",
  },
  warning: {
    iconBg: "bg-[var(--platform-highlight-soft)]",
    iconColor: "text-[var(--platform-highlight)]",
    borderAccent: "border-l-[var(--platform-highlight)]",
  },
  danger: {
    iconBg: "bg-[var(--platform-danger-soft)]",
    iconColor: "text-[var(--em-danger)]",
    borderAccent: "border-l-[var(--em-danger)]",
  },
  info: {
    iconBg: "bg-[var(--platform-accent-soft)]",
    iconColor: "text-[var(--platform-accent)]",
    borderAccent: "border-l-[var(--platform-accent)]",
  },
};

export function StatCard({ label, value, icon: Icon, trend, className, variant = "default" }: StatCardProps) {
  const cfg = variantConfig[variant];
  const isPositiveTrend = trend && trend.value >= 0;

  return (
    <Card className={cn(
      "relative overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200",
      cfg.borderAccent,
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">{label}</p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            {trend && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                isPositiveTrend ? "text-[var(--em-success)]" : "text-[var(--em-danger)]"
              )}>
                {isPositiveTrend
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                <span>{isPositiveTrend ? "+" : ""}{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0", cfg.iconBg)}>
            <Icon className={cn("h-5 w-5", cfg.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
