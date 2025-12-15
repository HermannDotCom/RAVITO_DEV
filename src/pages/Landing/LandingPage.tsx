import React from 'react';
import {
  Zap,
  Moon,
  Smartphone,
  Store,
  Truck,
  UserPlus,
  ShoppingCart,
  CreditCard,
  Calculator,
  AlertTriangle,
  MapPin,
  MessageSquare,
  Check,
  ArrowRight,
} from 'lucide-react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { LandingFooter } from '../../components/Landing/LandingFooter';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <LandingHeader showNavigation={true} onNavigate={onNavigate} />

      {/* HERO SECTION */}
      <section
        id="hero"
        className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden"
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-300 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 font-display">
              Le ravitaillement qui ne dort jamais
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Livraison de boissons 24h/24 pour bars, maquis et restaurants à Abidjan
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('/register')}
                className="px-8 py-4 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all font-semibold text-lg shadow-orange-lg hover:shadow-orange-md transform hover:scale-105"
              >
                Commencer maintenant
              </button>
              <button
                onClick={() => scrollToSection('fonctionnalites')}
                className="px-8 py-4 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50 transition-colors font-semibold text-lg"
              >
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* PROPOSITION DE VALEUR */}
      <section id="fonctionnalites" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-orange-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Livraison Rapide</h3>
              <p className="text-gray-600">
                Recevez vos commandes en moins de 2 heures, où que vous soyez à Abidjan
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Moon className="text-orange-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Disponible 24h/24</h3>
              <p className="text-gray-600">
                De jour comme de nuit, RAVITO est là pour vous ravitailler
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="text-orange-500" size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Paiement Mobile</h3>
              <p className="text-gray-600">
                Orange Money, Wave, MTN Money... Payez comme vous voulez
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* POUR QUI ? */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
              Pour qui ?
            </h2>
            <p className="text-xl text-gray-600">
              RAVITO s'adresse aux établissements CHR et aux fournisseurs de boissons
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Card CLIENTS */}
            <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-8">
              <div className="h-16 w-16 bg-orange-500 rounded-lg flex items-center justify-center mb-6 mx-auto lg:mx-0">
                <Store className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center lg:text-left">
                Pour les Établissements CHR
              </h3>
              <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium">
                  Maquis
                </span>
                <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium">
                  Bars
                </span>
                <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium">
                  Restaurants
                </span>
                <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium">
                  Hôtels
                </span>
                <span className="px-3 py-1 bg-white text-orange-600 rounded-full text-sm font-medium">
                  Boîtes de nuit
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Catalogue complet de boissons</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Commande en quelques clics</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Suivi en temps réel</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Gestion de trésorerie</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('/register')}
                className="w-full px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-semibold flex items-center justify-center"
              >
                Créer mon compte client
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>

            {/* Card FOURNISSEURS */}
            <div className="bg-green-50 border-2 border-green-500 rounded-xl p-8">
              <div className="h-16 w-16 bg-green-500 rounded-lg flex items-center justify-center mb-6 mx-auto lg:mx-0">
                <Truck className="text-white" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center lg:text-left">
                Pour les Dépôts de Boissons
              </h3>
              <div className="flex flex-wrap gap-2 mb-6 justify-center lg:justify-start">
                <span className="px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
                  Dépôts
                </span>
                <span className="px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
                  Grossistes
                </span>
                <span className="px-3 py-1 bg-white text-green-600 rounded-full text-sm font-medium">
                  Distributeurs
                </span>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Réception de commandes</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Gestion des livraisons</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Suivi des revenus</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-0.5" size={20} />
                  <span className="text-gray-700">Zones personnalisées</span>
                </li>
              </ul>
              <button
                onClick={() => onNavigate('/register')}
                className="w-full px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-semibold flex items-center justify-center"
              >
                Devenir fournisseur
                <ArrowRight className="ml-2" size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE ? */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              4 étapes simples pour recevoir vos boissons
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <span className="text-white font-bold text-2xl">1</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <UserPlus className="text-orange-500" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-6">Inscription</h3>
              <p className="text-gray-600">
                Créez votre compte gratuitement en 2 minutes
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <span className="text-white font-bold text-2xl">2</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <ShoppingCart className="text-orange-500" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-6">Commande</h3>
              <p className="text-gray-600">
                Parcourez le catalogue et ajoutez vos produits au panier
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <span className="text-white font-bold text-2xl">3</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <CreditCard className="text-orange-500" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-6">Paiement</h3>
              <p className="text-gray-600">
                Payez facilement via Mobile Money
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="relative inline-block mb-4">
                <div className="h-16 w-16 bg-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto">
                  <span className="text-white font-bold text-2xl">4</span>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <Truck className="text-orange-500" size={24} />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 mt-6">Livraison</h3>
              <p className="text-gray-600">
                Recevez votre commande rapidement à votre adresse
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION TARIFICATION - Masquée temporairement pour raisons stratégiques de Go-to-Market
          La tarification reste visible et valide dans les CGU (Article 4)
          Commissions actuelles : 8% clients CHR, 2% fournisseurs
      <section id="tarifs" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-8">
                <div className="h-16 w-16 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <Calculator className="text-orange-500" size={32} />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-display">
                  Tarification transparente
                </h2>
                <p className="text-lg text-gray-600">
                  RAVITO est un service payant avec des commissions claires sur chaque transaction
                </p>
              </div>

              <div className="space-y-4 mb-8">
                {/* Client tarif */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <Store className="text-orange-500 mr-3" size={24} />
                    <span className="font-semibold text-gray-900">Clients (CHR)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-orange-500 mr-2">8%</span>
                    <span className="text-gray-600">de commission sur chaque commande</span>
                  </div>
                </div>

                {/* Supplier tarif */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Truck className="text-green-500 mr-3" size={24} />
                    <span className="font-semibold text-gray-900">Fournisseurs</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-green-500 mr-2">2%</span>
                    <span className="text-gray-600">de commission sur chaque livraison</span>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-amber-50 border-2 border-amber-500 rounded-lg p-6 mb-6">
                <div className="flex">
                  <AlertTriangle className="text-amber-500 mr-3 flex-shrink-0 mt-1" size={24} />
                  <div>
                    <p className="text-gray-900 font-medium mb-2">
                      ⚠️ Information importante
                    </p>
                    <p className="text-gray-700 text-sm">
                      Les tarifs sont susceptibles d'évoluer. RAVITO se réserve le droit de mettre en place un système d'abonnement mensuel à l'avenir. Consultez régulièrement nos CGU.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => onNavigate('/cgu')}
                  className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center"
                >
                  Voir les Conditions Générales d'Utilisation
                  <ArrowRight className="ml-2" size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* ZONES COUVERTES */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
              Nous desservons tout Abidjan
            </h2>
            <p className="text-xl text-gray-600">
              Et nous nous étendons rapidement
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {[
              'Plateau',
              'Cocody',
              'Marcory',
              'Treichville',
              'Yopougon',
              'Abobo',
              'Adjamé',
              'Koumassi',
              'Port-Bouët',
              'Bingerville',
              'Anyama',
            ].map((zone) => (
              <div
                key={zone}
                className="flex items-center px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg"
              >
                <MapPin className="text-orange-500 mr-2 flex-shrink-0" size={18} />
                <span className="text-gray-900 font-medium">{zone}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600">
            <span className="font-medium">Nouvelles zones ajoutées régulièrement</span> • Votre zone n'est pas listée ? Contactez-nous !
          </p>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section id="temoignages" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
              Ce que disent nos utilisateurs
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez les retours de nos premiers partenaires
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center"
              >
                <MessageSquare className="text-gray-400 mx-auto mb-4" size={48} />
                <p className="text-gray-500 font-medium mb-2">Témoignage à venir</p>
                <p className="text-gray-400 text-sm">
                  Les avis de nos utilisateurs apparaîtront ici très bientôt
                </p>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600">
            Vous utilisez RAVITO ? Partagez votre expérience avec nous !
          </p>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 md:py-24 bg-gradient-to-r from-orange-500 to-orange-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">
            Prêt à révolutionner votre ravitaillement ?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Rejoignez RAVITO et ne manquez plus jamais de stock
          </p>
          <button
            onClick={() => onNavigate('/register')}
            className="px-8 py-4 bg-white text-orange-500 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg shadow-xl"
          >
            Créer mon compte gratuitement
          </button>
          <p className="text-orange-100 mt-4">
            Inscription gratuite • Commencez en 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
