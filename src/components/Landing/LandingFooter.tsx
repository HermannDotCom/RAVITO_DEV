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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Column 1: Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">R</span>
              </div>
              <span className="text-xl font-bold">RAVITO</span>
            </div>
            <p className="text-orange-400 font-semibold mb-2">
              Le ravitaillement qui ne dort jamais
            </p>
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
                  onClick={() => onNavigate('/mentions-legales')}
                  className="text-gray-400 hover:text-orange-400 transition-colors text-sm"
                >
                  Mentions légales
                </button>
              </li>
              <li>
                <span className="text-gray-400 text-sm">Politique de confidentialité</span>
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
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-gray-400 text-sm text-center md:text-left">
            © 2025 RAVITO - Tous droits réservés
          </p>
          <p className="text-gray-400 text-sm text-center md:text-right">
            Fait avec ❤️ en Côte d'Ivoire 🇨🇮
          </p>
        </div>
      </div>
    </footer>
  );
};
