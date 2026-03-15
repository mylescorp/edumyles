"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Redirect to main communications page — Broadcast is now a tab there.
 */
export default function BroadcastPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/platform/communications?tab=broadcast");
  }, [router]);
  return null;
}
