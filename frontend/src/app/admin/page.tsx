"use client";

import { useState } from "react";
import { AdminDashboardHeader } from "@/components/admin/AdminDashboardHeader";
import { AdminWidgetGrid } from "@/components/admin/AdminWidgetGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  FileText,
  GraduationCap,
  UserCheck,
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const [widgets, setWidgets] = useState<any[]>([]);

  const handleAddWidget = () => {
    console.log("Adding widget...");
  };

  const handleRemoveWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const handleToggleMinimize = (id: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, isMinimized: !w.isMinimized } : w
    ));
  };

  // Quick stats cards
  const quickStats = [
    {
      title: "Total Students",
      value: "1,234",
      change: "+12%",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Revenue This Month",
      value: "$45,678",
      change: "+8%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Active Classes",
      value: "89",
      change: "+3%",
      icon: BookOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      title: "Pending Tasks",
      value: "23",
      change: "-5%",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <AdminDashboardHeader 
        title="My Dashboard"
        subtitle="Welcome back! Here's what's happening with your school today."
        showAddWidget={true}
        onAddWidget={handleAddWidget}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <span className={cn(
                        "text-sm font-medium",
                        stat.change.startsWith('+') ? "text-green-600" : "text-red-600"
                      )}>
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500">vs last month</span>
                    </div>
                  </div>
                  <div className={cn("p-3 rounded-lg", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Widget Grid */}
      <AdminWidgetGrid
        widgets={widgets}
        onAddWidget={handleAddWidget}
        onRemoveWidget={handleRemoveWidget}
        onToggleMinimize={handleToggleMinimize}
      />

      {/* Additional sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "New student enrollment", user: "John Doe", time: "2 hours ago", type: "success" },
                { action: "Payment received", user: "Jane Smith", time: "3 hours ago", type: "success" },
                { action: "Class schedule updated", user: "Admin", time: "5 hours ago", type: "info" },
                { action: "New support ticket", user: "Mike Johnson", time: "1 day ago", type: "warning" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.type === "success" ? "bg-green-500" :
                      activity.type === "warning" ? "bg-orange-500" : "bg-blue-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-xs text-gray-500">{activity.user} • {activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Parent-Teacher Meeting", date: "Tomorrow, 2:00 PM", type: "meeting" },
                { title: "School Holiday", date: "March 20, 2025", type: "holiday" },
                { title: "Exam Period Starts", date: "March 25, 2025", type: "exam" },
                { title: "Sports Day", date: "April 2, 2025", type: "event" },
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      event.type === "meeting" ? "bg-blue-500" :
                      event.type === "holiday" ? "bg-green-500" :
                      event.type === "exam" ? "bg-red-500" : "bg-purple-500"
                    )} />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">{event.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
