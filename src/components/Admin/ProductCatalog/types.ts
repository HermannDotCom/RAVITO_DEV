import { Product } from '../../../types';
import { CreateProductInput, UpdateProductInput } from '../../../services/admin/productAdminService';

export type { Product, CreateProductInput, UpdateProductInput };

export type ViewMode = 'grid' | 'list';

export type SortField = 'name' | 'brand' | 'category' | 'cratePrice' | 'unitPrice' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export interface ProductFilters {
  search: string;
  category: string;
  brand: string;
  isActive: string;
}

export const CATEGORY_LABELS: Record<string, string> = {
  biere: 'Bière',
  soda: 'Soda',
  vin: 'Vin',
  eau: 'Eau',
  spiritueux: 'Spiritueux',
};

export const CATEGORY_COLORS: Record<string, string> = {
  biere: 'bg-amber-100 text-amber-800',
  soda: 'bg-blue-100 text-blue-800',
  vin: 'bg-red-100 text-red-800',
  eau: 'bg-cyan-100 text-cyan-800',
  spiritueux: 'bg-slate-100 text-slate-800',
};

export const CRATE_TYPES = [
  'B33', 'B65', 'B100', 'B50V', 'B100V', 'C6', 'C20', 'CARTON24', 'CARTON6', 'PACK6', 'PACK12',
];

export const CATEGORIES = ['biere', 'soda', 'vin', 'eau', 'spiritueux'];
