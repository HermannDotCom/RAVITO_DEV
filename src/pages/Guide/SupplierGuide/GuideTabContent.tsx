import React from 'react';
import { CheckCircle, Lightbulb, AlertCircle } from 'lucide-react';
import { GuideTab } from './steps';

interface Props {
  tab: GuideTab;
  accentColor?: 'orange' | 'slate' | 'emerald';
}

export const GuideTabContent: React.FC<Props> = ({ tab, accentColor = 'emerald' }) => {
  const borderColor =
    accentColor === 'orange'
      ? 'border-orange-400'
      : accentColor === 'slate'
      ? 'border-slate-500'
      : 'border-emerald-500';

  const bgColor =
    accentColor === 'orange'
      ? 'bg-orange-50 dark:bg-orange-900/10'
      : accentColor === 'slate'
      ? 'bg-slate-50 dark:bg-slate-800/40'
      : 'bg-emerald-50 dark:bg-emerald-900/10';

  const badgeBg =
    accentColor === 'orange'
      ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
      : accentColor === 'slate'
      ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';

  return (
    <div className="space-y-8">
      <p
        className={`text-gray-600 dark:text-gray-300 text-base leading-relaxed border-l-4 ${borderColor} pl-4 ${bgColor} py-3 pr-4 rounded-r-lg`}
      >
        {tab.intro}
      </p>

      <div className="space-y-5">
        {tab.steps.map((step) => (
          <div
            key={step.number}
            className="flex gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${badgeBg}`}
              >
                {step.number}
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                  {step.title}
                </h4>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {step.description}
              </p>
              {step.tip && (
                <div className="flex items-start gap-2 mt-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-700 dark:text-amber-300 text-xs leading-relaxed">
                    {step.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {tab.notes && tab.notes.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">
              À noter
            </span>
          </div>
          {tab.notes.map((note, i) => (
            <p
              key={i}
              className="text-blue-600 dark:text-blue-300 text-sm leading-relaxed flex items-start gap-2"
            >
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  );
};
