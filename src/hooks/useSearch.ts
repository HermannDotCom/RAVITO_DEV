import { useState, useEffect, useCallback } from 'react';
import { debounce } from '../utils/performance';

export interface SearchResult<T> {
  items: T[];
  query: string;
  isSearching: boolean;
}

interface UseSearchOptions<T> {
  data: T[];
  searchKeys: (keyof T)[];
  minCharacters?: number;
  debounceMs?: number;
}

export const useSearch = <T>({
  data,
  searchKeys,
  minCharacters = 2,
  debounceMs = 300,
}: UseSearchOptions<T>): SearchResult<T> & {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
} => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>(data);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = useCallback(
    (searchQuery: string) => {
      setIsSearching(true);

      if (!searchQuery || searchQuery.length < minCharacters) {
        setResults(data);
        setIsSearching(false);
        return;
      }

      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = data.filter((item) => {
        return searchKeys.some((key) => {
          const value = item[key];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowercaseQuery);
          }
          if (typeof value === 'number') {
            return value.toString().includes(lowercaseQuery);
          }
          return false;
        });
      });

      setResults(filtered);
      setIsSearching(false);
    },
    [data, searchKeys, minCharacters]
  );

  const debouncedSearch = useCallback(
    debounce(performSearch, debounceMs),
    [performSearch, debounceMs]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  useEffect(() => {
    if (!query) {
      setResults(data);
    }
  }, [data, query]);

  return {
    items: results,
    query,
    isSearching,
    setQuery,
    results,
  };
};
