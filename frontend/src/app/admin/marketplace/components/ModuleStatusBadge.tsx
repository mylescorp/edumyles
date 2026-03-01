"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: "Active",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  inactive: {
    label: "Inactive",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  beta: {
    label: "Beta",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  deprecated: {
    label: "Deprecated",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  installed: {
    label: "Installed",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  not_installed: {
    label: "Not Installed",
    className: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

interface ModuleStatusBadgeProps {
  status: string;
  className?: string;
}

export function ModuleStatusBadge({ status, className }: ModuleStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className, className)}>
      {config.label}
    </Badge>
  );
}
