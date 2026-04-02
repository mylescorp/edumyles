"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Settings,
  Maximize2,
  Minimize2,
  X,
  GripVertical,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Widget {
  id: string;
  title: string;
  type: "chart" | "stats" | "list" | "table";
  size: "small" | "medium" | "large";
  content: React.ReactNode;
  isMinimized?: boolean;
}

interface AdminWidgetGridProps {
  widgets?: Widget[];
  onAddWidget?: () => void;
  onRemoveWidget?: (id: string) => void;
  onToggleMinimize?: (id: string) => void;
  onResizeWidget?: (id: string, size: "small" | "medium" | "large") => void;
}

export function AdminWidgetGrid({
  widgets = [],
  onAddWidget,
  onRemoveWidget,
  onToggleMinimize,
  onResizeWidget
}: AdminWidgetGridProps) {
  const [isDragging, setIsDragging] = useState<string | null>(null);

  const getSizeClasses = (size: "small" | "medium" | "large") => {
    switch (size) {
      case "small":
        return "col-span-1 row-span-1";
      case "medium":
        return "col-span-2 row-span-2";
      case "large":
        return "col-span-3 row-span-2";
      default:
        return "col-span-1 row-span-1";
    }
  };

  const emptyStateWidgets: Widget[] = [
    {
      id: "empty1",
      title: "Students Overview",
      type: "stats" as const,
      size: "medium" as const,
      content: (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Student statistics</p>
          </div>
        </div>
      )
    },
    {
      id: "empty2", 
      title: "Revenue",
      type: "chart" as const,
      size: "small" as const,
      content: (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <DollarSign className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Financial data</p>
          </div>
        </div>
      )
    },
    {
      id: "empty3",
      title: "Recent Activity",
      type: "list" as const,
      size: "medium" as const,
      content: (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Activity log</p>
          </div>
        </div>
      )
    },
    {
      id: "empty4",
      title: "Upcoming Events",
      type: "list" as const,
      size: "small" as const,
      content: (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Calendar events</p>
          </div>
        </div>
      )
    }
  ];

  const displayWidgets = widgets.length > 0 ? widgets : emptyStateWidgets;

  return (
    <div className="space-y-4">
      {/* Widget grid */}
      <div className="grid grid-cols-4 gap-4 min-h-[400px]">
        {displayWidgets.map((widget) => (
          <Card
            key={widget.id}
            className={cn(
              "relative transition-all duration-200 hover:shadow-md",
              getSizeClasses(widget.size),
              isDragging === widget.id && "opacity-50 scale-95"
            )}
          >
            {/* Widget header */}
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Drag handle */}
                  <div
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={() => setIsDragging(widget.id)}
                    onMouseUp={() => setIsDragging(null)}
                  >
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                </div>
                
                {/* Widget actions */}
                <div className="flex items-center gap-1">
                  {/* Minimize/Maximize */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100"
                    onClick={() => onToggleMinimize?.(widget.id)}
                  >
                    {widget.isMinimized ? (
                      <Maximize2 className="h-3 w-3" />
                    ) : (
                      <Minimize2 className="h-3 w-3" />
                    )}
                  </Button>

                  {/* Remove widget */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                    onClick={() => onRemoveWidget?.(widget.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {/* Widget content */}
            <CardContent className={cn(
              "transition-all duration-200",
              widget.isMinimized ? "h-0 overflow-hidden opacity-0" : "opacity-100"
            )}>
              {widget.content}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty state with Add Widget button */}
      {widgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
                <div className="w-8 h-8 border-2 border-dashed border-gray-300 rounded"></div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your dashboard is empty</h3>
            <p className="text-gray-500 mb-4">Add widgets to get started with your personalized dashboard</p>
            <Button
              onClick={onAddWidget}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
