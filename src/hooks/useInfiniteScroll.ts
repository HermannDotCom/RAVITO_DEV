import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  data: T[];
  pageSize?: number;
  initialPage?: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  hasMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  currentPage: number;
  reset: () => void;
  observerRef: (node: HTMLElement | null) => void;
}

export const useInfiniteScroll = <T>({
  data,
  pageSize = 20,
  initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);

  const hasMore = currentPage * pageSize < data.length;

  const loadMore = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setTimeout(() => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      const newItems = data.slice(startIndex, endIndex);

      setItems((prev) => [...prev, ...newItems]);
      setCurrentPage((prev) => prev + 1);
      setIsLoading(false);
    }, 300);
  }, [currentPage, pageSize, data, hasMore, isLoading]);

  const reset = useCallback(() => {
    setCurrentPage(initialPage);
    setItems([]);
    setIsLoading(false);
  }, [initialPage]);

  useEffect(() => {
    const startIndex = 0;
    const endIndex = initialPage * pageSize;
    setItems(data.slice(startIndex, endIndex));
  }, [data, initialPage, pageSize]);

  const observerRef = useCallback(
    (node: HTMLElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      });

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, loadMore]
  );

  return {
    items,
    hasMore,
    loadMore,
    isLoading,
    currentPage,
    reset,
    observerRef,
  };
};
