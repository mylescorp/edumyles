"use client";

import { useEffect, useState } from 'react';

interface LazyCSSProps {
  href: string;
  media?: string;
}

export default function LazyCSS({ href, media = 'all' }: LazyCSSProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only load CSS after initial page load
    const timer = setTimeout(() => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.media = media;
      
      link.onload = () => setIsLoaded(true);
      
      document.head.appendChild(link);
    }, 100); // Small delay to prioritize critical rendering

    return () => clearTimeout(timer);
  }, [href, media]);

  return null; // This component doesn't render anything
}
