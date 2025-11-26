import React from 'react';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport,
  disabled = false,
  label = 'Exporter CSV',
  className = ''
}) => {
  return (
    <button
      onClick={onExport}
      disabled={disabled}
      className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <Download className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
};
