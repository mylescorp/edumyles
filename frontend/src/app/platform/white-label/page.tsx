"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import {
  Save,
  RotateCcw,
  Globe,
  Image as ImageIcon,
  Type,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export default function WhiteLabelPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const [tenantId, setTenantId] = useState("");
  const [brandName, setBrandName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [logoUrl, setLogoUrl] = useState("");
  const [favicon, setFavicon] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [emailFromName, setEmailFromName] = useState("");
  const [emailFromAddress, setEmailFromAddress] = useState("");
  const [footerText, setFooterText] = useState("");
  const [customCSS, setCustomCSS] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, startRefreshing] = useTransition();

  const configs = usePlatformQuery(
    api.platform.whiteLabel.queries.listWhiteLabelConfigs,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );
  const tenants = usePlatformQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const updateConfig = useMutation(api.platform.whiteLabel.mutations.updateWhiteLabelConfig);
  const resetConfig = useMutation(api.platform.whiteLabel.mutations.resetToDefault);

  const selectedConfig = useMemo(
    () => configs?.find((config: any) => config.tenantId === tenantId) ?? null,
    [configs, tenantId]
  );

  useEffect(() => {
    if (!selectedConfig) return;
    setBrandName(selectedConfig.brandName || "");
    setPrimaryColor(selectedConfig.primaryColor || "#3b82f6");
    setSecondaryColor(selectedConfig.secondaryColor || "#6366f1");
    setAccentColor(selectedConfig.accentColor || "#f59e0b");
    setLogoUrl(selectedConfig.logoUrl || "");
    setFavicon(selectedConfig.favicon || "");
    setCustomDomain(selectedConfig.customDomain || "");
    setEmailFromName(selectedConfig.emailFromName || "");
    setEmailFromAddress(selectedConfig.emailFromAddress || "");
    setFooterText(selectedConfig.footerText || "");
    setCustomCSS(selectedConfig.customCSS || "");
  }, [selectedConfig]);

  const handleSave = async () => {
    if (!sessionToken || !tenantId) return;
    setIsSaving(true);
    try {
      await updateConfig({
        sessionToken,
        tenantId,
        brandName: brandName || undefined,
        primaryColor,
        secondaryColor,
        accentColor,
        logoUrl: logoUrl || undefined,
        favicon: favicon || undefined,
        customDomain: customDomain || undefined,
        emailFromName: emailFromName || undefined,
        emailFromAddress: emailFromAddress || undefined,
        footerText: footerText || undefined,
        customCSS: customCSS || undefined,
      });
      toast.success("White-label configuration saved.");
    } catch (error) {
      console.error("Failed to save:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!sessionToken || !tenantId) return;
    try {
      await resetConfig({ sessionToken, tenantId });
      setBrandName("");
      setPrimaryColor("#3b82f6");
      setSecondaryColor("#6366f1");
      setAccentColor("#f59e0b");
      setLogoUrl("");
      setFavicon("");
      setCustomDomain("");
      setEmailFromName("");
      setEmailFromAddress("");
      setFooterText("");
      setCustomCSS("");
      toast.success("White-label configuration reset.");
    } catch (error) {
      console.error("Failed to reset:", error);
      toast.error(error instanceof Error ? error.message : "Failed to reset configuration.");
    }
  };

  if (!sessionToken || configs === undefined || tenants === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="White-Label Configuration"
        description="Customize branding for each tenant"
        actions={
          <Button variant="outline" onClick={() => startRefreshing(() => router.refresh())} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5" /> Brand Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tenant</Label>
                <Select value={tenantId} onValueChange={setTenantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {(tenants ?? []).map((tenant: any) => (
                      <SelectItem key={tenant.tenantId} value={tenant.tenantId}>
                        {tenant.name} ({tenant.tenantId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tenants.length === 0 ? (
                <EmptyState
                  icon={Globe}
                  title="No tenants available"
                  description="Create a tenant first before configuring white-label branding."
                  className="py-6"
                />
              ) : null}
              <div className="space-y-2">
                <Label>Brand Name</Label>
                <Input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="School name or brand" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-10 rounded border cursor-pointer" />
                    <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" /> Assets
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <Label>Favicon URL</Label>
                <Input value={favicon} onChange={(e) => setFavicon(e.target.value)} placeholder="https://..." />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" /> Domain & Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Domain</Label>
                <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="school.example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email From Name</Label>
                  <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="School Name" />
                </div>
                <div className="space-y-2">
                  <Label>Email From Address</Label>
                  <Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} placeholder="noreply@school.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Footer Text</Label>
                <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} placeholder="© 2026 School Name" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customCSS}
                onChange={(e) => setCustomCSS(e.target.value)}
                placeholder=":root { --primary: #3b82f6; }"
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={!tenantId || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Configuration
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={!tenantId}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset to Default
            </Button>
          </div>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <div className="p-3" style={{ backgroundColor: primaryColor }}>
                  <p className="text-white font-bold text-sm">{brandName || "School Name"}</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="h-3 rounded" style={{ backgroundColor: secondaryColor, width: "60%" }} />
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="h-2 bg-gray-200 rounded w-3/4" />
                  <button className="px-3 py-1 rounded text-white text-xs" style={{ backgroundColor: accentColor }}>
                    Action
                  </button>
                </div>
                <div className="p-2 text-xs text-center text-muted-foreground border-t">
                  {footerText || "© 2026 School Name"}
                </div>
              </div>

              {configs && configs.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Configured Tenants</p>
                  <div className="space-y-1">
                    {configs.map((c: any) => (
                      <div key={c._id} className="text-xs p-2 border rounded flex items-center gap-2 cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setTenantId(c.tenantId);
                        }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.primaryColor || "#3b82f6" }} />
                        {c.brandName || c.tenantId}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
