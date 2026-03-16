"use client";

import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, ArrowLeft, Info, Building2, Users, FileText, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";

type AudienceType = "all_tenants" | "single_tenant";

type TenantOption = {
  _id: string;
  tenantId: string;
  name: string;
  subdomain?: string;
  plan?: string;
  status?: string;
  email?: string;
  county?: string;
  country?: string;
  createdAt?: number;
};

export default function BroadcastPage() {
  const router = useRouter();
  const { sessionToken, isLoading: authLoading } = useAuth();

  const { data: tenants, isLoading: tenantsLoading } = useQuery(
    api.platform.tenants.queries.listAllTenants,
    { sessionToken: sessionToken || "" }
  );

  const createPlatformMessage = useMutation(
    api.platform.communications.mutations.createPlatformMessage
  );
  const sendPlatformMessageNow = useMutation(
    api.platform.communications.mutations.sendPlatformMessageNow
  );

  const [audienceType, setAudienceType] = useState<AudienceType>("all_tenants");
  const [tenantId, setTenantId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{
    type: "success" | "error" | "";
    text: string;
  }>({ type: "", text: "" });

  const tenantOptions: TenantOption[] = useMemo(() => {
    if (!Array.isArray(tenants)) return [];
    return tenants;
  }, [tenants]);

  const selectedTenant = useMemo(() => {
    return tenantOptions.find((tenant) => tenant.tenantId === tenantId);
  }, [tenantOptions, tenantId]);

  const isFormValid = useMemo(() => {
    const hasBasicFields = title.trim().length > 0 && message.trim().length > 0;
    if (audienceType === "single_tenant") {
      return hasBasicFields && tenantId.trim().length > 0;
    }
    return hasBasicFields;
  }, [audienceType, tenantId, title, message]);

  const resetForm = () => {
    setAudienceType("all_tenants");
    setTenantId("");
    setTitle("");
    setMessage("");
    setFormMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMessage({ type: "", text: "" });

    if (!sessionToken) {
      setFormMessage({
        type: "error",
        text: "Your platform session is missing. Please log in again.",
      });
      return;
    }

    if (!title.trim() || !message.trim()) {
      setFormMessage({
        type: "error",
        text: "Please fill in both the title and message fields.",
      });
      return;
    }

    if (audienceType === "single_tenant" && !tenantId) {
      setFormMessage({
        type: "error",
        text: "Please select a tenant before sending.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const segment = audienceType === "single_tenant" ? { tenantIds: [tenantId] } : {};

      const messageId = await createPlatformMessage({
        sessionToken,
        type: "broadcast",
        subject: title.trim(),
        inAppBody: message.trim(),
        channels: ["in_app"],
        segment,
        status: "draft",
      });

      const result = await sendPlatformMessageNow({
        sessionToken,
        messageId,
      });

      setFormMessage({
        type: "success",
        text:
          audienceType === "all_tenants"
            ? `Broadcast sent successfully to ${result.delivered} tenant(s).`
            : `Broadcast sent successfully to ${selectedTenant?.name ?? "the selected tenant"}.`,
      });

      resetForm();
    } catch (error) {
      console.error("Failed to send broadcast:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong while sending the broadcast.";

      setFormMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPageLoading = authLoading || tenantsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <PageHeader
            title="Send Broadcast"
            description="Send in-app communication from master admin to tenants"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Send className="h-5 w-5 text-em-accent-dark" />
              Broadcast Form
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Send an in-app broadcast to all tenants or to one tenant.
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Audience Type</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={audienceType}
                    onChange={(e) => {
                      const value = e.target.value as AudienceType;
                      setAudienceType(value);
                      if (value === "all_tenants") setTenantId("");
                    }}
                    className="w-full h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    disabled={isPageLoading || isSubmitting}
                  >
                    <option value="all_tenants">All tenants</option>
                    <option value="single_tenant">Single tenant</option>
                  </select>
                </div>
              </div>

              {audienceType === "single_tenant" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tenant</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                      className="w-full h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      disabled={isPageLoading || isSubmitting}
                    >
                      <option value="">
                        {tenantsLoading ? "Loading tenants..." : "Select a tenant"}
                      </option>
                      {tenantOptions.map((tenant) => (
                        <option key={tenant._id} value={tenant.tenantId}>
                          {tenant.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. System Maintenance Notice"
                    maxLength={120}
                    className="w-full h-11 rounded-md border border-input bg-background pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write the broadcast message here..."
                    rows={6}
                    maxLength={1000}
                    className="w-full rounded-md border border-input bg-background pl-10 pr-3 py-3 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {formMessage.text && (
                <div
                  className={`rounded-md border px-4 py-3 text-sm ${
                    formMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  }`}
                >
                  {formMessage.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                <Button type="button" variant="outline" onClick={resetForm} disabled={isSubmitting}>
                  Clear Form
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || isPageLoading}
                  className="bg-em-accent hover:bg-em-accent-dark"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Sending..." : "Send Broadcast"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
