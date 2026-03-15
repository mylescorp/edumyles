export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  try {
    // GA4
    if (typeof (window as unknown as { gtag?: Function }).gtag === "function") {
      (window as unknown as { gtag: Function }).gtag("event", name, properties);
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
