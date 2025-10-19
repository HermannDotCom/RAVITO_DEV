import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ProductCategory } from '../../types';

export interface FilterOptions {
  categories: ProductCategory[];
  priceRange: { min: number; max: number };
  alcoholRange: { min: number; max: number };
  availability: 'all' | 'available' | 'unavailable';
}

interface ProductFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const categories: { value: ProductCategory; label: string }[] = [
    { value: 'biere', label: 'Bière' },
    { value: 'soda', label: 'Soda' },
    { value: 'vin', label: 'Vin' },
    { value: 'eau', label: 'Eau' },
    { value: 'spiritueux', label: 'Spiritueux' },
  ];

  const toggleCategory = (category: ProductCategory) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];

    onFilterChange({ ...filters, categories: newCategories });
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.priceRange.min > 0 ||
    filters.priceRange.max < 50000 ||
    filters.alcoholRange.min > 0 ||
    filters.alcoholRange.max < 100 ||
    filters.availability !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <span className="font-semibold text-gray-900">Filtres</span>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
              Actifs
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Catégories
            </label>
            <div className="space-y-2">
              {categories.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(value)}
                    onChange={() => toggleCategory(value)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Prix (FCFA)
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.priceRange.min}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      priceRange: {
                        ...filters.priceRange,
                        min: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={filters.priceRange.max}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      priceRange: {
                        ...filters.priceRange,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Taux d'alcool (%)
            </label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={filters.alcoholRange.min}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      alcoholRange: {
                        ...filters.alcoholRange,
                        min: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Min"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  value={filters.alcoholRange.max}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      alcoholRange: {
                        ...filters.alcoholRange,
                        max: Number(e.target.value),
                      },
                    })
                  }
                  placeholder="Max"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Disponibilité
            </label>
            <div className="space-y-2">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'available', label: 'Disponible' },
                { value: 'unavailable', label: 'Indisponible' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="availability"
                    checked={filters.availability === value}
                    onChange={() =>
                      onFilterChange({
                        ...filters,
                        availability: value as FilterOptions['availability'],
                      })
                    }
                    className="border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
