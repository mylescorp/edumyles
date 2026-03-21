"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AdminFeatureUnavailableProps {
  title: string;
  description: string;
  icon: LucideIcon;
  sectionHref: string;
  sectionLabel: string;
  reason?: string;
}

export function AdminFeatureUnavailable({
  title,
  description,
  icon,
  sectionHref,
  sectionLabel,
  reason = "This screen is still linked from the admin navigation, but its backend integration has not been completed yet. The prototype data has been removed so it no longer presents fabricated operational information.",
}: AdminFeatureUnavailableProps) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button asChild variant="outline" className="gap-2">
            <Link href={sectionHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to {sectionLabel}
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <EmptyState
            icon={icon}
            title={`${title} is not yet wired`}
            description={reason}
          />
        </CardContent>
      </Card>
    </div>
  );
}
