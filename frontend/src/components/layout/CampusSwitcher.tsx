"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CampusSwitcher() {
  const router = useRouter();
  const { sessionToken, activeTenantId, accessibleTenantIds } = useAuth();
  const switchActiveCampus = useMutation(api.sessions.switchActiveCampus);
  const [isPending, startTransition] = useTransition();
  const campuses = useQuery(
    api.tenants.getAccessibleCampuses,
    sessionToken ? { sessionToken } : "skip"
  ) as Array<{
    tenantId: string;
    campusName: string;
    name: string;
    subdomain: string;
    isPrimaryCampus?: boolean;
  }> | undefined;

  if (!sessionToken || !accessibleTenantIds.length || accessibleTenantIds.length < 2 || !campuses?.length) {
    return null;
  }

  return (
    <Select
      value={activeTenantId ?? campuses[0]?.tenantId}
      onValueChange={(nextTenantId) =>
        startTransition(async () => {
          await switchActiveCampus({ sessionToken, targetTenantId: nextTenantId });
          router.refresh();
          window.location.reload();
        })
      }
      disabled={isPending}
    >
      <SelectTrigger className="h-9 w-[220px]">
        <SelectValue placeholder="Switch campus" />
      </SelectTrigger>
      <SelectContent>
        {campuses.map((campus) => (
          <SelectItem key={campus.tenantId} value={campus.tenantId}>
            {campus.campusName}
            {campus.isPrimaryCampus ? " (Primary)" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
