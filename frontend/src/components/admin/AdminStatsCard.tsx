"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function AdminStatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default",
}: AdminStatsCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.isPositive) return <TrendingUp className="h-3 w-3" />;
    if (trend.value < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          icon: "text-green-600",
          trend: "text-green-600",
          border: "border-green-100",
        };
      case "warning":
        return {
          icon: "text-amber-600",
          trend: "text-amber-600",
          border: "border-amber-100",
        };
      case "danger":
        return {
          icon: "text-red-600",
          trend: "text-red-600",
          border: "border-red-100",
        };
      default:
        return {
          icon: "text-forest-600",
          trend: "text-muted-foreground",
          border: "border-border",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Card className={cn("relative overflow-hidden", styles.border, className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={cn("flex items-center gap-1 mt-2", styles.trend)}>
            {getTrendIcon()}
            <span className="text-xs font-medium">
              {trend.isPositive ? "+" : ""}
              {trend.value}% from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
