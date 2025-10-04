import React, { useState } from 'react';
import { Download, FileText, Table, File, Printer } from 'lucide-react';
import { exportToCSV, exportToJSON, exportToExcel, printTable } from '../../utils/dataExport';

interface ExportButtonProps<T> {
  data: T[];
  filename: string;
  title?: string;
  columns?: { key: keyof T; header: string }[];
  className?: string;
}

export const ExportButton = <T extends Record<string, any>>({
  data,
  filename,
  title = 'Export',
  columns,
  className = '',
}: ExportButtonProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'csv' | 'json' | 'excel' | 'print') => {
    switch (format) {
      case 'csv':
        exportToCSV(data, filename, columns);
        break;
      case 'json':
        exportToJSON(data, filename);
        break;
      case 'excel':
        exportToExcel(data, filename, 'Data', columns);
        break;
      case 'print':
        printTable(data, title, columns);
        break;
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download className="h-5 w-5" />
        <span>Exporter</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="py-2">
              <button
                onClick={() => handleExport('csv')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">CSV</div>
                  <div className="text-xs text-gray-500">Compatible Excel</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('excel')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Table className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Excel</div>
                  <div className="text-xs text-gray-500">Format .xls</div>
                </div>
              </button>

              <button
                onClick={() => handleExport('json')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <File className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">JSON</div>
                  <div className="text-xs text-gray-500">Format données</div>
                </div>
              </button>

              <div className="border-t border-gray-200 my-2" />

              <button
                onClick={() => handleExport('print')}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <Printer className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-900">Imprimer</div>
                  <div className="text-xs text-gray-500">Aperçu avant impression</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
