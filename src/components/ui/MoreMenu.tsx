import React, { useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

export interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: {
    id: string;
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    badge?: number;
    onClick: () => void;
  }[];
}

export const MoreMenu: React.FC<MoreMenuProps> = ({ isOpen, onClose, items }) => {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up max-h-[75vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-label="Menu supplémentaire"
      >
        {/* Handle */}
        <div className="flex justify-center py-3 flex-shrink-0">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Items - Scrollable */}
        <div className="px-4 pb-24 space-y-1 overflow-y-auto flex-1 min-h-0">
          {items.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { 
                  item.onClick(); 
                  onClose(); 
                }}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-orange-600" />
                </div>
                <span className="flex-1 text-left font-medium text-gray-900 truncate">
                  {item.label}
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
