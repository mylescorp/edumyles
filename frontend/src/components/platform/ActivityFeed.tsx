"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Building2, 
  DollarSign, 
  MessageSquare, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  TrendingUp, 
  LogOut,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  Shield,
  Clock
} from "lucide-react";
import { formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";

// Event type configuration following EduMyles Design System v3
const EVENT_TYPES = {
  school: {
    icon: Building2,
    color: "bg-em-success-bg text-em-success border-em-success",
    label: "School",
    bgColor: "bg-em-success/10"
  },
  payment: {
    icon: DollarSign,
    color: "bg-em-accent-bg text-em-accent-dark border-em-accent",
    label: "Payment",
    bgColor: "bg-em-accent/10"
  },
  ticket: {
    icon: MessageSquare,
    color: "bg-em-info-bg text-em-info border-em-info",
    label: "Ticket",
    bgColor: "bg-em-info/10"
  },
  done: {
    icon: CheckCircle,
    color: "bg-em-success-bg text-em-success border-em-success",
    label: "Completed",
    bgColor: "bg-em-success/10"
  },
  alert: {
    icon: AlertTriangle,
    color: "bg-em-danger-bg text-em-danger border-em-danger",
    label: "Alert",
    bgColor: "bg-em-danger/10"
  },
  red: {
    icon: X,
    color: "bg-em-danger-bg text-em-danger border-em-danger",
    label: "Critical",
    bgColor: "bg-em-danger/10"
  },
  up: {
    icon: TrendingUp,
    color: "bg-em-success-bg text-em-success border-em-success",
    label: "Growth",
    bgColor: "bg-em-success/10"
  },
  exit: {
    icon: LogOut,
    color: "bg-em-warning-bg text-em-accent-dark border-em-warning",
    label: "Exit",
    bgColor: "bg-em-warning/10"
  },
  user: {
    icon: Users,
    color: "bg-em-info-bg text-em-info border-em-info",
    label: "User",
    bgColor: "bg-em-info/10"
  },
  billing: {
    icon: CreditCard,
    color: "bg-em-accent-bg text-em-accent-dark border-em-accent",
    label: "Billing",
    bgColor: "bg-em-accent/10"
  },
  document: {
    icon: FileText,
    color: "bg-em-primary-bg text-em-primary border-em-primary",
    label: "Document",
    bgColor: "bg-em-primary/10"
  },
  system: {
    icon: Settings,
    color: "bg-em-text-secondary bg-opacity-10 text-em-text-secondary border-em-text-secondary",
    label: "System",
    bgColor: "bg-em-text-secondary/5"
  },
  security: {
    icon: Shield,
    color: "bg-em-danger-bg text-em-danger border-em-danger",
    label: "Security",
    bgColor: "bg-em-danger/10"
  },
  scheduled: {
    icon: Calendar,
    color: "bg-em-info-bg text-em-info border-em-info",
    label: "Scheduled",
    bgColor: "bg-em-info/10"
  }
} as const;

interface ActivityEvent {
  _id: string;
  action: string;
  tenantId: string;
  tenantName: string;
  timestamp: number;
  userId?: string;
  entityType?: string;
  eventType: keyof typeof EVENT_TYPES;
  icon: string;
  metadata?: Record<string, any>;
}

interface ActivityFeedProps {
  events: ActivityEvent[];
  isLoading?: boolean;
  limit?: number;
  showViewAll?: boolean;
  className?: string;
}

function getEventIcon(eventType: string) {
  const config = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES];
  return config?.icon || Clock;
}

function getEventColor(eventType: string) {
  const config = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES];
  return config?.color || "bg-muted text-muted-foreground";
}

function getEventLabel(eventType: string) {
  const config = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES];
  return config?.label || "Unknown";
}

function getEventBgColor(eventType: string) {
  const config = EVENT_TYPES[eventType as keyof typeof EVENT_TYPES];
  return config?.bgColor || "bg-muted";
}

function getActionDescription(action: string, tenantName: string) {
  // Parse action to create human-readable description
  if (action.includes("created") && action.includes("tenant")) {
    return `New school "${tenantName}" was created`;
  }
  if (action.includes("suspended") && action.includes("tenant")) {
    return `School "${tenantName}" was suspended`;
  }
  if (action.includes("payment") && action.includes("received")) {
    return `Payment received from "${tenantName}"`;
  }
  if (action.includes("payment") && action.includes("failed")) {
    return `Payment failed for "${tenantName}"`;
  }
  if (action.includes("ticket") && action.includes("created")) {
    return `New support ticket from "${tenantName}"`;
  }
  if (action.includes("ticket") && action.includes("resolved")) {
    return `Support ticket resolved for "${tenantName}"`;
  }
  if (action.includes("user") && action.includes("created")) {
    return `New user added to "${tenantName}"`;
  }
  if (action.includes("user") && action.includes("suspended")) {
    return `User suspended in "${tenantName}"`;
  }
  if (action.includes("module") && action.includes("installed")) {
    return `Module installed for "${tenantName}"`;
  }
  if (action.includes("billing") && action.includes("invoice")) {
    return `Invoice generated for "${tenantName}"`;
  }
  if (action.includes("trial") && action.includes("expired")) {
    return `Trial expired for "${tenantName}"`;
  }
  if (action.includes("trial") && action.includes("started")) {
    return `Trial started for "${tenantName}"`;
  }
  if (action.includes("impersonation") && action.includes("started")) {
    return `Impersonation session started for "${tenantName}"`;
  }
  if (action.includes("impersonation") && action.includes("ended")) {
    return `Impersonation session ended for "${tenantName}"`;
  }
  
  // Default fallback
  return `${action} for "${tenantName}"`;
}

function getAvatarFallback(tenantName: string) {
  const words = tenantName.split(' ');
  if (words.length >= 2) {
    return (words[0]?.[0] ?? "") + (words[words.length - 1]?.[0] ?? "");
  }
  return tenantName.substring(0, 2).toUpperCase();
}

export function ActivityFeed({ events, isLoading, limit = 20, showViewAll = true, className }: ActivityFeedProps) {
  const displayEvents = events.slice(0, limit);

  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-em-text-secondary animate-pulse" />
            <span className="text-em-text-secondary">Recent Activity</span>
            <Badge variant="secondary" className="text-xs bg-em-bg-muted">
              Loading...
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 rounded-lg bg-em-bg-muted animate-pulse">
                <div className="h-8 w-8 rounded-full bg-em-border" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-em-border rounded w-3/4" />
                  <div className="h-3 bg-em-border rounded w-1/2" />
                </div>
                <div className="h-6 w-16 bg-em-border rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-em-primary" />
            <span>Recent Activity</span>
            <Badge variant="secondary" className="text-xs bg-em-bg-muted text-em-text-secondary">
              {events.length} events
            </Badge>
          </CardTitle>
          {showViewAll && (
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-xs border-em-border hover:bg-em-bg-muted">
                <Clock className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="text-xs border-em-border hover:bg-em-bg-muted">
                View All
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-em-text-secondary mx-auto mb-4 opacity-50" />
            <p className="text-em-text-secondary mb-2">No recent activity</p>
            <p className="text-xs text-em-text-muted">Activity will appear here as events occur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayEvents.map((event, index) => {
              const Icon = getEventIcon(event.eventType);
              const eventColor = getEventColor(event.eventType);
              const eventBgColor = getEventBgColor(event.eventType);
              const eventLabel = getEventLabel(event.eventType);
              
              return (
                <div 
                  key={event._id} 
                  className={cn(
                    "flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm",
                    eventBgColor
                  )}
                >
                  {/* Event Icon */}
                  <div className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-full border",
                    eventColor
                  )}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-em-text-primary truncate">
                        {getActionDescription(event.action, event.tenantName)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs px-1.5 py-0.5",
                          eventColor
                        )}
                      >
                        {eventLabel}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-3 text-xs text-em-text-secondary">
                      <span className="flex items-center space-x-1">
                        <Building2 className="h-3 w-3" />
                        <span>{event.tenantName}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(event.timestamp)}</span>
                      </span>
                    </div>

                    {/* Metadata */}
                    {event.metadata && (
                      <div className="mt-2 text-xs text-em-text-muted">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Tenant Avatar */}
                  <div className="flex flex-col items-end space-y-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback className="text-xs bg-em-primary text-em-text-inverse">
                        {getAvatarFallback(event.tenantName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-em-text-muted">
                      {new Date(event.timestamp).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {showViewAll && events.length > limit && (
          <div className="mt-4 pt-4 border-t border-em-border">
            <Button variant="ghost" size="sm" className="w-full text-em-primary hover:bg-em-primary/10">
              View {events.length - limit} more events
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar widgets
export function CompactActivityFeed({ events, isLoading, limit = 5 }: { events: ActivityEvent[]; isLoading?: boolean; limit?: number }) {
  const displayEvents = events.slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(limit)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2 p-2 rounded animate-pulse">
            <div className="h-6 w-6 rounded-full bg-em-border" />
            <div className="flex-1 h-3 bg-em-border rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayEvents.map((event) => {
        const Icon = getEventIcon(event.eventType);
        const eventColor = getEventColor(event.eventType);
        
        return (
          <div key={event._id} className="flex items-center space-x-2 p-2 rounded hover:bg-em-bg-muted transition-colors">
            <div className={cn(
              "flex items-center justify-center h-6 w-6 rounded-full border",
              eventColor
            )}>
              <Icon className="h-3 w-3" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-em-text-primary truncate">
                {getActionDescription(event.action, event.tenantName)}
              </p>
              <p className="text-xs text-em-text-muted">
                {formatRelativeTime(event.timestamp)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
