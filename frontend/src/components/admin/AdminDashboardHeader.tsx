"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, List, Settings, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminDashboardHeaderProps {
  title?: string;
  subtitle?: string;
  showAddWidget?: boolean;
  onAddWidget?: () => void;
  widgetCount?: number;
  onViewChange?: (view: "grid" | "list") => void;
  onFilter?: () => void;
  onCustomize?: () => void;
}

export function AdminDashboardHeader({
  title = "My Dashboard",
  subtitle = "Welcome back! Here's what's happening with your school today.",
  showAddWidget = true,
  onAddWidget,
  widgetCount,
  onViewChange,
  onFilter,
  onCustomize,
}: AdminDashboardHeaderProps) {
  const [view, setView] = useState<"grid" | "list">("grid");

  const handleViewChange = (v: "grid" | "list") => {
    setView(v);
    onViewChange?.(v);
  };

  return (
    <div className="mb-6">
      {/* Page title and subtitle */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewChange("grid")}
              className={cn("h-7 px-3", view === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200")}
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleViewChange("list")}
              className={cn("h-7 px-3", view === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200")}
            >
              <List className="h-3 w-3 mr-1" />
              List
            </Button>
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 border-gray-300"
            onClick={onFilter}
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>

          {/* Dynamic widget count badge */}
          {widgetCount !== undefined && (
            <Badge variant="secondary" className="text-xs">
              {widgetCount} Active Widget{widgetCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 border-gray-300"
            onClick={onCustomize}
          >
            <Settings className="h-3 w-3 mr-1" />
            Customize
          </Button>

          {showAddWidget && (
            <Button
              onClick={onAddWidget}
              className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Widget
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
