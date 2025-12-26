import React, { useState } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import type { MemberRole, OrganizationType } from '../../types/team';
import { RoleSelector } from './RoleSelector';
import { isValidEmail } from '../../utils/validation';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: MemberRole) => Promise<boolean>;
  organizationType: OrganizationType;
  availableSlots: number;
}

/**
 * Modal for inviting new team members
 */
export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onInvite,
  organizationType,
  availableSlots
}) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<MemberRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError('Veuillez saisir une adresse email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Adresse email invalide');
      return;
    }

    if (!role) {
      setError('Veuillez sélectionner un rôle');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onInvite(email, role as MemberRole);
      
      if (success) {
        // Reset form and close modal
        setEmail('');
        setRole('');
        setError(null);
        onClose();
      }
    } catch (err) {
      setError('Une erreur est survenue lors de l\'invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setRole('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Inviter un membre
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Available slots info */}
            {availableSlots === 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Quota atteint</p>
                  <p className="mt-1">Vous avez atteint le nombre maximum de membres pour votre équipe.</p>
                </div>
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  {availableSlots} place(s) disponible(s) dans votre équipe
                </p>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || availableSlots === 0}
                placeholder="exemple@email.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Role selector */}
            <RoleSelector
              organizationType={organizationType}
              selectedRole={role}
              onChange={setRole}
              excludeOwner={true}
            />

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || availableSlots === 0}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Inviter
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
