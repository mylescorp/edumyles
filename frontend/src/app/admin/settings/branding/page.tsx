"use client";

import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import { useAction, useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/hooks/useTenant";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

type ThemeInputs = {
  branding: { schoolName: string; logoUrl?: string; faviconUrl?: string };
  colors: { primary: string; accent?: string };
  typography: { font: string };
};

const emptyTheme: ThemeInputs = {
  branding: { schoolName: "" },
  colors: { primary: "#2E7D32", accent: "#C79639" },
  typography: { font: "Inter" },
};

export default function BrandingSettingsPage() {
  const { sessionToken, role } = useAuth();
  const { tenant } = useTenant();
  const canManage = role === "school_admin" && !!sessionToken;
  const versions = useQuery(api.tenantThemes.listVersions, canManage ? { sessionToken } : "skip") as
    | Array<{ version: number; inputs: ThemeInputs; updatedAt: number; updatedBy: string }>
    | undefined;
  const publish = useAction((api as any).tenantThemeActions.publishTenantTheme);
  const rollback = useAction((api as any).tenantThemeActions.rollbackTenantTheme);
  const latest = versions?.[0];
  const [draft, setDraft] = useState<ThemeInputs | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useMemo(() => draft ?? latest?.inputs ?? {
    ...emptyTheme,
    branding: { ...emptyTheme.branding, schoolName: tenant?.name ?? "" },
  }, [draft, latest?.inputs, tenant?.name]);

  const update = (section: "branding" | "colors" | "typography", key: string, value: string) => {
    setDraft((current) => {
      const base = current ?? form;
      return { ...base, [section]: { ...base[section], [key]: value } } as ThemeInputs;
    });
  };

  const save = async () => {
    if (!sessionToken) return;
    setBusy(true);
    try {
      const result = await publish({ sessionToken, inputs: form });
      setDraft(null);
      toast({ title: `Branding published as version ${result.version}` });
    } catch (error) {
      toast({ title: "Unable to publish branding", description: error instanceof Error ? error.message : "Review the fields and try again.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const restore = async (version: number) => {
    if (!sessionToken) return;
    setBusy(true);
    try {
      const result = await rollback({ sessionToken, version });
      setDraft(null);
      toast({ title: `Version ${version} restored as version ${result.version}` });
    } catch (error) {
      toast({ title: "Unable to restore version", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally { setBusy(false); }
  };

  if (!canManage) return <main className="p-6 text-foreground">School administrator access is required to manage branding.</main>;

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <PageHeader title="School branding" description="Set your school name and brand colours. The design system derives accessible interface colours for every panel." />
      <Card>
        <CardHeader><CardTitle>Brand settings</CardTitle></CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="school-name">School name</Label><Input id="school-name" maxLength={80} value={form.branding.schoolName} onChange={(e) => update("branding", "schoolName", e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="school-font">Interface font</Label><select id="school-font" className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground" value={form.typography.font} onChange={(e) => update("typography", "font", e.target.value)}><option>Inter</option><option>Source Sans 3</option><option>Noto Sans</option><option>Nunito Sans</option></select></div>
          <div className="space-y-2"><Label htmlFor="brand-primary">Primary brand colour</Label><div className="flex gap-2"><Input id="brand-primary" type="color" value={form.colors.primary} onChange={(e) => update("colors", "primary", e.target.value)} className="w-16 p-1" /><Input aria-label="Primary colour hex value" value={form.colors.primary} pattern="#[0-9A-Fa-f]{6}" onChange={(e) => update("colors", "primary", e.target.value)} /></div></div>
          <div className="space-y-2"><Label htmlFor="brand-accent">Accent brand colour</Label><div className="flex gap-2"><Input id="brand-accent" type="color" value={form.colors.accent ?? form.colors.primary} onChange={(e) => update("colors", "accent", e.target.value)} className="w-16 p-1" /><Input aria-label="Accent colour hex value" value={form.colors.accent ?? ""} pattern="#[0-9A-Fa-f]{6}" placeholder="Use primary" onChange={(e) => update("colors", "accent", e.target.value)} /></div></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="brand-logo">Logo URL</Label><Input id="brand-logo" type="url" placeholder="https://… or /brand/logo.svg" value={form.branding.logoUrl ?? ""} onChange={(e) => update("branding", "logoUrl", e.target.value)} /></div>
          <div className="space-y-2 sm:col-span-2"><Label htmlFor="brand-favicon">Favicon URL</Label><Input id="brand-favicon" type="url" placeholder="https://… or /brand/favicon.png" value={form.branding.faviconUrl ?? ""} onChange={(e) => update("branding", "faviconUrl", e.target.value)} /></div>
          <div className="flex items-center gap-3 sm:col-span-2"><Button onClick={save} disabled={busy || !form.branding.schoolName.trim() || !/^#[\da-f]{6}$/i.test(form.colors.primary)}>{busy ? "Saving…" : "Publish branding"}</Button><span className="text-sm text-muted-foreground">Publishing checks colour contrast and creates an audit record.</span></div>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Published versions</CardTitle></CardHeader><CardContent className="space-y-3">{versions?.length ? versions.map((item) => <div key={item.version} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"><div><p className="font-medium text-foreground">Version {item.version}</p><p className="text-sm text-muted-foreground">{new Date(item.updatedAt * 1000).toLocaleString()}</p></div>{item.version !== latest?.version && <Button variant="outline" size="sm" disabled={busy} onClick={() => restore(item.version)}>Restore</Button>}</div>) : <p className="text-sm text-muted-foreground">No published versions yet.</p>}</CardContent></Card>
    </main>
  );
}
