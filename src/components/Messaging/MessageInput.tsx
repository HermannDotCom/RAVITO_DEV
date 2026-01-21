/**
 * MessageInput Component
 * Text input field with send button for composing messages
 */

import React, { useState, KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ 
  onSend, 
  disabled = false,
  placeholder = 'Écrire un message...' 
}: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    const trimmed = message.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2 px-4 py-3 bg-white border-t border-gray-200">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-2xl resize-none
                   focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                   disabled:bg-gray-100 disabled:cursor-not-allowed
                   max-h-32"
        style={{ minHeight: '40px' }}
      />
      
      <button
        onClick={handleSend}
        disabled={disabled || !message.trim()}
        className="p-2 bg-orange-500 text-white rounded-full
                   hover:bg-orange-600 transition-colors
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   flex-shrink-0"
        aria-label="Envoyer"
      >
        <Send className="w-5 h-5" />
      </button>
    </div>
  );
}
