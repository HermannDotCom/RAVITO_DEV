import React from 'react';
import { Facebook, Instagram, Mail } from 'lucide-react';

interface LandingFooterProps {
  onNavigate: (path: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({ onNavigate }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer id="contact" className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pb-20 sm:pb-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
          {/* Column 1: Brand */}
          <div>
            <div className="mb-4">
              <img 
                src="/logo_with_slogan_transparent.png" 
                alt="Ravito - Le ravitaillement qui ne dort jamais" 
                className="h-20"
              />
            </div>
            <p className="text-gray-400 text-sm">
              Livraison de boissons 24h/24 pour bars, maquis et restaurants à Abidjan.
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Navigation</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => scrollToSection('hero')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Accueil
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('fonctionnalites')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Fonctionnalités
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('tarifs')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Tarifs
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('contact')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onNavigate('/cgu')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  CGU
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/cgv')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  CGV
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/mentions-legales')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/politique-confidentialite')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Politique de confidentialité
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <Mail size={16} className="text-orange-400 mt-1 mr-2 flex-shrink-0" />
                <div>
                  <a
                    href="mailto:contact@ravito.ci"
                    className="text-gray-400 hover:text-orange-400 transition-colors text-sm block"
                  >
                    contact@ravito.ci
                  </a>
                  <a
                    href="mailto:support@ravito.ci"
                    className="text-gray-400 hover:text-orange-400 transition-colors text-sm block"
                  >
                    support@ravito.ci
                  </a>
                </div>
              </li>
              <li>
                <p className="text-sm text-gray-400 mb-2">Suivez-nous</p>
                <div className="flex space-x-3">
                  <a
                    href="https://facebook.com/ravito.ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="https://instagram.com/ravito.ci"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-orange-400 transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram size={20} />
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-gray-700 my-8"></div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 text-center sm:text-left">
          <p className="text-gray-400 text-xs sm:text-sm">
            © 2025 RAVITO - Tous droits réservés
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Fait avec ❤️ en Côte d'Ivoire 🇨🇮
          </p>
        </div>
      </div>
    </footer>
  );
};
