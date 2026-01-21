/**
 * QuickMessages Component
 * Displays pre-defined quick reply buttons based on user role
 */

import React from 'react';
import { QUICK_MESSAGES, type MessageSenderRole } from '../../types/messaging';

interface QuickMessagesProps {
  role: MessageSenderRole;
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickMessages({ role, onSelect, disabled = false }: QuickMessagesProps) {
  const quickMessages = QUICK_MESSAGES[role];

  return (
    <div className="flex flex-wrap gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200">
      {quickMessages.map((qm) => (
        <button
          key={qm.id}
          onClick={() => onSelect(qm.content)}
          disabled={disabled}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-full 
                     hover:bg-orange-50 hover:border-orange-300 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {qm.label}
        </button>
      ))}
    </div>
  );
}
