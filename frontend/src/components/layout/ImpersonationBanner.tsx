"use client";

import { AlertTriangle } from "lucide-react";
import { useMutation, useQuery } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";

export function ImpersonationBanner() {
  const activeSessions = useQuery(api.platform.impersonation.queries.listImpersonationSessions, {
    activeOnly: true,
  }) as Array<{ _id: string; targetUserId: string; targetUserName?: string }> | undefined;
  const endImpersonation = useMutation(api.platform.impersonation.mutations.endImpersonation);

  const firstSession = activeSessions?.[0];
  const isImpersonating = Boolean(firstSession);

  if (!isImpersonating) return null;

  const handleEnd = async () => {
    if (!firstSession?.targetUserId) return;
    try {
      await endImpersonation({ targetUserId: firstSession.targetUserId });
    } catch (error) {
      console.error("Failed to end impersonation session:", error);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <AlertTriangle className="h-4 w-4" />
      <span>
        You are currently impersonating {firstSession?.targetUserName ?? "a user"}. All actions are
        being logged.
      </span>
      <button
        onClick={handleEnd}
        className="ml-4 rounded bg-amber-700 px-3 py-0.5 text-xs font-semibold text-white hover:bg-amber-800"
      >
        End Session
      </button>
    </div>
  );
}
