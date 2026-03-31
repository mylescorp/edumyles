"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface AdminStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "success" | "warning" | "danger";
}

const variantConfig = {
  default: {
    iconBg: "bg-[rgba(15,76,42,0.1)]",
    iconColor: "text-[#0F4C2A]",
    borderAccent: "border-l-[#0F4C2A]",
    trendColor: "text-muted-foreground",
  },
  success: {
    iconBg: "bg-[rgba(38,166,91,0.12)]",
    iconColor: "text-[#26A65B]",
    borderAccent: "border-l-[#26A65B]",
    trendColor: "text-[#26A65B]",
  },
  warning: {
    iconBg: "bg-[rgba(232,160,32,0.12)]",
    iconColor: "text-[#E8A020]",
    borderAccent: "border-l-[#E8A020]",
    trendColor: "text-[#E8A020]",
  },
  danger: {
    iconBg: "bg-[rgba(220,38,38,0.1)]",
    iconColor: "text-[#DC2626]",
    borderAccent: "border-l-[#DC2626]",
    trendColor: "text-[#DC2626]",
  },
};

export function AdminStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default",
}: AdminStatsCardProps) {
  const cfg = variantConfig[variant];

  const TrendIcon = !trend
    ? null
    : trend.isPositive
    ? TrendingUp
    : trend.value < 0
    ? TrendingDown
    : Minus;

  return (
    <Card className={cn(
      "relative overflow-hidden border-l-4 shadow-sm hover:shadow-md transition-shadow duration-200",
      cfg.borderAccent,
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{description}</p>
            )}
            {trend && TrendIcon && (
              <div className={cn("flex items-center gap-1 mt-2 text-xs font-medium", cfg.trendColor)}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}% from last month
                </span>
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
