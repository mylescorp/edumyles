"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

interface DateRange {
  start: Date;
  end: Date;
}

interface AdvancedDateRangeProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function AdvancedDateRange({ value, onChange }: AdvancedDateRangeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(value.start);
  const [customEnd, setCustomEnd] = useState(value.end);

  const presets = [
    { label: 'Last 7 days', range: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start, end };
    }},
    { label: 'Last 30 days', range: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start, end };
    }},
    { label: 'Last 90 days', range: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { start, end };
    }},
    { label: 'Last year', range: () => {
      const end = new Date();
      const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
      return { start, end };
    }},
    { label: 'Custom', range: () => ({ start: customStart, end: customEnd }) }
  ];

  const handlePresetSelect = (preset: { label: string; range: () => DateRange }) => {
    const range = preset.range();
    onChange(range);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange({ start: customStart, end: customEnd });
      setIsOpen(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-2">
      {/* Current range display */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <div>
            <div className="text-sm font-medium">
              {formatDate(value.start)} - {formatDate(value.end)}
            </div>
            <div className="text-xs text-gray-500">
              ({Math.ceil((value.end.getTime() - value.start.getTime()) / (1000 * 60 * 60 * 24))} days)
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
        >
          Change Range
        </Button>
      </div>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.slice(0, -1).map((preset) => (
          <Button
            key={preset.label}
            variant="outline"
            size="sm"
            onClick={() => handlePresetSelect(preset)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Custom range modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Custom Date Range</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={customStart.toISOString().split('T')[0]}
                  onChange={(e) => setCustomStart(new Date(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={customEnd.toISOString().split('T')[0]}
                  onChange={(e) => setCustomEnd(new Date(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCustomApply}>
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
