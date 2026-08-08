import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if current viewport width is below a given breakpoint.
 * Defaults to 768px (standard mobile / tablet portrait breakpoint).
 */
export const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth <= breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    // Set initial value directly from matchMedia
    setIsMobile(mediaQuery.matches);

    // Modern matchMedia listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [breakpoint]);

  return isMobile;
};
