import { useState, useEffect, useCallback } from 'react';

export const useSimpleRouter = () => {
  const [path, setPath] = useState(window.location.pathname);
  
  const navigate = useCallback((newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
  
  return { path, navigate };
};
