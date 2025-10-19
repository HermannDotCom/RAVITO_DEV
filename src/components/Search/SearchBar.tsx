import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps<T> {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions?: T[];
  onSuggestionSelect?: (item: T) => void;
  renderSuggestion?: (item: T) => React.ReactNode;
  isSearching?: boolean;
}

export const SearchBar = <T,>({
  placeholder = 'Rechercher...',
  value,
  onChange,
  suggestions = [],
  onSuggestionSelect,
  renderSuggestion,
  isSearching = false,
}: SearchBarProps<T>) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && onSuggestionSelect) {
          onSuggestionSelect(suggestions[selectedIndex]);
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => {
            if (value && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Recherche"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={showSuggestions && suggestions.length > 0}
        />

        {value && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            aria-label="Effacer la recherche"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {isSearching && (
          <div className="absolute inset-y-0 right-10 flex items-center pr-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
        >
          {suggestions.map((item, index) => (
            <button
              key={index}
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => {
                if (onSuggestionSelect) {
                  onSuggestionSelect(item);
                }
                setShowSuggestions(false);
                setSelectedIndex(-1);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                index === selectedIndex ? 'bg-blue-50' : ''
              } ${index === 0 ? 'rounded-t-lg' : ''} ${
                index === suggestions.length - 1 ? 'rounded-b-lg' : ''
              }`}
            >
              {renderSuggestion ? renderSuggestion(item) : String(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
