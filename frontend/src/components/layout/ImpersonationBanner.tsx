"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useMutation } from "@/hooks/useSSRSafeConvex";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

/**
 * Two modes:
 * 1. "active browse" mode — when the current browser session IS an impersonation
 *    session (detected via `edumyles_impersonating` cookie). Shows target user info
 *    and lets admin exit back to their own session.
 * 2. "platform monitor" mode — when a platform admin can see other active impersonation
 *    sessions (existing behaviour, unchanged). Only shows in this mode when NOT actively
 *    impersonating to avoid double banners.
 */
export function ImpersonationBanner() {
    const { sessionToken } = useAuth();
    const router = useRouter();
    const [isActiveBrowse, setIsActiveBrowse] = useState(false);
    const [exitLoading, setExitLoading] = useState(false);

    const endImpersonation = useMutation(api.platform.impersonation.mutations.endImpersonation);

    // Read server-only impersonation state through the authenticated session boundary.
    useEffect(() => {
        let cancelled = false;

        void fetch("/api/impersonation/status", {
            credentials: "same-origin",
            cache: "no-store",
        })
            .then(async (response) => {
                if (!response.ok || cancelled) return;
                const data: { active?: boolean } = await response.json();
                setIsActiveBrowse(data.active === true);
            })
            .catch(() => {
                if (!cancelled) setIsActiveBrowse(false);
            });

        return () => {
            cancelled = true;
        };
    }, [sessionToken]);

    const handleExitImpersonation = async () => {
        setExitLoading(true);
        try {
            // Tell the backend to end the impersonation session
            if (sessionToken) {
                try {
                    // We don't know the targetUserId here but the backend finds the active session by adminId stored in cookie
                    await endImpersonation({ sessionToken, targetUserId: "" });
                } catch {
                    // Best-effort — proceed with cookie cleanup regardless
                }
            }

            // Restore admin cookies via API route
            const res = await fetch("/api/impersonation/exit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
            });

            if (res.ok) {
                router.push("/platform/impersonation");
                router.refresh();
            }
        } finally {
            setExitLoading(false);
        }
    };

    if (!isActiveBrowse) return null;

    return (
        <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
                You are browsing the platform as another user. All actions are being logged against your admin account.
            </span>
            <button
                onClick={handleExitImpersonation}
                disabled={exitLoading}
                className="ml-4 rounded bg-amber-700 px-3 py-0.5 text-xs font-semibold text-white hover:bg-amber-800 disabled:opacity-60"
            >
                {exitLoading ? "Exiting..." : "Exit Impersonation"}
            </button>
        </div>
    );
}
