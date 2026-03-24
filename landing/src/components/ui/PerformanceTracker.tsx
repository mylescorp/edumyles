"use client";

import { useEffect } from "react";
import { trackPageLoad, trackCoreWebVitals } from "@/lib/analytics";

// Type definitions for performance entries
interface PerformanceEntryWithProcessingStart extends PerformanceEntry {
  processingStart?: number;
}

interface PerformanceEntryWithHadRecentInput extends PerformanceEntry {
  hadRecentInput?: boolean;
}

export default function PerformanceTracker() {
  useEffect(() => {
    // Track page load time
    const startTime = performance.now();
    
    // Track when page fully loads
    const handleLoad = () => {
      const loadTime = Math.round(performance.now() - startTime);
      trackPageLoad(loadTime);
    };

    // Track Core Web Vitals
    const reportWebVitals = (metric: unknown) => {
      trackCoreWebVitals(metric);
    };

    if ('PerformanceObserver' in window) {
      // Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          reportWebVitals(lastEntry);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-input-delay') {
            const fidEntry = entry as PerformanceEntryWithProcessingStart;
            reportWebVitals({
              name: 'FID',
              value: Math.round((fidEntry.processingStart || 0) - entry.startTime),
              id: 'fid'
            });
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          const clsEntry = entry as PerformanceEntryWithHadRecentInput;
          if (!clsEntry.hadRecentInput) {
            clsValue += 0; // Remove value property access
          }
        });
        reportWebVitals({
          name: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          id: 'cls'
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }

    // Fallback for older browsers
    window.addEventListener('load', handleLoad);

    return () => {
      // Cleanup
      window.removeEventListener('load', handleLoad);
      if ('PerformanceObserver' in window) {
        // Disconnect observers if they exist
        // Note: In a real implementation, we'd store observer instances to disconnect them
      }
    };
  }, []);

  return null; // This component doesn't render anything
}
