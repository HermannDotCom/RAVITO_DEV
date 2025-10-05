import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginFormProps {
  onShowDemoAccounts: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onShowDemoAccounts }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Email ou mot de passe incorrect');
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">DN</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Connexion</h2>
          <p className="text-gray-600 mt-2">Accédez à votre compte DISTRI-NIGHT</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="votre.email@exemple.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            onClick={onShowDemoAccounts}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 focus:ring-4 focus:ring-green-200 transition-all"
          >
            🎭 Tester avec un compte démo
          </button>
          
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-600 text-sm">
              <strong>Comptes de test rapide :</strong>
            </p>
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>👨‍💼 Admin: hermann.nguessan@distri-night.ci / demo123</p>
              <p>🏪 Client: jean.dupont@maquis-bellevue.ci / demo123</p>
              <p>🚛 Fournisseur: amadou.diallo@depot-plateau.ci / demo123</p>
              <p className="text-yellow-600 font-medium">⏳ Test approbation :</p>
              <p className="text-yellow-600">🏪 Client non approuvé: kouadio.yves@maquis-test.ci / demo123</p>
              <p className="text-yellow-600">🚛 Fournisseur non approuvé: diabate.sekou@depot-test.ci / demo123</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            Ou utilisez n'importe quel email/mot de passe pour un compte basique
          </p>
        </div>
      </div>
    </div>
  );
};