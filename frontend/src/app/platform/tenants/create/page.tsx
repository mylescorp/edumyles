"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

export default function CreateTenantPage() {
    const { isLoading } = useAuth();
    const router = useRouter();
    const createTenant = useMutation(api.platform.tenants.mutations.createTenant);

    const [form, setForm] = useState({
        name: "",
        subdomain: "",
        email: "",
        phone: "",
        plan: "free" as "free" | "starter" | "growth" | "enterprise",
        county: "",
        country: "KE",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (isLoading) return <LoadingSkeleton variant="page" />;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            await createTenant(form);
            router.push("/platform/tenants");
        } catch (err: any) {
            setError(err.message || "Failed to create tenant");
        } finally {
            setSubmitting(false);
        }
    };

    const updateField = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div>
            <PageHeader
                title="Onboard New School"
                description="Create a new tenant on the platform"
                breadcrumbs={[
                    { label: "Platform", href: "/platform" },
                    { label: "Tenants", href: "/platform/tenants" },
                    { label: "Create" },
                ]}
            />

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        School Details
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">School Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Myles Academy"
                                    value={form.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subdomain">Subdomain *</Label>
                                <div className="flex items-center">
                                    <Input
                                        id="subdomain"
                                        placeholder="mylesacademy"
                                        value={form.subdomain}
                                        onChange={(e) => updateField("subdomain", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                                        className="rounded-r-none"
                                        required
                                    />
                                    <span className="rounded-r-md border border-l-0 bg-muted px-3 py-2 text-sm text-muted-foreground">
                                        .edumyles.com
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Contact Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="admin@school.com"
                                    value={form.email}
                                    onChange={(e) => updateField("email", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input
                                    id="phone"
                                    placeholder="+254 7XX XXX XXX"
                                    value={form.phone}
                                    onChange={(e) => updateField("phone", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="plan">Subscription Plan *</Label>
                                <Select value={form.plan} onValueChange={(v) => updateField("plan", v)}>
                                    <SelectTrigger id="plan">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="free">Free</SelectItem>
                                        <SelectItem value="starter">Starter</SelectItem>
                                        <SelectItem value="growth">Growth</SelectItem>
                                        <SelectItem value="enterprise">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="county">County *</Label>
                                <Input
                                    id="county"
                                    placeholder="e.g. Nairobi"
                                    value={form.county}
                                    onChange={(e) => updateField("county", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Select value={form.country} onValueChange={(v) => updateField("country", v)}>
                                    <SelectTrigger id="country">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KE">Kenya</SelectItem>
                                        <SelectItem value="UG">Uganda</SelectItem>
                                        <SelectItem value="TZ">Tanzania</SelectItem>
                                        <SelectItem value="RW">Rwanda</SelectItem>
                                        <SelectItem value="ET">Ethiopia</SelectItem>
                                        <SelectItem value="GH">Ghana</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => router.back()} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? "Creating..." : "Create School"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
