"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface HeatmapData {
  day: string;
  hour: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  title: string;
}

export function HeatmapChart({ data, title }: HeatmapChartProps) {
  const getIntensity = (value: number) => {
    const max = Math.max(...data.map(d => d.value));
    const intensity = max > 0 ? value / max : 0;
    return Math.min(intensity, 1);
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'var(--color-surface-sunken)';
    if (intensity < 0.3) return 'var(--color-status-success-subtle)';
    if (intensity < 0.6) return 'var(--color-status-warning-subtle)';
    if (intensity < 0.8) return 'var(--color-status-warning-on-subtle)';
    return 'var(--color-status-danger-solid)';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-24 gap-1 text-xs">
          {data.map((day, index) => (
            <div key={index} className="space-y-1">
              <div className="text-center font-medium mb-1">{day.day}</div>
              <div className="grid grid-cols-24 gap-px">
                {Array.from({ length: 24 }, (_, hour) => {
                  const dayData = data.find(d => d.day === day.day);
                  const intensity = dayData ? getIntensity(dayData.value) : 0;
                  return (
                    <div
                      key={hour}
                      className="w-4 h-4 rounded-sm"
                      style={{
                        backgroundColor: getColor(intensity)
                      }}
                      title={`${day.day} ${hour}:00 - ${intensity > 0 ? Math.round(intensity * 100) : 0}%`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
