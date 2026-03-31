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
    iconBg: "bg-[rgba(15,76,42,0.1)]",
    iconColor: "text-[#0F4C2A]",
    borderAccent: "border-l-[#0F4C2A]",
  },
  success: {
    iconBg: "bg-[rgba(38,166,91,0.12)]",
    iconColor: "text-[#26A65B]",
    borderAccent: "border-l-[#26A65B]",
  },
  warning: {
    iconBg: "bg-[rgba(232,160,32,0.12)]",
    iconColor: "text-[#E8A020]",
    borderAccent: "border-l-[#E8A020]",
  },
  danger: {
    iconBg: "bg-[rgba(220,38,38,0.1)]",
    iconColor: "text-[#DC2626]",
    borderAccent: "border-l-[#DC2626]",
  },
  info: {
    iconBg: "bg-[rgba(21,101,192,0.1)]",
    iconColor: "text-[#1565C0]",
    borderAccent: "border-l-[#1565C0]",
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
                isPositiveTrend ? "text-[#26A65B]" : "text-[#DC2626]"
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
