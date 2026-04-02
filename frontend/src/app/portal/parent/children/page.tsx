"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ParentChildrenPage() {
  const { isLoading } = useAuth();
  const children = useQuery(
    api.modules.portal.parent.queries.getChildren,
    {}
  ) as Array<{
    _id: string;
    firstName: string;
    lastName: string;
    admissionNumber?: string;
    status?: string;
  }> | undefined;

  if (isLoading || children === undefined) {
    return <LoadingSkeleton variant="page" />;
  }

  return (
    <div>
      <PageHeader
        title="My Children"
        description="View your linked children and their basic details"
      />

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No children are linked to your account yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {children.map((child) => (
            <Card key={child._id}>
              <CardHeader>
                <CardTitle>
                  {child.firstName} {child.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p>Admission No: {child.admissionNumber}</p>
                <p>Status: {child.status}</p>
                <Button asChild size="sm" className="mt-3">
                  <Link href={`/portal/parent/children/${child._id}`}>
                    View details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

