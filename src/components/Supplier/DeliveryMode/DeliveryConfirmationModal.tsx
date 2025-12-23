import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Constants for delivery confirmation
 */
const CONFIRMATION_CODE_LENGTH = 8;

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (code: string) => Promise<boolean>;
  orderNumber: string;
}

/**
 * Modal for confirming delivery with validation code
 * Client provides this code to delivery personnel
 */
export const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  orderNumber,
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (code.length !== CONFIRMATION_CODE_LENGTH) {
      setError(`Le code doit contenir ${CONFIRMATION_CODE_LENGTH} caractères`);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const isValid = await onConfirm(code);
      
      if (isValid) {
        // Success - close modal
        setCode('');
        onClose();
      } else {
        setError('Code incorrect. Veuillez réessayer.');
      }
    } catch (err) {
      setError('Erreur lors de la validation. Réessayez.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Confirmer la livraison
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Order Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600 mb-1">Commande</p>
          <p className="text-lg font-semibold text-gray-900">#{orderNumber}</p>
        </div>

        {/* Code Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entrez le code donné par le client :
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            maxLength={CONFIRMATION_CODE_LENGTH}
            placeholder="ABC12XYZ"
            className="w-full px-4 py-3 text-center text-2xl font-mono font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 uppercase tracking-wider"
            disabled={isValidating}
          />
          <p className="text-xs text-gray-500 mt-2 text-center">
            Code à {CONFIRMATION_CODE_LENGTH} caractères (lettres et chiffres)
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <p className="text-sm text-blue-900">
            💡 Le client a reçu ce code lors de l'acceptation de l'offre. 
            Il doit vous le communiquer pour confirmer la réception de la livraison.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleClose}
            disabled={isValidating}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={isValidating || code.length !== CONFIRMATION_CODE_LENGTH}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? 'Validation...' : '✅ Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};
