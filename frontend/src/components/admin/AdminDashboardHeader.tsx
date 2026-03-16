"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, Settings, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminDashboardHeaderProps {
  title?: string;
  subtitle?: string;
  showAddWidget?: boolean;
  onAddWidget?: () => void;
}

export function AdminDashboardHeader({
  title = "My Dashboard",
  subtitle = "Welcome back! Here's what's happening with your school today.",
  showAddWidget = true,
  onAddWidget
}: AdminDashboardHeaderProps) {
  return (
    <div className="mb-6">
      {/* Page title and subtitle */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
        <p className="text-gray-600 text-sm">{subtitle}</p>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* View options */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 bg-white shadow-sm"
            >
              <LayoutGrid className="h-3 w-3 mr-1" />
              Grid
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-3 hover:bg-gray-200"
            >
              List
            </Button>
          </div>

          {/* Filter button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 border-gray-300"
          >
            <Filter className="h-3 w-3 mr-1" />
            Filter
          </Button>

          {/* Status badges */}
          <Badge variant="secondary" className="text-xs">
            12 Active Widgets
          </Badge>
          <Badge variant="outline" className="text-xs border-green-200 text-green-700">
            Last updated: 2 mins ago
          </Badge>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Settings button */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 border-gray-300"
          >
            <Settings className="h-3 w-3 mr-1" />
            Customize
          </Button>

          {/* Add widget button */}
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
