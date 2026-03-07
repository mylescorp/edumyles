"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, GraduationCap } from "lucide-react";

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

interface AdminChartsProps {
  admissionsData?: ChartData[];
  revenueData?: ChartData[];
  enrollmentData?: ChartData[];
}

export function AdminCharts({ 
  admissionsData = [], 
  revenueData = [], 
  enrollmentData = [] 
}: AdminChartsProps) {
  const renderSimpleBarChart = (data: ChartData[], title: string, icon: React.ComponentType<{ className?: string }>) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const Icon = icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-20 text-sm text-muted-foreground truncate">
                  {item.name}
                </div>
                <div className="flex-1">
                  <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-forest-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${(item.value / maxValue) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="w-12 text-right text-sm font-medium">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {renderSimpleBarChart(admissionsData, "Admissions Trend", GraduationCap)}
      {renderSimpleBarChart(revenueData, "Revenue Overview", DollarSign)}
      {renderSimpleBarChart(enrollmentData, "Enrollment Stats", Users)}
    </div>
  );
}
