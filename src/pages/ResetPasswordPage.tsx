import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PageState = 'loading' | 'valid' | 'invalid' | 'submitting' | 'success';

export const ResetPasswordPage: React.FC = () => {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');

  useEffect(() => {
    const handleRecoveryToken = async () => {
      try {
        console.log('Current URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);
        
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Recovery token check:', { 
          type, 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken 
        });

        if (accessToken && refreshToken) {
          console.log('Setting session with tokens from hash...');
          
          const { data, error:  sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token:  refreshToken,
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setPageState('invalid');
            return;
          }

          if (data.session) {
            console. log('Session established successfully');
            setPageState('valid');
            return;
          }
        }

        console.log('No tokens in hash, checking for existing session...');
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Existing session found');
          setPageState('valid');
          return;
        }

        const timeoutId = setTimeout(() => {
          console.log('Timeout reached, no session established');
          setPageState('invalid');
        }, 3000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth event in ResetPasswordPage:', event);
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) {
            clearTimeout(timeoutId);
            console.log('Session received via auth state change');
            setPageState('valid');
          }
        });

        return () => {
          clearTimeout(timeoutId);
          subscription.unsubscribe();
        };

      } catch (err) {
        console.error('Error handling recovery token:', err);
        setPageState('invalid');
      }
    };

    handleRecoveryToken();
  }, []);

  useEffect(() => {
    if (password. length === 0) {
      setPasswordStrength('weak');
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password. length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/. test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) setPasswordStrength('weak');
    else if (strength <= 3) setPasswordStrength('medium');
    else setPasswordStrength('strong');
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (! password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password. length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setPageState('submitting');

    try {
      // Marquer qu'on est en train de réinitialiser le mot de passe
      // pour que AuthContext ignore les erreurs de fetch qui suivent
      sessionStorage.setItem('resetting_password', 'true');

      const { error:  updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) throw updateError;

      console.log('Password updated successfully! ');

      // Déconnecter immédiatement pour éviter les boucles infinies
      // causées par l'événement USER_UPDATED dans AuthContext
      await supabase.auth.signOut();

      // Nettoyer le flag
      sessionStorage.removeItem('resetting_password');

      // Nettoyer le localStorage
      localStorage.clear();

      // Changer l'état pour afficher le succès
      setPageState('success');

      // Rediriger vers la page de connexion après 2 secondes
      setTimeout(() => {
        window.location.replace('/');
      }, 2000);

    } catch (err:  any) {
      console.error('Error resetting password:', err);
      // Nettoyer le flag en cas d'erreur
      sessionStorage.removeItem('resetting_password');
      setPageState('valid');
      setError(err.message || 'Une erreur est survenue.  Veuillez réessayer.');
    }
  };

  const handleBackToLogin = () => {
    window.location.href = '/login';
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Vérification du lien... </p>
        </div>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Lien invalide ou expiré
              </h2>
              <p className="text-gray-600 mb-6">
                Ce lien de réinitialisation est invalide ou a expiré.  Veuillez demander un nouveau lien. 
              </p>
            </div>
            <button
              onClick={handleBackToLogin}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Mot de passe mis à jour ! 
              </h2>
              <p className="text-gray-600 mb-6">
                Votre mot de passe a été réinitialisé avec succès. 
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Redirection automatique dans quelques secondes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-10">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/Logo_Ravito_avec_slogan.png" 
                alt="Ravito - Le ravitaillement qui ne dort jamais" 
                className="h-32 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Réinitialiser votre mot de passe
            </h2>
            <p className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Entrez votre nouveau mot de passe"
                  disabled={pageState === 'submitting'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={pageState === 'submitting'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ?  'bg-yellow-500' : 'bg-green-500'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? (passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500') : 'bg-gray-200'}`} />
                    <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' :  'bg-gray-200'}`} />
                  </div>
                  <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                    {passwordStrength === 'weak' && 'Mot de passe faible'}
                    {passwordStrength === 'medium' && 'Mot de passe moyen'}
                    {passwordStrength === 'strong' && 'Mot de passe fort'}
                  </p>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">8 caractères minimum</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmer le mot de passe *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Confirmez votre mot de passe"
                  disabled={pageState === 'submitting'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  disabled={pageState === 'submitting'}
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pageState === 'submitting'}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3.5 rounded-lg font-semibold text-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {pageState === 'submitting' ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Réinitialisation... 
                </>
              ) : (
                'Réinitialiser mon mot de passe'
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToLogin}
              className="w-full text-orange-600 hover:text-orange-700 font-medium py-2 transition-colors flex items-center justify-center gap-2"
              disabled={pageState === 'submitting'}
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};