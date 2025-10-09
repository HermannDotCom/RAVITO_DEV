import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md lg:max-w-2xl">
        {isLogin ? (
          <div>
            <LoginForm />
            <div className="text-center mt-8">
              <p className="text-gray-700 text-base">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-orange-600 font-bold hover:text-orange-700 hover:underline transition-all"
                >
                  S'inscrire maintenant
                </button>
              </p>
            </div>
          </div>
        ) : (
          <div>
            <RegisterForm onBackToLogin={() => setIsLogin(true)} />
          </div>
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