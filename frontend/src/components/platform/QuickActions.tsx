"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  School,
  MessageSquare,
  Send,
  FileText,
  Users,
  Plus,
  ChevronRight,
  Sparkles,
  TrendingUp
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  href: string;
  badge?: string;
  onClick?: () => void;
}

const quickActions: QuickAction[] = [
  {
    id: "provision-school",
    title: "Provision New School",
    description: "Create and configure a new school tenant",
    icon: School,
    color: "text-em-success",
    bgColor: "bg-em-success-bg/10 hover:bg-em-success-bg/20",
    href: "/platform/tenants/create",
    badge: "New"
  },
  {
    id: "create-ticket",
    title: "Create Ticket",
    description: "Create a new support ticket",
    icon: MessageSquare,
    color: "text-em-info",
    bgColor: "bg-em-info-bg/10 hover:bg-em-info-bg/20",
    href: "/platform/tickets/create",
  },
  {
    id: "send-broadcast",
    title: "Send Broadcast",
    description: "Send message to multiple tenants",
    icon: Send,
    color: "text-em-accent-dark",
    bgColor: "bg-em-accent-bg/10 hover:bg-em-accent-bg/20",
    href: "/platform/communications/broadcast",
  },
  {
    id: "create-invoice",
    title: "Create Invoice",
    description: "Generate billing invoice",
    icon: FileText,
    color: "text-em-warning",
    bgColor: "bg-em-warning-bg/10 hover:bg-em-warning-bg/20",
    href: "/platform/billing/invoices/create",
  },
  {
    id: "add-lead",
    title: "Add Lead",
    description: "Add new CRM lead",
    icon: Users,
    color: "text-em-danger",
    bgColor: "bg-em-danger-bg/10 hover:bg-em-danger-bg/20",
    href: "/platform/crm/leads/create",
    badge: "CRM"
  },
];

interface QuickActionsProps {
  className?: string;
  variant?: "grid" | "list";
  showHeader?: boolean;
}

export function QuickActions({ 
  className = "", 
  variant = "grid",
  showHeader = true 
}: QuickActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Debug logging
  console.log("QuickActions rendering:", { variant, showHeader, quickActions: quickActions.length });

  const handleActionClick = async (action: QuickAction) => {
    setLoadingAction(action.id);
    
    try {
      if (action.onClick) {
        await action.onClick();
      } else {
        router.push(action.href);
      }
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  if (variant === "list") {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
        {showHeader && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Sparkles className="h-5 w-5 text-em-accent" />
              <span>Quick Actions</span>
              <Badge variant="secondary" className="text-xs">
                {quickActions.length} available
              </Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="ghost"
              className={`w-full justify-between h-auto p-4 ${action.bgColor} group`}
              onClick={() => handleActionClick(action)}
              disabled={loadingAction === action.id}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.bgColor}`}>
                  <action.icon className={`h-4 w-4 ${action.color}`} />
                </div>
                <div className="text-left">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{action.title}</span>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {action.description}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Button>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
      {showHeader && (
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-em-accent" />
              <span>Quick Actions</span>
              <Badge variant="secondary" className="text-xs">
                {quickActions.length} available
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Most used</span>
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`h-auto p-4 flex-col space-y-3 border-border/50 hover:border-border ${action.bgColor} group relative overflow-hidden`}
              onClick={() => handleActionClick(action)}
              disabled={loadingAction === action.id}
            >
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {/* Badge */}
              {action.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 right-2 text-xs px-2 py-0.5 h-5"
                >
                  {action.badge}
                </Badge>
              )}
              
              {/* Icon */}
              <div className={`p-3 rounded-xl ${action.bgColor} group-hover:scale-110 transition-transform`}>
                <action.icon className={`h-6 w-6 ${action.color}`} />
              </div>
              
              {/* Content */}
              <div className="flex-1 text-center space-y-1">
                <h3 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-tight">
                  {action.description}
                </p>
              </div>
              
              {/* Loading indicator */}
              {loadingAction === action.id && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                  <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}
              
              {/* Hover effect */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-accent/50 transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Button>
          ))}
        </div>
        
        {/* Quick stats */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Quick access to common platform operations</span>
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-em-success rounded-full animate-pulse" />
              <span>All systems operational</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar or small spaces
export function CompactQuickActions({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleActionClick = async (action: QuickAction) => {
    setLoadingAction(action.id);
    
    try {
      router.push(action.href);
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {quickActions.slice(0, 3).map((action) => (
        <Button
          key={action.id}
          variant="ghost"
          size="sm"
          className={`w-full justify-start h-8 px-2 ${action.bgColor}`}
          onClick={() => handleActionClick(action)}
          disabled={loadingAction === action.id}
        >
          <action.icon className={`h-3 w-3 mr-2 ${action.color}`} />
          <span className="text-xs">{action.title}</span>
          {action.badge && (
            <Badge variant="secondary" className="ml-auto text-xs px-1 py-0 h-4">
              {action.badge}
            </Badge>
          )}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start h-8 px-2 text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/platform/quick-actions")}
      >
        <Plus className="h-3 w-3 mr-2" />
        <span className="text-xs">View all actions</span>
      </Button>
    </div>
  );
}
