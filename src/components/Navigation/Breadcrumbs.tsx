import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  active?: boolean;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  showHome = true,
  onHomeClick,
}) => {
  return (
    <nav aria-label="Fil d'Ariane" className="mb-4">
      <ol className="flex items-center space-x-2 text-sm">
        {showHome && (
          <>
            <li>
              <button
                onClick={onHomeClick}
                className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Accueil"
              >
                <Home className="h-4 w-4" />
              </button>
            </li>
            {items.length > 0 && (
              <li>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </li>
            )}
          </>
        )}

        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              {item.active || !item.onClick ? (
                <span
                  className="font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <button
                  onClick={item.onClick}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {item.label}
                </button>
              )}
            </li>
            {index < items.length - 1 && (
              <li>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </li>
            )}
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};
