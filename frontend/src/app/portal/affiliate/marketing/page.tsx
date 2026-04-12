"use client";

import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Link2, Megaphone } from "lucide-react";

type MaterialsResult = {
  materials: Array<{
    materialId: string;
    name: string;
    description: string;
    type: string;
    language: string;
    targetAudience: string;
    usage: { downloads: number; views: number; shares: number };
  }>;
};

type ReferralCode = {
  referralCode: string;
  referralUrl: string;
};

export default function AffiliateMarketingPage() {
  const materials = useQuery(api.modules.reseller.mutations.marketing.getMarketingMaterials, {}) as
    | MaterialsResult
    | undefined;
  const referral = useQuery(api.modules.reseller.mutations.marketing.getReferralCode, {}) as
    | ReferralCode
    | undefined;

  if (!materials || !referral) return <LoadingSkeleton variant="page" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing"
        description="Published affiliate marketing materials and your live referral link."
      />

      <Card>
        <CardHeader><CardTitle>Your Referral Identity</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium"><Link2 className="mr-2 inline h-4 w-4" />{referral.referralCode}</p>
          <p className="break-all text-muted-foreground">{referral.referralUrl}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Published Materials</CardTitle></CardHeader>
        <CardContent>
          {materials.materials.length === 0 ? (
            <EmptyState icon={BookOpen} title="No materials yet" description="Published affiliate materials will appear here." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {materials.materials.map((material) => (
                <div key={material.materialId} className="rounded-md border p-4 text-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-medium">{material.name}</p>
                    <Badge variant="outline">{material.type}</Badge>
                  </div>
                  <p className="text-muted-foreground">{material.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{material.language}</Badge>
                    <Badge variant="secondary">{material.targetAudience}</Badge>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    <Megaphone className="mr-1 inline h-3 w-3" />
                    {material.usage.views} views · {material.usage.downloads} downloads · {material.usage.shares} shares
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
