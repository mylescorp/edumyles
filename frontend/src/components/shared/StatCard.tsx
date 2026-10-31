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
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    borderAccent: "border-l-primary",
  },
  success: {
    iconBg: "bg-success-muted",
    iconColor: "text-success-muted-foreground",
    borderAccent: "border-l-success",
  },
  warning: {
    iconBg: "bg-warning-muted",
    iconColor: "text-warning-muted-foreground",
    borderAccent: "border-l-warning",
  },
  danger: {
    iconBg: "bg-danger-muted",
    iconColor: "text-danger-muted-foreground",
    borderAccent: "border-l-danger",
  },
  info: {
    iconBg: "bg-info-muted",
    iconColor: "text-info-muted-foreground",
    borderAccent: "border-l-info",
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
                isPositiveTrend ? "text-success" : "text-danger"
              )}>
                {isPositiveTrend
                  ? <TrendingUp className="h-3 w-3" />
                  : <TrendingDown className="h-3 w-3" />
                }
                <span>{isPositiveTrend ? "+" : ""}{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
          <div className={cn("flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg", cfg.iconBg)}>
            <Icon className={cn("h-5 w-5", cfg.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
