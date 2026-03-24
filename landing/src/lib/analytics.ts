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

export function trackNavigationClick(destination: string) {
  trackEvent("navigation_click", {
    destination: destination,
    source_page: window.location.pathname
  });
}

// Performance metrics
export function trackCoreWebVitals(metric: unknown) {
  trackEvent("core_web_vital", {
    metric_name: (metric as any).name || '',
    metric_value: (metric as any).value || 0,
    metric_id: (metric as any).id || '',
    page_location: typeof window !== 'undefined' ? window.location.pathname : ''
  });
}
