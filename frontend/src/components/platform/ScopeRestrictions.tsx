"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Globe, 
  MapPin, 
  CreditCard, 
  Building2, 
  Shield, 
  Plus, 
  X, 
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

interface ScopeRestrictionsProps {
  userId?: string;
  onSave?: () => void;
  onCancel?: () => void;
}

const COUNTRIES = [
  { code: "KE", name: "Kenya" },
  { code: "UG", name: "Uganda" },
  { code: "TZ", name: "Tanzania" },
  { code: "RW", name: "Rwanda" },
  { code: "BI", name: "Burundi" },
  { code: "SS", name: "South Sudan" },
  { code: "ET", name: "Ethiopia" },
  { code: "SO", name: "Somalia" },
  { code: "DJ", name: "Djibouti" },
  { code: "ER", name: "Eritrea" },
];

const PLANS = [
  { id: "free", name: "Free Plan" },
  { id: "basic", name: "Basic Plan" },
  { id: "premium", name: "Premium Plan" },
  { id: "enterprise", name: "Enterprise Plan" },
];

export function ScopeRestrictions({ userId, onSave, onCancel }: ScopeRestrictionsProps) {
  const { sessionToken } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  // Query current user scope restrictions
  const { data: userScopes, isLoading, refetch } = useQuery(
    api.modules.platform.rbac.getUserScopeRestrictions,
    { sessionToken: sessionToken || "", userId: userId },
    !!sessionToken && !!userId
  );

  // Query available tenants for scope selection
  const { data: availableTenants } = useQuery(
    api.modules.platform.tenants.listTenants,
    { sessionToken: sessionToken || "", limit: 100 },
    !!sessionToken
  );

  // Mutation to update scope restrictions
  const updateScopeRestrictions = useMutation(api.modules.platform.rbac.updateUserScopeRestrictions);

  // Form state
  const [scopeCountries, setScopeCountries] = useState<string[]>([]);
  const [scopeTenantIds, setScopeTenantIds] = useState<string[]>([]);
  const [scopePlans, setScopePlans] = useState<string[]>([]);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string>("");
  const [scopeReason, setScopeReason] = useState<string>("");

  // Initialize form from user scopes
  useState(() => {
    if (userScopes) {
      setScopeCountries(userScopes.scopeCountries || []);
      setScopeTenantIds(userScopes.scopeTenantIds || []);
      setScopePlans(userScopes.scopePlans || []);
      if (userScopes.accessExpiresAt) {
        setAccessExpiresAt(new Date(userScopes.accessExpiresAt).toISOString().split('T')[0]);
      }
    }
  });

  const handleCountryToggle = (countryCode: string) => {
    setScopeCountries(prev => 
      prev.includes(countryCode) 
        ? prev.filter(c => c !== countryCode)
        : [...prev, countryCode]
    );
  };

  const handleTenantToggle = (tenantId: string) => {
    setScopeTenantIds(prev => 
      prev.includes(tenantId) 
        ? prev.filter(t => t !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handlePlanToggle = (planId: string) => {
    setScopePlans(prev => 
      prev.includes(planId) 
        ? prev.filter(p => p !== planId)
        : [...prev, planId]
    );
  };

  const handleSave = async () => {
    if (!sessionToken || !userId) return;

    setIsSaving(true);
    try {
      await updateScopeRestrictions({
        sessionToken,
        userId,
        scopeCountries,
        scopeTenantIds,
        scopePlans,
        accessExpiresAt: accessExpiresAt ? new Date(accessExpiresAt).getTime() : undefined,
        reason: scopeReason || undefined,
      });

      toast.success("Scope restrictions updated successfully");
      onSave?.();
      refetch();
    } catch (error) {
      console.error("Failed to update scope restrictions:", error);
      toast.error("Failed to update scope restrictions");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scope Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasRestrictions = scopeCountries.length > 0 || scopeTenantIds.length > 0 || scopePlans.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Scope Restrictions
          </CardTitle>
          <CardDescription>
            Limit user access to specific countries, tenants, or plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {scopeCountries.length > 0 && (
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                {scopeCountries.length} Countries
              </Badge>
            )}
            {scopeTenantIds.length > 0 && (
              <Badge variant="outline">
                <Building2 className="h-3 w-3 mr-1" />
                {scopeTenantIds.length} Tenants
              </Badge>
            )}
            {scopePlans.length > 0 && (
              <Badge variant="outline">
                <CreditCard className="h-3 w-3 mr-1" />
                {scopePlans.length} Plans
              </Badge>
            )}
            {!hasRestrictions && (
              <Badge variant="secondary">No restrictions</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Geographic Scope
          </CardTitle>
          <CardDescription>
            Restrict access to specific countries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COUNTRIES.map((country) => (
                <div key={country.code} className="flex items-center space-x-2">
                  <Checkbox
                    id={`country-${country.code}`}
                    checked={scopeCountries.includes(country.code)}
                    onCheckedChange={() => handleCountryToggle(country.code)}
                  />
                  <Label htmlFor={`country-${country.code}`} className="text-sm">
                    {country.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Tenant Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Tenant Scope
          </CardTitle>
          <CardDescription>
            Restrict access to specific tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            <div className="space-y-2">
              {availableTenants?.map((tenant) => (
                <div key={tenant.tenantId} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tenant-${tenant.tenantId}`}
                    checked={scopeTenantIds.includes(tenant.tenantId)}
                    onCheckedChange={() => handleTenantToggle(tenant.tenantId)}
                  />
                  <Label htmlFor={`tenant-${tenant.tenantId}`} className="text-sm">
                    {tenant.name} ({tenant.tenantId})
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Plan Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Plan Scope
          </CardTitle>
          <CardDescription>
            Restrict access to tenants on specific plans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {PLANS.map((plan) => (
              <div key={plan.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`plan-${plan.id}`}
                  checked={scopePlans.includes(plan.id)}
                  onCheckedChange={() => handlePlanToggle(plan.id)}
                />
                <Label htmlFor={`plan-${plan.id}`} className="text-sm">
                  {plan.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Time-based Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Time-based Access
          </CardTitle>
          <CardDescription>
            Set an expiration date for access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="access-expires">Access Expires (Optional)</Label>
              <Input
                id="access-expires"
                type="date"
                value={accessExpiresAt}
                onChange={(e) => setAccessExpiresAt(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="scope-reason">Reason for Restrictions</Label>
              <Textarea
                id="scope-reason"
                placeholder="Optional reason for these scope restrictions"
                value={scopeReason}
                onChange={(e) => setScopeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      {hasRestrictions && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            These restrictions will limit the user's access to only the selected countries, tenants, and plans. 
            The user will not be able to access resources outside these scopes.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Restrictions
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
