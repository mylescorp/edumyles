"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { persistAttributionFromSearchParams } from "@/lib/attribution";

export default function AttributionTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    persistAttributionFromSearchParams(searchParams, pathname);
  }, [pathname, searchParams]);

  return null;
}
