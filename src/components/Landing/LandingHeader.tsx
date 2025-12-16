import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

interface LandingHeaderProps {
  showNavigation?: boolean;
  onNavigate: (path: string) => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({ 
  showNavigation = false, 
  onNavigate 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
          >
            <img 
              src="/logo.svg" 
              alt="Ravito Logo" 
              className="h-10 w-10"
            />
            <span className="text-xl font-bold text-gray-900">RAVITO</span>
          </button>

          {/* Desktop Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Accueil
              </button>
              <button
                onClick={() => scrollToSection('fonctionnalites')}
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Fonctionnalités
              </button>
              <button
                onClick={() => scrollToSection('tarifs')}
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Tarifs
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className="text-gray-600 hover:text-orange-500 transition-colors font-medium"
              >
                Contact
              </button>
            </nav>
          )}

          {/* Auth Buttons - Desktop */}
          {showNavigation && (
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => onNavigate('/login')}
                className="px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                Se connecter
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium shadow-orange-sm"
              >
                Créer un compte
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          {showNavigation && (
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {showNavigation && isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('hero')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              Accueil
            </button>
            <button
              onClick={() => scrollToSection('fonctionnalites')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection('tarifs')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              Tarifs
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left px-4 py-2 text-gray-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors font-medium"
            >
              Contact
            </button>
            <div className="pt-3 border-t border-gray-200 space-y-2">
              <button
                onClick={() => onNavigate('/login')}
                className="block w-full px-4 py-2 border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-50 transition-colors font-medium text-center"
              >
                Se connecter
              </button>
              <button
                onClick={() => onNavigate('/register')}
                className="block w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-center"
              >
                Créer un compte
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
