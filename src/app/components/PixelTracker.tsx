import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export default function PixelTracker() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  // Track Page Views on route change (skip initial load)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname]);

  // Track Clicks globally
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (window.fbq) {
        // You can customize the data you want to send with the click event
        const target = e.target as HTMLElement;
        const text = target.innerText?.slice(0, 50) || '';
        const tag = target.tagName;
        
        window.fbq('trackCustom', 'GlobalClick', {
          url: window.location.href,
          path: pathname,
          elementText: text,
          elementTag: tag,
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [pathname]);

  return null;
}
