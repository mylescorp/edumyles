"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useMutation } from "convex/react";
import { usePlatformQuery } from "@/hooks/usePlatformQuery";
import { useAuth } from "@/hooks/useAuth";
import { api } from "../../../../convex/_generated/api";
import {
  Palette,
  Save,
  RotateCcw,
  Globe,
  Mail,
  Image,
  Type,
  Loader2,
} from "lucide-react";

export default function WhiteLabelPage() {
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

  const configs = usePlatformQuery(
    api.platform.whiteLabel.queries.listWhiteLabelConfigs,
    { sessionToken: sessionToken || "" },
    !!sessionToken
  );

  const updateConfig = useMutation(api.platform.whiteLabel.mutations.updateWhiteLabelConfig);
  const resetConfig = useMutation(api.platform.whiteLabel.mutations.resetToDefault);

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
    } catch (error) {
      console.error("Failed to save:", error);
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
    } catch (error) {
      console.error("Failed to reset:", error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="White-Label Configuration"
        description="Customize branding for each tenant"
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
                <Label>Tenant ID</Label>
                <Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="Enter tenant ID to configure" />
              </div>
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
                <Image className="h-5 w-5" /> Assets
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
                          setBrandName(c.brandName || "");
                          setPrimaryColor(c.primaryColor || "#3b82f6");
                          setSecondaryColor(c.secondaryColor || "#6366f1");
                          setAccentColor(c.accentColor || "#f59e0b");
                          setLogoUrl(c.logoUrl || "");
                          setFavicon(c.favicon || "");
                          setCustomDomain(c.customDomain || "");
                          setEmailFromName(c.emailFromName || "");
                          setEmailFromAddress(c.emailFromAddress || "");
                          setFooterText(c.footerText || "");
                          setCustomCSS(c.customCSS || "");
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
