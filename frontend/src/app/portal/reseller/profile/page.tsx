"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Award, Globe, Mail, MapPin, Phone, Save, Store, Wallet } from "lucide-react";

type ResellerProfile = {
  businessName: string;
  applicantType: "reseller" | "affiliate";
  website?: string;
  description: string;
  tier: "starter" | "silver" | "gold" | "platinum";
  status: "active" | "inactive" | "suspended";
  verifiedAt?: number;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    country: string;
  };
  commission: {
    rate: number;
    minPayout: number;
  };
  createdAt: number;
};

type ResellerStats = {
  schools: { total: number; active: number };
  commissions: { totalAmount: number };
  payouts: { totalAmount: number };
};

type ReferralCode = {
  referralCode: string;
  referralUrl: string;
};

export default function ResellerProfilePage() {
  const profile = useQuery(api.modules.reseller.mutations.profile.getMyProfile, {}) as
    | ResellerProfile
    | undefined;
  const stats = useQuery(api.modules.reseller.mutations.profile.getStats, {}) as
    | ResellerStats
    | undefined;
  const referral = useQuery(api.modules.reseller.mutations.marketing.getReferralCode, {}) as
    | ReferralCode
    | undefined;
  const updateProfile = useMutation(api.modules.reseller.mutations.profile.updateProfile);

  const [form, setForm] = useState({
    businessName: "",
    website: "",
    description: "",
    email: "",
    phone: "",
    address: "",
    country: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setForm({
      businessName: profile.businessName,
      website: profile.website ?? "",
      description: profile.description,
      email: profile.contactInfo.email,
      phone: profile.contactInfo.phone,
      address: profile.contactInfo.address,
      country: profile.contactInfo.country,
    });
  }, [profile]);

  if (!profile || !stats || !referral) return <LoadingSkeleton variant="page" />;

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfile({
        businessName: form.businessName,
        website: form.website,
        description: form.description,
        contactInfo: {
          email: form.email,
          phone: form.phone,
          address: form.address,
          country: form.country,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your live reseller profile, contact details, and referral identity."
        badge={<Badge variant={profile.status === "active" ? "default" : "outline"}>{profile.status}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Business Name</label>
                <Input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Website</label>
                <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Description</label>
              <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Address</label>
              <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Country</label>
              <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" />{profile.applicantType}</div>
              <div className="flex items-center gap-2"><Award className="h-4 w-4 text-amber-500" />{profile.tier} tier</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{profile.contactInfo.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{profile.contactInfo.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{profile.contactInfo.address}</div>
              <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" />{profile.contactInfo.country}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>{stats.schools.total} tracked schools</p>
              <p>{stats.schools.active} converted schools</p>
              <p>{profile.commission.rate}% commission rate</p>
              <p><Wallet className="mr-2 inline h-4 w-4" />KES {stats.commissions.totalAmount.toLocaleString()} earned</p>
              <p>KES {stats.payouts.totalAmount.toLocaleString()} paid out</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Referral Identity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{referral.referralCode}</p>
              <p className="break-all text-muted-foreground">{referral.referralUrl}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
