type AnalyticsEventHandler = (
  command: "event",
  name: string,
  properties?: Record<string, unknown>
) => void;

type WindowWithGtag = Window & {
  gtag?: AnalyticsEventHandler;
};

export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    const analyticsWindow = window as WindowWithGtag;
    if (typeof analyticsWindow.gtag === "function") {
      analyticsWindow.gtag("event", name, properties);
    }
  } catch {
    // silently ignore tracking errors
  }
}

export function trackDemoBooking() {
  trackEvent("demo_booking_click", { source: "landing_page" });
}

export function trackSignupClick() {
  trackEvent("signup_click", { source: "landing_page" });
}

export function trackWhatsAppClick() {
  trackEvent("whatsapp_click", { source: "landing_page" });
}

// Cookie consent tracking
export function trackCookieConsent(consent: "accepted" | "declined") {
  trackEvent("cookie_consent", { 
    consent_type: consent,
    page_location: window.location.pathname,
    timestamp: new Date().toISOString()
  });
}

// Site performance tracking
export function trackPageLoad(loadTime: number) {
  trackEvent("page_performance", {
    page_load_time: loadTime,
    page_path: window.location.pathname,
    user_agent: navigator.userAgent,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  });
}

export function trackFormSubmission(formName: string, success: boolean) {
  trackEvent("form_submission", {
    form_name: formName,
    success: success,
    page_location: window.location.pathname
  });
}

export function trackLeadConversion(conversionName: string, properties?: Record<string, unknown>) {
  trackEvent("generate_lead", {
    lead_type: conversionName,
    page_location: window.location.pathname,
    ...properties,
  });

  const adsSendTo = process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION;
  if (adsSendTo) {
    trackEvent("conversion", {
      send_to: adsSendTo,
      lead_type: conversionName,
      ...properties,
    });
  }
}

export function trackNavigationClick(destination: string) {
  trackEvent("navigation_click", {
    destination: destination,
    source_page: window.location.pathname
  });
}

// Performance metrics
export function trackCoreWebVitals(metric: unknown) {
  const metricObj = metric as Record<string, unknown>;
  trackEvent("core_web_vital", {
    metric_name: metricObj.name || '',
    metric_value: metricObj.value || 0,
    metric_id: metricObj.id || '',
    page_location: typeof window !== 'undefined' ? window.location.pathname : ''
  });
}
