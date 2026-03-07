"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";

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
  enrollmentData = [],
}: AdminChartsProps) {
  const SimpleBarChart = ({ 
    data, 
    title, 
    icon: Icon 
  }: { 
    data: ChartData[]; 
    title: string; 
    icon: any;
  }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">{item.value.toLocaleString()}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color || "#056C40",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <SimpleBarChart
        data={admissionsData}
        title="Monthly Admissions"
        icon={Users}
      />
      <SimpleBarChart
        data={revenueData}
        title="Revenue Overview"
        icon={DollarSign}
      />
      <SimpleBarChart
        data={enrollmentData}
        title="Class Enrollment"
        icon={TrendingUp}
      />
    </div>
  );
}
