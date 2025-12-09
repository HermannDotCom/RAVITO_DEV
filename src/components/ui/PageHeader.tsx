import React from 'react';
import { ChevronLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'premium';
  };
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  backButton?: {
    label?: string;
    onClick: () => void;
  };
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  icon,
  badge,
  actions,
  breadcrumbs,
  backButton
}) => {
  const badgeVariantClasses = {
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    premium: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white'
  };

  return (
    <div className="bg-white border-b-[3px] border-transparent" style={{
      borderImage: 'linear-gradient(90deg, #F97316, #10B981, #F59E0B) 1'
    }}>
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-2 text-sm mb-3">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-gray-400">/</span>}
                {crumb.href ? (
                  <a 
                    href={crumb.href} 
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Back Button */}
        {backButton && (
          <button
            onClick={backButton.onClick}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-orange-600 transition-colors mb-3 group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            <span>{backButton.label || 'Retour'}</span>
          </button>
        )}

        <div className="flex items-start justify-between gap-4">
          {/* Left side: Icon + Title + Subtitle */}
          <div className="flex items-start gap-4 flex-1">
            {/* Icon Circle */}
            {icon && (
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                {icon}
              </div>
            )}

            {/* Title + Subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display font-bold text-2xl text-slate-900">
                  {title}
                </h1>
                {badge && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeVariantClasses[badge.variant]}`}>
                    {badge.label}
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="font-body text-slate-500 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right side: Actions */}
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
