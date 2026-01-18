import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Full Screen Modal Component
 * - Full screen on mobile (< 640px)
 * - Centered dialog on desktop
 * - Safe area support for iOS
 * - Sticky header and footer
 */
export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  const { isMobile } = useResponsive();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`
          relative bg-white w-full
          ${isMobile ? 'h-[95vh]' : 'h-auto sm:max-h-[90vh]'}
          sm:max-w-lg md:max-w-xl lg:max-w-2xl
          rounded-t-2xl sm:rounded-2xl
          overflow-hidden
          flex flex-col
          ${className}
        `}
      >
        {/* Header - Sticky */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 pb-safe">
          {children}
        </div>

        {/* Footer - Sticky (if provided) */}
        {footer && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 safe-area-bottom">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
