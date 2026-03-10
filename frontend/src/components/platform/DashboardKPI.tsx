"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  DollarSign,
  FileText,
  MessageSquare,
  TrendingUp,
  Activity,
  Users,
  Calendar,
} from "lucide-react";

interface KPIWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  status?: "success" | "warning" | "danger" | "info";
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function KPIWidget({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  status, 
  action, 
  className 
}: KPIWidgetProps) {
  const getStatusColor = () => {
    switch (status) {
      case "success":
        return "border-success/20 bg-success-bg/5";
      case "warning":
        return "border-warning/20 bg-warning-bg/5";
      case "danger":
        return "border-danger/20 bg-danger-bg/5";
      case "info":
        return "border-info/20 bg-info-bg/5";
      default:
        return "border-border bg-card";
    }
  };

  const getIconColor = () => {
    switch (status) {
      case "success":
        return "text-success";
      case "warning":
        return "text-warning";
      case "danger":
        return "text-danger";
      case "info":
        return "text-info";
      default:
        return "text-primary";
    }
  };

  return (
    <Card className={cn("relative overflow-hidden", getStatusColor(), className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", 
          status ? `bg-${status === 'success' ? 'success' : status === 'warning' ? 'warning' : status === 'danger' ? 'danger' : 'info'}/10` : "bg-primary/10")}>
          <Icon className={cn("h-4 w-4", getIconColor())} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <span className="text-sm text-muted-foreground">{subtitle}</span>
          )}
        </div>
        
        {trend && (
          <div className="flex items-center space-x-1 mt-2">
            <span className={cn(
              "text-xs font-medium flex items-center",
              trend.isPositive ? "text-success" : "text-danger"
            )}>
              {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}

        {action && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-3 h-8 text-xs"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface KPIGridProps {
  kpis: {
    activeTenants: number;
    mrr: number;
    arr: number;
    openTickets: number;
    pipelineValue: number;
    systemHealth: number;
    trialsActive: number;
    newThisMonth: number;
  };
  isLoading?: boolean;
}

export function DashboardKPIGrid({ kpis, isLoading }: KPIGridProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-8 bg-muted rounded w-16" />
                <div className="h-3 bg-muted rounded w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Active Tenants */}
      <KPIWidget
        title="Active Tenants"
        value={kpis.activeTenants.toLocaleString()}
        icon={Building2}
        trend={{
          value: 12.5,
          label: "vs last month",
          isPositive: true
        }}
        status="success"
        action={{
          label: "View All",
          onClick: () => window.location.href = "/platform/tenants"
        }}
      />

      {/* MRR */}
      <KPIWidget
        title="Monthly Recurring Revenue"
        value={`KES ${kpis.mrr.toLocaleString()}`}
        icon={DollarSign}
        trend={{
          value: 8.3,
          label: "vs last month",
          isPositive: true
        }}
        status="success"
      />

      {/* ARR */}
      <KPIWidget
        title="Annual Run Rate"
        value={`KES ${kpis.arr.toLocaleString()}`}
        icon={TrendingUp}
        subtitle="MRR × 12"
      />

      {/* Open Tickets */}
      <KPIWidget
        title="Open Tickets"
        value={kpis.openTickets.toLocaleString()}
        icon={MessageSquare}
        trend={{
          value: 5.2,
          label: "vs last week",
          isPositive: false
        }}
        status={kpis.openTickets > 20 ? "warning" : "info"}
        action={{
          label: "View Queue",
          onClick: () => window.location.href = "/platform/tickets"
        }}
      />

      {/* Pipeline Value */}
      <KPIWidget
        title="Pipeline Value"
        value={`KES ${kpis.pipelineValue.toLocaleString()}`}
        icon={TrendingUp}
        subtitle="CRM deals"
        status="info"
        action={{
          label: "View CRM",
          onClick: () => window.location.href = "/platform/crm"
        }}
      />

      {/* System Health */}
      <KPIWidget
        title="System Health"
        value={`${kpis.systemHealth}%`}
        icon={Activity}
        status={kpis.systemHealth >= 99 ? "success" : kpis.systemHealth >= 95 ? "warning" : "danger"}
        subtitle="API uptime"
        action={{
          label: "Details",
          onClick: () => window.location.href = "/platform/system-health"
        }}
      />

      {/* Active Trials */}
      <KPIWidget
        title="Active Trials"
        value={kpis.trialsActive.toLocaleString()}
        icon={Calendar}
        trend={{
          value: 15.7,
          label: "vs last month",
          isPositive: true
        }}
        status="info"
      />

      {/* New This Month */}
      <KPIWidget
        title="New This Month"
        value={kpis.newThisMonth.toLocaleString()}
        icon={Users}
        subtitle="New schools"
        status="success"
        action={{
          label: "View All",
          onClick: () => window.location.href = "/platform/tenants?filter=new"
        }}
      />
    </div>
  );
}
