"use client";

import { useEffect } from 'react';

export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Monitor Core Web Vitals
    const reportWebVitals = (metric: any) => {
      // Send to analytics service
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Web Vitals] ${metric.name}:`, metric.value, metric);
      }
    };

    // Import web-vitals library dynamically
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS(reportWebVitals);
      onINP(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
    }).catch(err => {
      console.warn('Failed to load web-vitals:', err);
    });

    // Monitor long tasks
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`[Performance] Long task detected: ${entry.duration}ms`, entry);
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (err) {
        console.warn('PerformanceObserver not available:', err);
      }
    }

    // Monitor memory usage
    if (typeof window !== 'undefined' && 'memory' in performance) {
      try {
        const memory = (performance as any).memory;
        console.log('[Memory] Used:', Math.round(memory.usedJSHeapSize / 1048576), 'MB');
        console.log('[Memory] Total:', Math.round(memory.totalJSHeapSize / 1048576), 'MB');
      } catch (err) {
        console.warn('Memory monitoring not available:', err);
      }
    }
  }, []);

  return null;
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
