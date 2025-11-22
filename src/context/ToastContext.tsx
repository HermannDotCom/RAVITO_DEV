import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: Toast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration (default 5 seconds)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900';
    }
  };

  return (
    <div
      className={`
        pointer-events-auto
        flex items-start space-x-3 p-4 rounded-lg border shadow-lg
        transform transition-all duration-300 ease-in-out
        animate-slide-in-right
        ${getColorClasses()}
      `}
      role="alert"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold mb-1">
          {toast.title}
        </p>
        <p className="text-sm opacity-90">
          {toast.message}
        </p>
        
        {toast.action && (
          <button
            onClick={() => {
              toast.action?.onClick();
              onClose(toast.id);
            }}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        aria-label="Fermer la notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Helper hooks for specific toast types
export const useToastNotifications = () => {
  const { showToast } = useToast();

  return {
    success: (title: string, message: string, action?: Toast['action']) => {
      showToast({ type: 'success', title, message, action });
    },
    error: (title: string, message: string, action?: Toast['action']) => {
      showToast({ type: 'error', title, message, action, duration: 8000 });
    },
    info: (title: string, message: string, action?: Toast['action']) => {
      showToast({ type: 'info', title, message, action });
    },
    warning: (title: string, message: string, action?: Toast['action']) => {
      showToast({ type: 'warning', title, message, action, duration: 7000 });
    },
    // Specific notification types
    newOrder: (orderNumber: string, clientName: string, amount: number, onView?: () => void) => {
      showToast({
        type: 'success',
        title: '🔔 Nouvelle Commande !',
        message: `Commande #${orderNumber} de ${clientName} - ${amount.toLocaleString('fr-FR')} FCFA`,
        duration: 0, // Don't auto-dismiss
        action: onView ? { label: 'Voir la commande', onClick: onView } : undefined
      });
    },
    newOffer: (supplierName: string, orderNumber: string, onView?: () => void) => {
      showToast({
        type: 'info',
        title: '📦 Nouvelle Offre Reçue !',
        message: `${supplierName} a fait une offre pour votre commande #${orderNumber}`,
        duration: 0, // Don't auto-dismiss
        action: onView ? { label: 'Voir l\'offre', onClick: onView } : undefined
      });
    },
    orderStatusUpdate: (orderNumber: string, statusLabel: string) => {
      showToast({
        type: 'info',
        title: 'Mise à jour de commande',
        message: `Commande #${orderNumber} : ${statusLabel}`,
      });
    },
    deliveryUpdate: (orderNumber: string, message: string) => {
      showToast({
        type: 'info',
        title: '🚚 Mise à jour de livraison',
        message: `Commande #${orderNumber} : ${message}`,
      });
    },
    orderAccepted: (orderNumber: string, supplierName: string) => {
      showToast({
        type: 'success',
        title: '✅ Commande Acceptée !',
        message: `${supplierName} a accepté votre commande #${orderNumber}`,
      });
    },
    orderRejected: (orderNumber: string, reason?: string) => {
      showToast({
        type: 'warning',
        title: '❌ Commande Refusée',
        message: reason 
          ? `Commande #${orderNumber} refusée : ${reason}`
          : `Commande #${orderNumber} a été refusée`,
        duration: 0, // Don't auto-dismiss
      });
    }
  };
};
