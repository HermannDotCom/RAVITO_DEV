import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

/**
 * Hook to detect responsive breakpoints
 * Mobile: < 640px
 * Tablet: 640px - 1024px
 * Desktop: >= 1024px
 */
export function useResponsive(): ResponsiveState {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth });
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    width: windowSize.width,
  };
}
