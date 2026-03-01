"use client";

import { AlertTriangle } from "lucide-react";

export function ImpersonationBanner() {
  // TODO: Check for active impersonation session from Convex
  const isImpersonating = false;

  if (!isImpersonating) return null;

  return (
    <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
      <AlertTriangle className="h-4 w-4" />
      <span>
        You are currently impersonating a user. All actions are being logged.
      </span>
      <button className="ml-4 rounded bg-amber-700 px-3 py-0.5 text-xs font-semibold text-white hover:bg-amber-800">
        End Session
      </button>
    </div>
  );
}
