"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, Shield, Eye, EyeOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionPreviewPanelProps {
  role: string;
  addedPermissions?: string[];
  removedPermissions?: string[];
  rolePermissions?: string[];
  className?: string;
}

const PERMISSION_CATEGORIES = {
  "Tenant Management": [
    "tenants.view", "tenants.view_details", "tenants.create", "tenants.edit",
    "tenants.suspend", "tenants.unsuspend", "tenants.delete", "tenants.impersonate",
    "tenants.export", "tenants.view_finance", "tenants.manage_finance", "tenants.manage_subscription",
    "tenants.manage_modules", "tenants.manage_users", "tenants.manage_settings",
    "tenants.manage_pilot_grants", "tenants.grant_permanent_free", "tenants.set_custom_pricing", "tenants.gdpr_export"
  ],
  "Platform Users": [
    "platform_users.view", "platform_users.invite", "platform_users.edit_role",
    "platform_users.edit_permissions", "platform_users.suspend", "platform_users.delete",
    "platform_users.view_activity"
  ],
  "Marketplace": [
    "marketplace.view", "marketplace.review_modules", "marketplace.suspend_module",
    "marketplace.ban_module", "marketplace.feature_module", "marketplace.override_price",
    "marketplace.manage_flags", "marketplace.manage_reviews", "marketplace.manage_pilot_grants",
    "marketplace.bulk_pilot_grants", "marketplace.manage_pricing"
  ],
  "Publishers": [
    "publishers.view", "publishers.approve", "publishers.reject", "publishers.suspend",
    "publishers.ban", "publishers.manage_revenue_share", "publishers.manage_tier",
    "publishers.process_payouts", "publishers.view_payouts"
  ],
  "Billing": [
    "billing.view_dashboard", "billing.view_invoices", "billing.manage_invoices",
    "billing.view_subscriptions", "billing.manage_subscriptions", "billing.view_reports",
    "billing.export_reports", "billing.manage_plans", "billing.view_publisher_payouts",
    "billing.process_payouts"
  ],
  "CRM": [
    "crm.view", "crm.create_lead", "crm.edit_lead", "crm.assign_lead", "crm.delete_lead",
    "crm.create_proposal", "crm.convert_to_tenant"
  ],
  "Communications": [
    "communications.view", "communications.send_broadcast", "communications.send_sms",
    "communications.manage_templates", "communications.view_logs", "communications.manage_announcements"
  ],
  "Knowledge Base": [
    "knowledge_base.view", "knowledge_base.create", "knowledge_base.edit",
    "knowledge_base.publish", "knowledge_base.delete"
  ],
  "Analytics": [
    "analytics.view_platform", "analytics.view_business", "analytics.export",
    "analytics.manage_reports"
  ],
  "Security": [
    "security.view_dashboard", "security.view_audit_log", "security.export_audit_log",
    "security.manage_api_keys", "security.manage_webhooks", "security.flag_audit_entries"
  ],
  "Settings": [
    "settings.view", "settings.edit_general", "settings.edit_email", "settings.edit_sms",
    "settings.edit_payments", "settings.edit_security", "settings.edit_integrations",
    "settings.maintenance_mode", "settings.manage_feature_flags", "settings.manage_sla"
  ],
  "Support": [
    "support.view", "support.assign", "support.reply", "support.close",
    "support.escalate", "support.view_internal_notes"
  ],
  "Onboarding": [
    "waitlist.view", "waitlist.invite", "waitlist.reject", "onboarding.view", "onboarding.manage"
  ],
  "Resellers": [
    "resellers.view", "resellers.approve", "resellers.reject", "resellers.manage_tier",
    "resellers.manage_commission", "resellers.suspend", "resellers.terminate",
    "resellers.process_payouts", "resellers.manage_materials", "resellers.manage_directory",
    "resellers.manage_tiers_config"
  ],
  "Staff Performance": [
    "staff_performance.view", "staff_performance.view_own", "staff_performance.add_notes"
  ],
  "Project Management": [
    "pm.view", "pm.create", "pm.manage"
  ]
};

const PERMISSION_LABELS: Record<string, string> = {
  "tenants.view": "View tenants",
  "tenants.view_details": "View tenant details",
  "tenants.create": "Create tenants",
  "tenants.edit": "Edit tenants",
  "tenants.suspend": "Suspend tenants",
  "tenants.unsuspend": "Unsuspend tenants",
  "tenants.delete": "Delete tenants",
  "tenants.impersonate": "Impersonate users",
  "tenants.export": "Export tenant data",
  "tenants.view_finance": "View tenant finance",
  "tenants.manage_finance": "Manage tenant finance",
  "tenants.manage_subscription": "Manage subscriptions",
  "tenants.manage_modules": "Manage modules",
  "tenants.manage_users": "Manage tenant users",
  "tenants.manage_settings": "Manage tenant settings",
  "tenants.manage_pilot_grants": "Manage pilot grants",
  "tenants.grant_permanent_free": "Grant permanent free",
  "tenants.set_custom_pricing": "Set custom pricing",
  "tenants.gdpr_export": "Trigger GDPR export",
  "platform_users.view": "View staff",
  "platform_users.invite": "Invite staff",
  "platform_users.edit_role": "Edit staff roles",
  "platform_users.edit_permissions": "Edit permission overrides",
  "platform_users.suspend": "Suspend staff",
  "platform_users.delete": "Delete staff",
  "platform_users.view_activity": "View staff activity",
  "marketplace.view": "View marketplace",
  "marketplace.review_modules": "Review modules",
  "marketplace.suspend_module": "Suspend modules",
  "marketplace.ban_module": "Ban modules",
  "marketplace.feature_module": "Feature modules",
  "marketplace.override_price": "Override module price",
  "marketplace.manage_flags": "Manage flags",
  "marketplace.manage_reviews": "Manage reviews",
  "marketplace.manage_pilot_grants": "Manage pilot grants",
  "marketplace.bulk_pilot_grants": "Bulk pilot grants",
  "marketplace.manage_pricing": "Manage pricing",
  "publishers.view": "View publishers",
  "publishers.approve": "Approve publishers",
  "publishers.reject": "Reject publishers",
  "publishers.suspend": "Suspend publishers",
  "publishers.ban": "Ban publishers",
  "publishers.manage_revenue_share": "Manage revenue share",
  "publishers.manage_tier": "Manage publisher tiers",
  "publishers.process_payouts": "Process payouts",
  "publishers.view_payouts": "View payout data",
  "billing.view_dashboard": "View billing dashboard",
  "billing.view_invoices": "View invoices",
  "billing.manage_invoices": "Manage invoices",
  "billing.view_subscriptions": "View subscriptions",
  "billing.manage_subscriptions": "Manage subscriptions",
  "billing.view_reports": "View billing reports",
  "billing.export_reports": "Export billing reports",
  "billing.manage_plans": "Manage plans",
  "billing.view_publisher_payouts": "View publisher payouts",
  "billing.process_payouts": "Process payouts",
  "crm.view": "View CRM",
  "crm.create_lead": "Create leads",
  "crm.edit_lead": "Edit leads",
  "crm.assign_lead": "Assign leads",
  "crm.delete_lead": "Delete leads",
  "crm.create_proposal": "Create proposals",
  "crm.convert_to_tenant": "Convert to tenants",
  "communications.view": "View communications",
  "communications.send_broadcast": "Send broadcasts",
  "communications.send_sms": "Send SMS",
  "communications.manage_templates": "Manage templates",
  "communications.view_logs": "View delivery logs",
  "communications.manage_announcements": "Manage announcements",
  "knowledge_base.view": "View knowledge base",
  "knowledge_base.create": "Create articles",
  "knowledge_base.edit": "Edit articles",
  "knowledge_base.publish": "Publish articles",
  "knowledge_base.delete": "Delete articles",
  "analytics.view_platform": "View platform analytics",
  "analytics.view_business": "View business analytics",
  "analytics.export": "Export analytics",
  "analytics.manage_reports": "Manage reports",
  "security.view_dashboard": "View security dashboard",
  "security.view_audit_log": "View audit log",
  "security.export_audit_log": "Export audit log",
  "security.manage_api_keys": "Manage API keys",
  "security.manage_webhooks": "Manage webhooks",
  "security.flag_audit_entries": "Flag audit entries",
  "settings.view": "View settings",
  "settings.edit_general": "Edit general settings",
  "settings.edit_email": "Edit email settings",
  "settings.edit_sms": "Edit SMS settings",
  "settings.edit_payments": "Edit payment settings",
  "settings.edit_security": "Edit security settings",
  "settings.edit_integrations": "Edit integrations",
  "settings.maintenance_mode": "Toggle maintenance mode",
  "settings.manage_feature_flags": "Manage feature flags",
  "settings.manage_sla": "Manage SLA settings",
  "support.view": "View support tickets",
  "support.assign": "Assign tickets",
  "support.reply": "Reply to tickets",
  "support.close": "Close tickets",
  "support.escalate": "Escalate tickets",
  "support.view_internal_notes": "View internal notes",
  "waitlist.view": "View waitlist",
  "waitlist.invite": "Invite from waitlist",
  "waitlist.reject": "Reject waitlist entries",
  "onboarding.view": "View onboarding",
  "onboarding.manage": "Manage onboarding",
  "resellers.view": "View resellers",
  "resellers.approve": "Approve resellers",
  "resellers.reject": "Reject resellers",
  "resellers.manage_tier": "Manage reseller tiers",
  "resellers.manage_commission": "Manage commission",
  "resellers.suspend": "Suspend resellers",
  "resellers.terminate": "Terminate resellers",
  "resellers.process_payouts": "Process reseller payouts",
  "resellers.manage_materials": "Manage marketing materials",
  "resellers.manage_directory": "Manage directory listings",
  "resellers.manage_tiers_config": "Manage tier configuration",
  "staff_performance.view": "View staff performance",
  "staff_performance.view_own": "View own performance",
  "staff_performance.add_notes": "Add evaluation notes",
  "pm.view": "View project management",
  "pm.create": "Create projects",
  "pm.manage": "Manage projects"
};

export function PermissionPreviewPanel({
  role,
  addedPermissions = [],
  removedPermissions = [],
  rolePermissions = [],
  className
}: PermissionPreviewPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showRemoved, setShowRemoved] = useState(false);

  // Calculate final permissions
  const finalPermissions = new Set(rolePermissions);
  
  // Add custom permissions
  addedPermissions.forEach(permission => {
    finalPermissions.add(permission);
  });
  
  // Remove permissions
  removedPermissions.forEach(permission => {
    finalPermissions.delete(permission);
  });

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getPermissionStatus = (permission: string) => {
    if (finalPermissions.has(permission)) {
      if (addedPermissions.includes(permission)) return 'added';
      if (rolePermissions.includes(permission)) return 'inherited';
      return 'granted';
    }
    if (removedPermissions.includes(permission)) return 'removed';
    return 'denied';
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Check className="h-3 w-3 text-green-600" />;
      case 'inherited':
        return <Shield className="h-3 w-3 text-blue-600" />;
      case 'granted':
        return <Eye className="h-3 w-3 text-green-600" />;
      case 'removed':
        return <X className="h-3 w-3 text-red-600" />;
      case 'denied':
        return <EyeOff className="h-3 w-3 text-gray-400" />;
      default:
        return null;
    }
  };

  const getPermissionVariant = (status: string) => {
    switch (status) {
      case 'added':
        return 'default';
      case 'inherited':
        return 'secondary';
      case 'granted':
        return 'default';
      case 'removed':
        return 'destructive';
      case 'denied':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const totalPermissions = Object.values(PERMISSION_CATEGORIES).flat().length;
  const grantedPermissions = finalPermissions.size;
  const deniedPermissions = totalPermissions - grantedPermissions;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permission Preview: {role}
        </CardTitle>
        <CardDescription>
          This user will have {grantedPermissions} of {totalPermissions} permissions
          {deniedPermissions > 0 && ` (${deniedPermissions} denied)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="bg-green-100 text-green-800">
            {grantedPermissions} Granted
          </Badge>
          {addedPermissions.length > 0 && (
            <Badge variant="default" className="bg-blue-100 text-blue-800">
              {addedPermissions.length} Added
            </Badge>
          )}
          {removedPermissions.length > 0 && (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              {removedPermissions.length} Removed
            </Badge>
          )}
          {deniedPermissions > 0 && (
            <Badge variant="outline" className="bg-gray-100 text-gray-800">
              {deniedPermissions} Denied
            </Badge>
          )}
        </div>

        {/* Toggle for showing removed permissions */}
        {(removedPermissions.length > 0 || deniedPermissions > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRemoved(!showRemoved)}
            className="w-full"
          >
            {showRemoved ? "Hide" : "Show"} Removed/Denied Permissions
          </Button>
        )}

        {/* Permission Categories */}
        <ScrollArea className="h-96">
          <div className="space-y-2">
            {Object.entries(PERMISSION_CATEGORIES).map(([category, permissions]) => {
              const categoryPermissions = permissions.filter(permission => {
                const status = getPermissionStatus(permission);
                return finalPermissions.has(permission) || (showRemoved && status === 'removed');
              });

              if (categoryPermissions.length === 0) return null;

              const isExpanded = expandedCategories.has(category);
              const grantedCount = categoryPermissions.filter(p => finalPermissions.has(p)).length;

              return (
                <div key={category}>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-2 h-auto"
                    onClick={() => toggleCategory(category)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-medium">{category}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {grantedCount}/{categoryPermissions.length}
                    </Badge>
                  </Button>
                  {isExpanded && (
                    <div className="space-y-1 p-2">
                      {categoryPermissions.map(permission => {
                        const status = getPermissionStatus(permission);
                        return (
                          <div key={permission} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                              {getPermissionIcon(status)}
                              <span className="text-sm">{PERMISSION_LABELS[permission] || permission}</span>
                            </div>
                            <Badge variant={getPermissionVariant(status) as any} className="text-xs">
                              {status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Separator className="my-2" />
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
