"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Users, MessageSquare, FileText } from "lucide-react";

// EduMyles Design System v3 Chart Colors
const chartColors = {
  categorical: ['#16A34A', '#1E3A8A', '#F59E0B', '#7C3AED', '#0D9488', '#DC2626'],
  sequential:  ['#FEE2E2', '#FEF9C3', '#FDE68A', '#DCFCE7', '#16A34A'],
  grid: '#E2E8F0',
  axis: '#64748B',
  tooltip_bg: '#1E293B',
  tooltip_text: '#F1F5F9',
};

interface MRRChartProps {
  data: Array<{
    month: string;
    mrr: number;
    newTenants: number;
  }>;
  isLoading?: boolean;
}

export function MRRChart({ data, isLoading }: MRRChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-em-accent" />
            <span>MRR Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-em-bg-muted rounded-lg animate-pulse">
            <div className="text-em-text-secondary">Loading MRR data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trend
  const latestMRR = data[data.length - 1]?.mrr || 0;
  const previousMRR = data[data.length - 2]?.mrr || 0;
  const trend = latestMRR > previousMRR ? 'up' : latestMRR < previousMRR ? 'down' : 'stable';
  const trendPercentage = previousMRR > 0 ? Math.abs(((latestMRR - previousMRR) / previousMRR) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-em-accent" />
            <span>MRR Trend</span>
            <Badge variant="secondary" className="text-xs">
              Last 12 months
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {trend === 'up' && (
              <div className="flex items-center text-em-success text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                +{trendPercentage.toFixed(1)}%
              </div>
            )}
            {trend === 'down' && (
              <div className="flex items-center text-em-danger text-sm">
                <TrendingDown className="h-4 w-4 mr-1" />
                -{trendPercentage.toFixed(1)}%
              </div>
            )}
            <Button variant="outline" size="sm" className="text-xs">
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.categorical[0]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={chartColors.categorical[0]} stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis 
              dataKey="month" 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: chartColors.tooltip_bg,
                border: 'none',
                borderRadius: '8px',
                color: chartColors.tooltip_text,
                fontSize: '12px'
              }}
              formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'MRR']}
              labelFormatter={(label) => `Month: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="mrr" 
              stroke={chartColors.categorical[0]} 
              strokeWidth={2}
              fill="url(#mrrGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TenantGrowthChartProps {
  data: Array<{
    month: string;
    starter: number;
    growth: number;
    pro: number;
    enterprise: number;
    total: number;
  }>;
  isLoading?: boolean;
}

export function TenantGrowthChart({ data, isLoading }: TenantGrowthChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-em-info" />
            <span>Tenant Growth</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-em-bg-muted rounded-lg animate-pulse">
            <div className="text-em-text-secondary">Loading growth data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-em-info" />
            <span>Tenant Growth by Plan</span>
            <Badge variant="secondary" className="text-xs">
              Last 12 months
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" className="text-xs">
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis 
              dataKey="month" 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: chartColors.tooltip_bg,
                border: 'none',
                borderRadius: '8px',
                color: chartColors.tooltip_text,
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="circle"
            />
            <Bar dataKey="starter" stackId="a" fill={chartColors.categorical[3]} name="Starter" />
            <Bar dataKey="growth" stackId="a" fill={chartColors.categorical[1]} name="Growth" />
            <Bar dataKey="pro" stackId="a" fill={chartColors.categorical[0]} name="Pro" />
            <Bar dataKey="enterprise" stackId="a" fill={chartColors.categorical[2]} name="Enterprise" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface TicketVolumeChartProps {
  data: Array<{
    week: string;
    created: number;
    resolved: number;
  }>;
  isLoading?: boolean;
}

export function TicketVolumeChart({ data, isLoading }: TicketVolumeChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-em-warning" />
            <span>Ticket Volume</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-em-bg-muted rounded-lg animate-pulse">
            <div className="text-em-text-secondary">Loading ticket data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-em-warning" />
            <span>Support Ticket Volume</span>
            <Badge variant="secondary" className="text-xs">
              Last 8 weeks
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" className="text-xs">
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
            <XAxis 
              dataKey="week" 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={chartColors.axis}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: chartColors.tooltip_bg,
                border: 'none',
                borderRadius: '8px',
                color: chartColors.tooltip_text,
                fontSize: '12px'
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="created" 
              stroke={chartColors.categorical[2]} 
              strokeWidth={2}
              dot={{ fill: chartColors.categorical[2], r: 4 }}
              activeDot={{ r: 6 }}
              name="Created"
            />
            <Line 
              type="monotone" 
              dataKey="resolved" 
              stroke={chartColors.categorical[0]} 
              strokeWidth={2}
              dot={{ fill: chartColors.categorical[0], r: 4 }}
              activeDot={{ r: 6 }}
              name="Resolved"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface RevenueByPlanChartProps {
  data: Array<{
    plan: string;
    mrr: number;
    tenants: number;
  }>;
  isLoading?: boolean;
}

export function RevenueByPlanChart({ data, isLoading }: RevenueByPlanChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-em-primary" />
            <span>Revenue by Plan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-em-bg-muted rounded-lg animate-pulse">
            <div className="text-em-text-secondary">Loading revenue data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pieData = data.map(item => ({
    name: item.plan,
    value: item.mrr,
    tenants: item.tenants
  }));

  const COLORS = chartColors.categorical;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-em-bg-base p-3 rounded-lg shadow-lg border border-em-border">
          <p className="font-semibold text-em-text-primary">{data.name}</p>
          <p className="text-sm text-em-text-secondary">MRR: KES {data.value.toLocaleString()}</p>
          <p className="text-sm text-em-text-secondary">Tenants: {data.tenants}</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry: any) => {
    const percent = ((entry.value / data.reduce((sum, item) => sum + item.mrr, 0)) * 100).toFixed(1);
    return `${percent}%`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-em-primary" />
            <span>Revenue Distribution</span>
            <Badge variant="secondary" className="text-xs">
              Current MRR
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" className="text-xs">
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value, entry: any) => [
                `KES ${entry.payload.value.toLocaleString()}`,
                entry.payload.name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DashboardChartsProps {
  chartsData: {
    mrrTrend: Array<{ month: string; mrr: number; newTenants: number }>;
    tenantGrowth: Array<{ month: string; starter: number; growth: number; pro: number; enterprise: number; total: number }>;
    ticketVolume: Array<{ week: string; created: number; resolved: number }>;
    revenueByPlan: Array<{ plan: string; mrr: number; tenants: number }>;
  };
  isLoading?: boolean;
}

export function DashboardCharts({ chartsData, isLoading }: DashboardChartsProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <MRRChart data={chartsData.mrrTrend} isLoading={isLoading} />
        <TenantGrowthChart data={chartsData.tenantGrowth} isLoading={isLoading} />
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <TicketVolumeChart data={chartsData.ticketVolume} isLoading={isLoading} />
        <RevenueByPlanChart data={chartsData.revenueByPlan} isLoading={isLoading} />
      </div>
    </div>
  );
}
