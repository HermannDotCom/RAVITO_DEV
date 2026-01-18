import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useResponsive } from '../../hooks/useResponsive';

interface MobileAccordionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accordion component for mobile-friendly collapsible content
 * - Opens by default on desktop
 * - Closes by default on mobile
 * - Useful for hiding heavy content on mobile screens
 */
export const MobileAccordion: React.FC<MobileAccordionProps> = ({
  title,
  icon,
  defaultOpen,
  children,
  className = '',
}) => {
  const { isDesktop } = useResponsive();
  const [isOpen, setIsOpen] = useState(defaultOpen ?? isDesktop);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-700">{icon}</span>}
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};
