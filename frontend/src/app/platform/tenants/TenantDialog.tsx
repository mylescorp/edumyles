"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Loader2 } from "lucide-react";

interface Tenant {
  _id: string;
  tenantId: string;
  name: string;
  subdomain: string;
  email: string;
  phone?: string;
  plan: string;
  status: string;
  county: string;
  country: string;
}

interface TenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionToken: string;
  tenant?: Tenant | null;
  mode: "create" | "edit";
  onSuccess?: () => void;
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "enterprise", label: "Enterprise" },
];

const STATUS_OPTIONS = [
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

const COUNTY_OPTIONS = [
  "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos",
  "Kajiado", "Uasin Gishu", "Meru", "Kilifi", "Murang'a", "Nyeri",
  "Kakamega", "Bungoma", "Kisii", "Siaya", "Migori", "Homa Bay",
  "Kericho", "Bomet", "Nandi", "Laikipia", "Samburu", "Trans Nzoia",
  "West Pokot", "Elgeyo-Marakwet", "Baringo", "Turkana", "Marsabit",
  "Isiolo", "Garissa", "Wajir", "Mandera", "Tana River", "Lamu",
  "Taita-Taveta", "Kwale", "Embu", "Tharaka-Nithi", "Kirinyaga",
  "Nyandarua", "Narok", "Nyamira", "Vihiga", "Busia"
];

const DEFAULT_FORM = {
  name: "",
  subdomain: "",
  email: "",
  phone: "",
  plan: "trial" as const,
  status: "trial" as const,
  county: "",
  country: "KE",
};

type FormData = {
  name: string;
  subdomain: string;
  email: string;
  phone: string;
  plan: string;
  status: string;
  county: string;
  country: string;
};

export function TenantDialog({
  open,
  onOpenChange,
  sessionToken,
  tenant,
  mode,
  onSuccess,
}: TenantDialogProps) {
  const [form, setForm] = useState<FormData>({ ...DEFAULT_FORM });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const createTenant = useMutation(api.platform.tenants.mutations.createTenant);
  const updateTenant = useMutation(api.platform.tenants.mutations.updateTenant);

  // Populate form when editing an existing tenant
  useEffect(() => {
    if (mode === "edit" && tenant) {
      setForm({
        name: tenant.name,
        subdomain: tenant.subdomain,
        email: tenant.email,
        phone: tenant.phone ?? "",
        plan: tenant.plan,
        status: tenant.status,
        county: tenant.county,
        country: tenant.country,
      });
    } else {
      setForm({ ...DEFAULT_FORM });
    }
    setErrors({});
    setServerError(null);
  }, [mode, tenant, open]);

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.name.trim()) newErrors.name = "School name is required";
    if (mode === "create" && !form.subdomain.trim()) newErrors.subdomain = "Subdomain is required";
    if (mode === "create" && !/^[a-z0-9-]+$/.test(form.subdomain)) {
      newErrors.subdomain = "Subdomain must be lowercase letters, numbers, or hyphens only";
    }
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!form.county.trim()) newErrors.county = "County is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      if (mode === "create") {
        await createTenant({
          sessionToken,
          name: form.name.trim(),
          subdomain: form.subdomain.trim().toLowerCase(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          plan: form.plan as "free" | "starter" | "growth" | "enterprise",
          county: form.county,
          country: form.country || "KE",
        });
      } else if (tenant) {
        await updateTenant({
          sessionToken,
          tenantId: tenant.tenantId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          plan: form.plan as "free" | "starter" | "growth" | "enterprise",
          status: form.status as "active" | "suspended" | "trial",
          county: form.county,
          country: form.country || "KE",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg: string = err?.message ?? "An unexpected error occurred";
      if (msg.includes("CONFLICT")) {
        setErrors((prev) => ({ ...prev, subdomain: "This subdomain is already taken" }));
      } else {
        setServerError(msg.replace(/^[A-Z_]+:\s*/, ""));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-em-primary" />
            {mode === "create" ? "Add New Tenant" : `Edit ${tenant?.name ?? "Tenant"}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* School Name */}
          <div className="space-y-1">
            <Label htmlFor="name">School Name <span className="text-destructive">*</span></Label>
            <Input
              id="name"
              placeholder="e.g. Sunshine Primary School"
              value={form.name}
              onChange={(e) => handleField("name", e.target.value)}
              className={errors.name ? "border-destructive" : ""}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Subdomain — only shown when creating */}
          {mode === "create" && (
            <div className="space-y-1">
              <Label htmlFor="subdomain">Subdomain <span className="text-destructive">*</span></Label>
              <div className="flex items-center gap-2">
                <Input
                  id="subdomain"
                  placeholder="sunshine"
                  value={form.subdomain}
                  onChange={(e) => handleField("subdomain", e.target.value.toLowerCase())}
                  className={errors.subdomain ? "border-destructive" : ""}
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">.edumyles.co.ke</span>
              </div>
              {errors.subdomain && <p className="text-xs text-destructive">{errors.subdomain}</p>}
            </div>
          )}

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@school.co.ke"
                value={form.email}
                onChange={(e) => handleField("email", e.target.value)}
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+254 7XX XXX XXX"
                value={form.phone}
                onChange={(e) => handleField("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Plan & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select value={form.plan} onValueChange={(v) => handleField("plan", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {mode === "edit" && (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => handleField("status", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* County & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>County <span className="text-destructive">*</span></Label>
              <Select value={form.county} onValueChange={(v) => handleField("county", v)}>
                <SelectTrigger className={errors.county ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {COUNTY_OPTIONS.map((county) => (
                    <SelectItem key={county} value={county.toLowerCase()}>{county}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.county && <p className="text-xs text-destructive">{errors.county}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                placeholder="KE"
                value={form.country}
                onChange={(e) => handleField("country", e.target.value.toUpperCase())}
                maxLength={2}
              />
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creating..." : "Saving..."}
                </>
              ) : (
                mode === "create" ? "Create Tenant" : "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
