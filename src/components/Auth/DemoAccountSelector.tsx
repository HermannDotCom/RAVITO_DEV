import React from 'react';
import { User, Shield, Package, Calculator, Truck } from 'lucide-react';
import { DemoAccount } from '../../data/demoAccounts';
import { useAuth } from '../../context/AuthContext';

interface DemoAccountSelectorProps {
  accounts: DemoAccount[];
  onBackToLogin: () => void;
}

export const DemoAccountSelector: React.FC<DemoAccountSelectorProps> = ({ 
  accounts, 
  onBackToLogin 
}) => {
  const { loginWithDemo } = useAuth();

  const handleSelectAccount = (account: DemoAccount) => {
    loginWithDemo(account);
  };

  const getAccountIcon = (role: string, profileType: string) => {
    if (role === 'admin') {
      if (profileType.includes('Comptable')) {
        return <Calculator className="h-6 w-6 text-white" />;
      }
      return <Shield className="h-6 w-6 text-white" />;
    }
    if (role === 'client') {
      return <User className="h-6 w-6 text-white" />;
    }
    if (profileType.includes('Coursier')) {
      return <Truck className="h-6 w-6 text-white" />;
    }
    return <Package className="h-6 w-6 text-white" />;
  };

  const getAccountColor = (role: string, profileType: string) => {
    if (role === 'admin') {
      if (profileType.includes('Comptable')) {
        return 'from-green-500 to-green-600';
      }
      return 'from-purple-500 to-purple-600';
    }
    if (role === 'client') {
      return 'from-blue-500 to-blue-600';
    }
    if (profileType.includes('Coursier')) {
      return 'from-green-500 to-green-600';
    }
    return 'from-orange-500 to-orange-600';
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur';
      case 'client':
        return 'Client (Maquis/Bar)';
      case 'supplier':
        return 'Fournisseur';
      default:
        return role;
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">DN</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Comptes de Démonstration</h2>
          <p className="text-gray-600 mt-2">Sélectionnez un profil pour tester DISTRI-NIGHT</p>
        </div>

        <div className="space-y-4 mb-6">
          {accounts.map((account) => (
            <button
              key={account.id}
              onClick={() => handleSelectAccount(account)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all group text-left"
            >
              <div className="flex items-center space-x-4">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${getAccountColor(account.role, account.profileType)} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  {getAccountIcon(account.role, account.profileType)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {account.name}
                    </h3>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {getRoleLabel(account.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{account.profileType}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>📧 {account.email}</span>
                    <span>🔑 {account.password}</span>
                  </div>
                </div>
                
                <div className="text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            onClick={onBackToLogin}
            className="w-full text-center text-gray-600 hover:text-orange-600 transition-colors font-medium"
          >
            ← Retour à la connexion manuelle
          </button>
        </div>

        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="h-5 w-5 bg-orange-500 rounded-full flex items-center justify-center mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div className="text-sm">
              <p className="font-medium text-orange-800 mb-1">Mode Démonstration</p>
              <p className="text-orange-700">
                Ces comptes utilisent des données fictives pour tester toutes les fonctionnalités de DISTRI-NIGHT. 
                Les données sont sauvegardées localement dans votre navigateur.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};