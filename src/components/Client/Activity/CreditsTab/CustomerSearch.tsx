import React from 'react';
import { Search } from 'lucide-react';

interface CustomerSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const CustomerSearch: React.FC<CustomerSearchProps> = ({
  searchTerm,
  onSearchChange,
}) => {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Rechercher un client par nom ou téléphone..."
        className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      />
    </div>
  );
};
