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
import { Award, Globe, Mail, MapPin, Phone, Save } from "lucide-react";

type Profile = {
  businessName: string;
  description: string;
  website?: string;
  tier: string;
  status: string;
  contactInfo: { email: string; phone: string; address: string; country: string };
};

export default function AffiliateProfilePage() {
  const profile = useQuery(api.modules.reseller.mutations.profile.getMyProfile, {}) as Profile | undefined;
  const updateProfile = useMutation(api.modules.reseller.mutations.profile.updateProfile);
  const [form, setForm] = useState({
    businessName: "",
    description: "",
    website: "",
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
      description: profile.description,
      website: profile.website ?? "",
      email: profile.contactInfo.email,
      phone: profile.contactInfo.phone,
      address: profile.contactInfo.address,
      country: profile.contactInfo.country,
    });
  }, [profile]);

  if (!profile) return <LoadingSkeleton variant="page" />;

  async function save() {
    setSaving(true);
    try {
      await updateProfile({
        businessName: form.businessName,
        description: form.description,
        website: form.website,
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
      <PageHeader title="Affiliate Profile" description="Manage your live affiliate profile." badge={<Badge variant={profile.status === "active" ? "default" : "outline"}>{profile.status}</Badge>} />
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader><CardTitle>Profile Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} />
            <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} placeholder="Website" />
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
            <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Phone" />
            <Input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Address" />
            <Input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} placeholder="Country" />
            <Button onClick={save} disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save Profile"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Account Overview</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p><Award className="mr-2 inline h-4 w-4 text-amber-500" />{profile.tier} tier</p>
            <p><Mail className="mr-2 inline h-4 w-4" />{profile.contactInfo.email}</p>
            <p><Phone className="mr-2 inline h-4 w-4" />{profile.contactInfo.phone}</p>
            <p><MapPin className="mr-2 inline h-4 w-4" />{profile.contactInfo.address}</p>
            <p><Globe className="mr-2 inline h-4 w-4" />{profile.contactInfo.country}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
