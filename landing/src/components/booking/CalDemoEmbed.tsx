"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarDays, ExternalLink } from "lucide-react";
import { CALCOM_EMBED_ORIGIN, CAL_CONFIG, buildCalBookingUrl } from "@/lib/cal";
import { trackEvent, trackLeadConversion } from "@/lib/analytics";

type CalDemoEmbedProps = {
  fullName: string;
  email: string;
  phone?: string;
  schoolName?: string;
  demoRequestId?: string;
};

type CalApi = {
  (...args: unknown[]): void;
  loaded?: boolean;
  ns?: Record<string, CalApi>;
  q?: unknown[];
  config?: {
    forwardQueryParams?: boolean;
  };
};

declare global {
  interface Window {
    Cal?: CalApi;
  }
}

function loadCalEmbedScript() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.Cal?.loaded) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://app.cal.com/embed/embed.js"]'
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Cal.com embed failed to load")), {
        once: true,
      });
      return;
    }

    const Cal: CalApi =
      window.Cal ??
      (function calQueue(...args: unknown[]) {
        const cal = window.Cal as CalApi;
        if (!cal.loaded) {
          cal.ns = cal.ns ?? {};
          cal.q = cal.q ?? [];
          const script = document.createElement("script");
          script.src = `${CALCOM_EMBED_ORIGIN}/embed/embed.js`;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Cal.com embed failed to load"));
          document.head.appendChild(script);
          cal.loaded = true;
        }
        if (args[0] === "init") {
          const namespace = args[1];
          const api: CalApi = function namespaceQueue(...namespaceArgs: unknown[]) {
            api.q = api.q ?? [];
            api.q.push(namespaceArgs);
          };
          if (typeof namespace === "string") {
            cal.ns = cal.ns ?? {};
            cal.ns[namespace] = cal.ns[namespace] ?? api;
            cal.ns[namespace].q = cal.ns[namespace].q ?? [];
            cal.ns[namespace].q?.push(args);
            cal.q?.push(["initNamespace", namespace]);
          } else {
            cal.q?.push(args);
          }
          return;
        }
        cal.q?.push(args);
      } as CalApi);

    window.Cal = Cal;
  });
}

export default function CalDemoEmbed({
  fullName,
  email,
  phone,
  schoolName,
  demoRequestId,
}: CalDemoEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error" | "booked">("loading");

  const externalUrl = useMemo(
    () =>
      buildCalBookingUrl({
        name: fullName,
        email,
        phone,
        schoolName,
        demoRequestId,
        source: "landing_book_demo",
      }),
    [demoRequestId, email, fullName, phone, schoolName]
  );

  useEffect(() => {
    let cancelled = false;

    async function mountEmbed() {
      try {
        setStatus("loading");
        await loadCalEmbedScript();
        if (cancelled || !containerRef.current || !window.Cal) return;

        const Cal = window.Cal;
        const namespace = CAL_CONFIG.namespace;
        Cal.config = { ...(Cal.config ?? {}), forwardQueryParams: true };
        Cal("init", namespace, { origin: CALCOM_EMBED_ORIGIN });

        const scopedCal = Cal.ns?.[namespace] ?? Cal;
        containerRef.current.innerHTML = "";
        scopedCal("inline", {
          elementOrSelector: containerRef.current,
          calLink: CAL_CONFIG.calLink,
          config: {
            ...CAL_CONFIG.config,
            name: fullName,
            email,
            ...(phone
              ? {
                  location: JSON.stringify({
                    value: "phone",
                    optionValue: phone,
                  }),
                }
              : {}),
            ...(demoRequestId ? { "metadata[demoRequestId]": demoRequestId } : {}),
            ...(schoolName ? { "metadata[schoolName]": schoolName } : {}),
            "metadata[source]": "landing_book_demo",
          },
        });
        scopedCal("ui", {
          styles: {
            body: { background: "#ffffff" },
            eventTypeListItem: { background: "#ffffff" },
          },
        });
        scopedCal("on", {
          action: "linkReady",
          callback: () => {
            if (!cancelled) setStatus("ready");
          },
        });
        scopedCal("on", {
          action: "bookingSuccessfulV2",
          callback: (event: CustomEvent) => {
            if (!cancelled) setStatus("booked");
            const data = event.detail?.data ?? {};
            trackLeadConversion("demo_booking_scheduled", {
              form_name: "calcom_demo_booking",
              booking_uid: data.uid,
              demo_request_id: demoRequestId,
            });
          },
        });
        scopedCal("on", {
          action: "linkFailed",
          callback: (event: CustomEvent) => {
            setStatus("error");
            trackEvent("calcom_embed_failed", {
              demo_request_id: demoRequestId,
              error_code: event.detail?.data?.code,
              error_message: event.detail?.data?.msg,
            });
          },
        });
      } catch (error) {
        if (!cancelled) setStatus("error");
        trackEvent("calcom_embed_failed", {
          demo_request_id: demoRequestId,
          error_message: error instanceof Error ? error.message : "Unknown Cal.com embed error",
        });
      }
    }

    mountEmbed();

    return () => {
      cancelled = true;
    };
  }, [demoRequestId, email, fullName, phone, schoolName]);

  return (
    <div className="rounded-2xl border border-[#d4eade] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#F3FBF6]">
            <CalendarDays className="h-5 w-5 text-[#0F4C2A]" />
          </div>
          <div>
            <h3 className="font-jakarta text-[16px] font-bold text-[#061A12]">
              Pick your live demo time
            </h3>
            <p className="font-jakarta text-[13px] leading-5 text-[#5a5a5a]">
              Your school details are already attached to this booking.
            </p>
          </div>
        </div>
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[8px] border border-[#d4eade] px-3 py-2 font-jakarta text-[13px] font-semibold text-[#061A12] no-underline"
        >
          Open in Cal.com
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {status === "error" ? (
        <div className="mb-4 flex gap-3 rounded-xl border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 font-jakarta text-sm text-[#9A1F2B]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          Cal.com could not load inline. Use the Cal.com link above to finish scheduling.
        </div>
      ) : null}

      {status === "booked" ? (
        <div className="mb-4 rounded-xl bg-[#F3FBF6] px-4 py-3 font-jakarta text-sm font-semibold text-[#0F4C2A]">
          Booking confirmed. We will sync the final meeting details into Demo Ops through the Cal.com
          webhook.
        </div>
      ) : null}

      <div
        ref={containerRef}
        className="min-h-[660px] overflow-hidden rounded-xl border border-[#edf4ef]"
        aria-busy={status === "loading"}
      />
    </div>
  );
}
