import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { DemoAccountSelector } from './DemoAccountSelector';
import { getAllDemoAccounts } from '../../data/demoAccounts';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  if (showDemoAccounts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <DemoAccountSelector
          accounts={getAllDemoAccounts()}
          onBackToLogin={() => setShowDemoAccounts(false)}
        />
        
        {/* Background decorative elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-orange-200 opacity-20 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-200 opacity-20 blur-3xl" />
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md lg:max-w-2xl">
        {isLogin ? (
          <div>
            <LoginForm onShowDemoAccounts={() => setShowDemoAccounts(true)} />
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-orange-600 font-semibold hover:text-orange-700 transition-colors"
                >
                  S'inscrire
                </button>
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setShowDemoAccounts(true)}
                  className="text-orange-600 font-semibold hover:text-orange-700 transition-colors text-sm"
                >
                  🎭 Utiliser un compte de démonstration
                </button>
              </div>
            </div>
          </div>
        ) : (
          <RegisterForm onBackToLogin={() => setIsLogin(true)} />
        )}
      </div>
      
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-orange-200 opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-green-200 opacity-20 blur-3xl" />
      </div>
    </div>
  );
};