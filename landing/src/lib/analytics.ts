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
