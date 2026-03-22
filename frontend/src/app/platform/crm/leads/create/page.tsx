"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export default function CreateLeadPage() {
  const router = useRouter();
  const { sessionToken } = useAuth();
  const createLead = useMutation(api.platform.crm.mutations.createLead);

  const [form, setForm] = useState({
    schoolName: "",
    contactPerson: "",
    email: "",
    phone: "",
    county: "",
    schoolType: "",
    source: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionToken || !form.schoolName || !form.contactPerson || !form.email || !form.source) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createLead({
        sessionToken,
        schoolName: form.schoolName,
        contactPerson: form.contactPerson,
        email: form.email,
        phone: form.phone || undefined,
        county: form.county || undefined,
        schoolType: form.schoolType || undefined,
        source: form.source,
        notes: form.notes || undefined,
      });
      router.push("/platform/crm");
    } catch (err: any) {
      setError(err.message ?? "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <PageHeader title="Create Lead" description="Add a new school lead to the CRM pipeline" />
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Lead Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name *</Label>
                <Input
                  id="schoolName"
                  value={form.schoolName}
                  onChange={set("schoolName")}
                  placeholder="e.g. Greenfield Academy"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPerson">Contact Person *</Label>
                <Input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={set("contactPerson")}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="contact@school.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={form.county}
                  onChange={set("county")}
                  placeholder="e.g. Nairobi"
                />
              </div>
              <div className="space-y-2">
                <Label>School Type</Label>
                <Select
                  value={form.schoolType}
                  onValueChange={(v) => setForm((p) => ({ ...p, schoolType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">Primary School</SelectItem>
                    <SelectItem value="secondary">Secondary School</SelectItem>
                    <SelectItem value="mixed">Mixed (Primary + Secondary)</SelectItem>
                    <SelectItem value="international">International School</SelectItem>
                    <SelectItem value="university">University / College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Lead Source *</Label>
              <Select
                value={form.source}
                onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="How did you find this lead?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="cold_call">Cold Call</SelectItem>
                  <SelectItem value="event">Event / Conference</SelectItem>
                  <SelectItem value="social_media">Social Media</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={set("notes")}
                placeholder="Any additional context about this lead..."
                rows={3}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.schoolName || !form.contactPerson || !form.email || !form.source}
              >
                {isSubmitting ? "Creating..." : "Create Lead"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
