import React, { useState } from 'react';
import { X, UserPlus, AlertCircle, Eye, EyeOff, RefreshCw, CheckCircle, Copy, Info } from 'lucide-react';
import type { MemberRole, OrganizationType } from '../../types/team';
import { RoleSelector } from './RoleSelector';
import { isValidEmail } from '../../utils/validation';
import { SUPER_ADMIN_EXCLUSIVE_PAGES } from '../../constants/pageDefinitions';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (params: {
    email: string;
    fullName: string;
    phone?: string;
    password: string;
    role: MemberRole;
    allowedPages?: string[];
    customRoleId?: string;
  }) => Promise<boolean>;
  organizationType: OrganizationType;
  availableSlots: number;
}

/**
 * Modal for creating new team members (direct creation, not invitation)
 */
export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  organizationType,
  availableSlots
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<MemberRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdMemberInfo, setCreatedMemberInfo] = useState<{
    email: string;
    fullName: string;
    password: string;
  } | null>(null);

  // Generate a random secure password
  const generatePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let newPassword = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      newPassword += charset[randomIndex];
    }
    setPassword(newPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError('Veuillez saisir le nom complet');
      return;
    }

    if (!email.trim()) {
      setError('Veuillez saisir une adresse email');
      return;
    }

    if (!isValidEmail(email)) {
      setError('Adresse email invalide');
      return;
    }

    if (!password || password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (!role) {
      setError('Veuillez sélectionner un rôle');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onCreate({
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        password,
        role: role as MemberRole,
      });
      
      if (success) {
        // Store member info and show success modal with password
        setCreatedMemberInfo({
          email: email.trim(),
          fullName: fullName.trim(),
          password: password,
        });
        setShowSuccessModal(true);
        // Don't reset form or close modal yet - wait for user to see the password
      }
    } catch (err) {
      setError('Une erreur est survenue lors de la création du membre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setEmail('');
      setFullName('');
      setPhone('');
      setPassword('');
      setRole('');
      setError(null);
      onClose();
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setCreatedMemberInfo(null);
    // Reset form
    setEmail('');
    setFullName('');
    setPhone('');
    setPassword('');
    setRole('');
    setError(null);
    onClose();
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[calc(100vh-120px)] flex flex-col">
          {/* Header - fixe */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-2">
              <UserPlus className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Créer un membre
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

          {/* Content - scrollable */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
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

            {/* Full name field */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom complet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isSubmitting || availableSlots === 0}
                placeholder="Jean Dupont"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || availableSlots === 0}
                placeholder="jean.dupont@exemple.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting || availableSlots === 0}
                placeholder="+225 XX XX XX XX XX"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Password field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || availableSlots === 0}
                  placeholder="Minimum 8 caractères"
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    disabled={isSubmitting || availableSlots === 0}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="text-orange-600 hover:text-orange-700 p-1"
                    disabled={isSubmitting || availableSlots === 0}
                    title="Générer un mot de passe"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Le membre recevra ce mot de passe par email
              </p>
            </div>

            {/* Role selector */}
            <RoleSelector
              organizationType={organizationType}
              selectedRole={role}
              onChange={setRole}
              excludeOwner={true}
              disabled={isSubmitting || availableSlots === 0}
            />

            </div>
            
            {/* Footer avec boutons - fixe */}
            <div className="p-4 border-t flex-shrink-0 flex gap-3 justify-end">
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
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Créer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal with Password */}
      {showSuccessModal && createdMemberInfo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseSuccess} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Membre créé avec succès !
              </h3>
              <p className="text-gray-600">
                {createdMemberInfo.fullName} peut maintenant se connecter.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-gray-900 font-mono">{createdMemberInfo.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Mot de passe</p>
                <div className="flex items-center space-x-2">
                  <p className="text-gray-900 font-mono bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                    {createdMemberInfo.password}
                  </p>
                  <button
                    onClick={() => navigator.clipboard.writeText(createdMemberInfo.password)}
                    className="text-orange-600 hover:text-orange-700 p-1"
                    title="Copier le mot de passe"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6 flex items-start space-x-2">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Communiquez ces identifiants au membre. Il pourra changer son mot de passe via "Mot de passe oublié".
              </p>
            </div>
            
            <button
              onClick={handleCloseSuccess}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
