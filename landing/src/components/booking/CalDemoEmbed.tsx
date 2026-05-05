"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CalendarCheck2, CalendarDays, Loader2, Mail, Phone } from "lucide-react";
import { CALCOM_EMBED_ORIGIN, CAL_CONFIG } from "@/lib/cal";
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
    const scriptSrc = `${CALCOM_EMBED_ORIGIN}/embed/embed.js`;
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Calendar embed failed to load")), {
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
          script.src = scriptSrc;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Calendar embed failed to load"));
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
          form_name: "demo_calendar_booking",
              booking_uid: data.uid,
              demo_request_id: demoRequestId,
            });
          },
        });
        scopedCal("on", {
          action: "linkFailed",
          callback: (event: CustomEvent) => {
            setStatus("error");
            trackEvent("demo_calendar_embed_failed", {
              demo_request_id: demoRequestId,
              error_code: event.detail?.data?.code,
              error_message: event.detail?.data?.msg,
            });
          },
        });
      } catch (error) {
        if (!cancelled) setStatus("error");
        trackEvent("demo_calendar_embed_failed", {
          demo_request_id: demoRequestId,
          error_message: error instanceof Error ? error.message : "Unknown calendar embed error",
        });
      }
    }

    mountEmbed();

    return () => {
      cancelled = true;
    };
  }, [demoRequestId, email, fullName, phone, schoolName]);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#d4eade] bg-white shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 px-4 pt-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-[#F3FBF6]">
            {status === "booked" ? (
              <CalendarCheck2 className="h-5 w-5 text-[#0F4C2A]" />
            ) : (
              <CalendarDays className="h-5 w-5 text-[#0F4C2A]" />
            )}
          </div>
          <div>
            <h3 className="font-jakarta text-[16px] font-bold text-[#061A12]">
              {status === "booked" ? "Demo time confirmed" : "Pick your live demo time"}
            </h3>
            <p className="font-jakarta text-[13px] leading-5 text-[#5a5a5a]">
              {status === "booked"
                ? "The meeting details will attach to your demo request."
                : "Your school details are already attached to this booking."}
            </p>
          </div>
        </div>
        <div className="mx-4 flex flex-wrap gap-2">
          <a
            href="tel:+254743993715"
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#d4eade] px-3 py-2 font-jakarta text-[13px] font-semibold text-[#061A12] no-underline transition-colors hover:border-[#0F4C2A] hover:bg-[#F3FBF6]"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href="mailto:demo@edumyles.com"
            className="inline-flex items-center gap-2 rounded-[8px] border border-[#d4eade] px-3 py-2 font-jakarta text-[13px] font-semibold text-[#061A12] no-underline transition-colors hover:border-[#0F4C2A] hover:bg-[#F3FBF6]"
          >
            <Mail className="h-4 w-4" />
            Email
          </a>
        </div>
      </div>

      {status === "error" ? (
        <div className="mx-4 mb-4 flex gap-3 rounded-xl border border-[#f5c2c7] bg-[#fff5f5] px-4 py-3 font-jakarta text-sm text-[#9A1F2B]">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          The embedded calendar could not load. Please call or email our team and we will schedule
          the walkthrough manually.
        </div>
      ) : null}

      {status === "booked" ? (
        <div className="mx-4 mb-4 rounded-xl bg-[#F3FBF6] px-4 py-3 font-jakarta text-sm font-semibold text-[#0F4C2A]">
          Booking confirmed. The final meeting details will sync into your demo request.
        </div>
      ) : null}

      <div className="relative border-t border-[#edf4ef] bg-white">
        {status === "loading" ? (
          <div className="absolute inset-x-0 top-0 z-10 flex min-h-[320px] items-center justify-center bg-white/85 px-6 text-center backdrop-blur-sm">
            <div>
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-[#0F4C2A]" />
              <p className="font-jakarta text-sm font-semibold text-[#061A12]">
                Loading available demo slots
              </p>
              <p className="mt-1 font-jakarta text-xs text-[#6B9E83]">
                The scheduling calendar is preparing times in your browser.
              </p>
            </div>
          </div>
        ) : null}
        <div
          ref={containerRef}
          className="min-h-[620px] overflow-hidden sm:min-h-[660px]"
          aria-busy={status === "loading"}
        />
      </div>
    </div>
  );
}
