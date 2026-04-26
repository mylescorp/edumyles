"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Plus,
  ChevronRight,
  Sparkles,
  TrendingUp
} from "lucide-react";

export interface QuickAction {
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

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
  variant?: "grid" | "list";
  showHeader?: boolean;
}

export function QuickActions({ 
  actions,
  className = "", 
  variant = "grid",
  showHeader = true 
}: QuickActionsProps) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

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
              <Sparkles className="h-5 w-5 text-[var(--platform-accent)]" />
              <span>Quick Actions</span>
              <Badge variant="secondary" className="text-xs">
                {actions.length} available
              </Badge>
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-2">
          {actions.map((action) => (
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
              <Sparkles className="h-5 w-5 text-[var(--platform-accent)]" />
              <span>Quick Actions</span>
              <Badge variant="secondary" className="text-xs">
                {actions.length} available
              </Badge>
            </div>
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Most used</span>
            </div>
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="space-y-2.5 px-4 pb-4 pt-0">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outline"
              className={`relative h-auto min-h-[58px] justify-start overflow-hidden border-border/50 px-3 py-2 text-left hover:border-border ${action.bgColor} group`}
              onClick={() => handleActionClick(action)}
              disabled={loadingAction === action.id}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-background/20 opacity-0 group-hover:opacity-100 transition-opacity" />

              {action.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute right-2 top-2 h-5 px-1.5 py-0 text-[10px]"
                >
                  {action.badge}
                </Badge>
              )}

              <div className="relative z-10 flex w-full items-start gap-2.5">
                <div className={`shrink-0 rounded-md p-1.5 ${action.bgColor} transition-transform group-hover:scale-105`}>
                  <action.icon className={`h-3.5 w-3.5 ${action.color}`} />
                </div>
                <div className="min-w-0 flex-1 pr-7">
                  <h3 className="line-clamp-1 text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                    {action.title}
                  </h3>
                  <p className="line-clamp-1 text-[11px] leading-tight text-muted-foreground">
                    {action.description}
                  </p>
                </div>
                <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
              </div>

              {loadingAction === action.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
              )}
            </Button>
          ))}
        </div>

        <div className="border-t border-border/50 pt-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Common platform actions</span>
            <span>Operational</span>
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
  const compactActions = actionsCatalog.slice(0, 3);

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
      {compactActions.map((action) => (
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

const actionsCatalog: QuickAction[] = [
  {
    id: "create-tenant",
    title: "Create Tenant",
    description: "Start onboarding a new school tenant.",
    icon: Sparkles,
    color: "text-[var(--platform-accent)]",
    bgColor: "bg-[var(--platform-accent-soft)] hover:bg-[var(--platform-accent-soft)]",
    href: "/platform/tenants/create",
  },
  {
    id: "review-modules",
    title: "Review Modules",
    description: "Process marketplace submissions waiting for moderation.",
    icon: TrendingUp,
    color: "text-[var(--platform-accent)]",
    bgColor: "bg-[var(--platform-accent-soft)] hover:bg-[var(--platform-accent-soft)]",
    href: "/platform/marketplace/admin",
  },
  {
    id: "billing",
    title: "Billing",
    description: "Open platform billing and invoice operations.",
    icon: ChevronRight,
    color: "text-[var(--platform-highlight)]",
    bgColor: "bg-[var(--platform-highlight-soft)] hover:bg-[var(--platform-highlight-soft)]",
    href: "/platform/billing",
  },
];
