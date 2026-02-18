import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Shield,
  Check,
  ArrowRight,
  ChevronDown,
  Zap,
  Clock,
  TrendingUp,
  Smartphone,
  Star,
  Rocket,
  Crown,
  Eye,
  Cloud,
} from 'lucide-react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { LandingFooter } from '../../components/Landing/LandingFooter';

interface LandingPageGestionProps {
  onNavigate: (path: string) => void;
}

export const LandingPageGestion: React.FC<LandingPageGestionProps> = ({ onNavigate }) => {
  const [daysUntilMarketplace, setDaysUntilMarketplace] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Calculate days until marketplace launch
  useEffect(() => {
    const marketplaceDate = new Date('2026-03-14');
    const today = new Date();
    const diffTime = marketplaceDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysUntilMarketplace(diffDays > 0 ? diffDays : 0);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Cahier Digital',
      description: 'Enregistrez toutes vos ventes en quelques clics. Fini les cahiers papier illisibles.',
    },
    {
      icon: Package,
      title: 'Suivi des Stocks',
      description: 'Gérez votre inventaire en temps réel. Recevez des alertes avant la rupture.',
    },
    {
      icon: CreditCard,
      title: 'Gestion des Dépenses',
      description: 'Suivez toutes vos dépenses par catégorie. Sachez où part votre argent.',
    },
    {
      icon: Users,
      title: 'Crédits Clients',
      description: 'Gérez les crédits de vos clients. Plus aucun oubli de paiement.',
    },
    {
      icon: BarChart3,
      title: 'Rapports Détaillés',
      description: 'Visualisez vos performances en un coup d\'œil. Prenez les bonnes décisions.',
    },
    {
      icon: Shield,
      title: '100% Sécurisé',
      description: 'Vos données sont sauvegardées automatiquement et protégées.',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Inscrivez-vous',
      description: 'Créez votre compte en 2 minutes. Essai gratuit pendant 30 jours.',
    },
    {
      number: '2',
      title: 'Configurez',
      description: 'Ajoutez vos produits et paramétrez votre établissement.',
    },
    {
      number: '3',
      title: 'Gérez',
      description: 'Commencez à gérer votre activité comme un pro dès aujourd\'hui.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Mensuel',
      price: '6 000',
      period: 'mois',
      features: [
        'Accès complet à toutes les fonctionnalités',
        'Cahier digital illimité',
        'Gestion stocks et dépenses',
        'Rapports et statistiques',
        'Support par email',
      ],
      recommended: false,
    },
    {
      name: 'Semestriel',
      price: '30 000',
      period: '6 mois',
      savings: '1 mois offert',
      features: [
        'Tout du plan Mensuel',
        '1 mois gratuit (économisez 6 000 FCFA)',
        'Accès complet à toutes les fonctionnalités',
        'Support prioritaire',
      ],
      recommended: true,
    },
    {
      name: 'Annuel',
      price: '48 000',
      period: 'an',
      savings: '4 mois offerts',
      features: [
        'Tout du plan Mensuel',
        '4 mois gratuits (économisez 24 000 FCFA)',
        'Meilleur rapport qualité-prix',
        'Support VIP',
      ],
      recommended: false,
    },
  ];

  const testimonials = [
    {
      name: 'Adjoua Marie',
      business: 'Maquis La Joie, Yopougon',
      text: 'Avant RAVITO Gestion, je passais 3 heures par jour à compter mes cahiers. Maintenant, tout est automatique. Je gagne 2 heures par jour !',
      rating: 5,
    },
    {
      name: 'Kouadio Yves',
      business: 'Bar Le Phenix, Cocody',
      text: 'Fini les crédits oubliés ! Grâce à RAVITO, je récupère maintenant tout mon argent. Mon chiffre d\'affaires a augmenté de 15%.',
      rating: 5,
    },
    {
      name: 'Yao K.',
      role: 'Propriétaire de 3 maquis',
      business: 'Abidjan',
      text: 'J\'ai 3 maquis et je ne peux pas être partout. Avec RAVITO, je suis les ventes de chaque établissement en temps réel depuis mon téléphone. Mon gérant sait que je vois tout, fini les surprises à la fin du mois !',
      rating: 5,
    },
    {
      name: 'Bamba Fatou',
      business: 'Restaurant Chez Tantie, Marcory',
      text: 'Simple, rapide et efficace. Même mes employés peuvent l\'utiliser sans formation. C\'est exactement ce dont j\'avais besoin.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Comment fonctionne la période d\'essai ?',
      answer: 'Vous bénéficiez de 30 jours gratuits dès votre inscription. Aucune carte bancaire requise. Vous pouvez tester toutes les fonctionnalités sans engagement.',
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer: 'Nous acceptons les paiements en Espèces, Wave, Orange Money et MTN Money. Choisissez le mode qui vous convient le mieux.',
    },
    {
      question: 'Mes données sont-elles sécurisées ?',
      answer: 'Oui, absolument. Vos données sont chiffrées et sauvegardées automatiquement chaque jour. Vous pouvez également exporter vos données à tout moment.',
    },
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer: 'Oui, vous pouvez résilier votre abonnement quand vous voulez. Aucun frais d\'annulation. Vous conservez l\'accès jusqu\'à la fin de votre période payée.',
    },
    {
      question: 'Puis-je utiliser RAVITO Gestion sans connexion Internet ?',
      answer: 'Oui ! RAVITO Gestion fonctionne en mode offline. Vos données se synchronisent automatiquement dès que vous retrouvez une connexion.',
    },
    {
      question: 'Qu\'est-ce que RAVITO Marketplace ?',
      answer: `RAVITO Marketplace est notre nouvelle plateforme qui arrive le 14 mars 2026. Elle vous permettra de commander vos boissons directement auprès des dépôts 24h/24. Commandez maintenant votre abonnement Gestion pour être parmi les premiers à accéder au Marketplace !`,
    },
    {
      question: 'Est-ce que je peux gérer plusieurs établissements ?',
      answer: 'Oui, mais il vous faudra une inscription par établissement ou par point de vente.',
    },
    {
      question: 'Je suis propriétaire mais c\'est mon gérant qui gère au quotidien. Comment ça marche ?',
      answer: 'Parfait ! Vous créez votre compte en tant que propriétaire, puis vous invitez votre gérant dans votre équipe via "Mon Équipe". Vous définissez ses droits (ce qu\'il peut voir et modifier). Votre gérant utilise l\'app au quotidien, et vous avez accès à toutes les données en temps réel. Vous pouvez modifier ou retirer ses droits à tout moment.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <LandingHeader showNavigation={true} onNavigate={onNavigate} />

      {/* HERO SECTION */}
      <section
        id="hero"
        className="pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-br from-orange-50 via-white to-amber-50 relative overflow-hidden"
      >
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-300 to-amber-300 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-orange-400 to-yellow-400 rounded-full opacity-10 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-4">
              <Crown className="h-4 w-4 mr-2" />
              Idéal pour les propriétaires qui délèguent
            </div>
            <div className="inline-block mb-6 px-4 py-2 bg-orange-100 rounded-full">
              <span className="text-orange-600 font-semibold text-sm">✨ 30 jours d'essai gratuit</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Gérez votre maquis <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                comme un pro
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              La solution digitale qui simplifie la gestion de votre bar, maquis ou restaurant.
              Plus de temps pour développer votre business, moins de temps sur les cahiers.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-8 mb-8 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">2h</div>
                <div className="text-xs sm:text-sm text-gray-600">gagnées/jour</div>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">0</div>
                <div className="text-xs sm:text-sm text-gray-600">erreur de calcul</div>
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 shadow-lg">
                <div className="text-2xl sm:text-3xl font-bold text-orange-500 mb-1">100%</div>
                <div className="text-xs sm:text-sm text-gray-600">sécurisé</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => onNavigate('/register')}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Commencer gratuitement
              </button>
              <button
                onClick={() => scrollToSection('pricing')}
                className="px-8 py-4 border-2 border-orange-500 text-orange-500 rounded-xl hover:bg-orange-50 transition-colors font-semibold text-lg"
              >
                Voir les tarifs
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE ANNOUNCEMENT BANNER */}
      <section className="py-6 sm:py-8 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-3">
              <Rocket className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
              <div>
                <div className="font-bold text-base sm:text-lg">🚀 RAVITO Marketplace arrive bientôt !</div>
                <div className="text-xs sm:text-sm text-purple-100">Commandez vos boissons 24h/24 directement depuis l'app</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 sm:px-6 py-2 sm:py-3">
                <div className="text-2xl sm:text-3xl font-bold">J-{daysUntilMarketplace}</div>
                <div className="text-xs text-purple-100">14 mars 2026</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AVANT/APRÈS SECTION */}
      <section id="avant-apres" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Les problèmes que RAVITO résout
            </h2>
            <p className="text-xl text-gray-600">
              Avant et après RAVITO Gestion
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AVANT */}
            <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-2">
                ❌ Avant RAVITO
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">3 heures par jour pour faire le point de la journée</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Crédits clients oubliés = argent perdu</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Erreurs de calcul fréquentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Stocks mal gérés = ruptures fréquentes</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Pas de vision claire sur les dépenses</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Difficile de prendre les bonnes décisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Gérant qui cache des informations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Cahiers de points qui disparaissent</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 text-xl">•</span>
                  <span className="text-gray-700">Impossible de contrôler à distance</span>
                </li>
              </ul>
            </div>

            {/* APRÈS */}
            <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200">
              <h3 className="text-2xl font-bold text-green-600 mb-6 flex items-center gap-2">
                ✅ Avec RAVITO
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Tout automatisé : gagnez 2h par jour</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Tous vos crédits suivis et récupérés</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Zéro erreur : calculs automatiques précis</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Alertes avant rupture de stock</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Vue claire de toutes vos dépenses</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Rapports détaillés pour mieux décider</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Transparence totale, tout est tracé</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Données sécurisées dans le cloud</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="text-green-500 w-6 h-6 flex-shrink-0" />
                  <span className="text-gray-700">Pilotage en temps réel depuis votre téléphone</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600">
              Une solution complète pour gérer votre établissement
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PILOTAGE PROPRIÉTAIRE */}
      <section id="proprietaires" className="py-16 md:py-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              👑 Propriétaires : Reprenez le contrôle total
            </h2>
            <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
              Fini le manque de transparence et les rapports tronqués. Pilotez votre activité à distance, en temps réel.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-12">
            {/* Point 1 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900">
              <div className="h-12 w-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center mb-4">
                <Crown className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Vous êtes le pilote N°1</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Accès complet à toutes les données</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Tous les droits sur votre établissement</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Vision 360° de votre activité</span>
                </li>
              </ul>
            </div>

            {/* Point 2 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900">
              <div className="h-12 w-12 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg flex items-center justify-center mb-4">
                <Shield className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Contrôle total des accès</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Donnez ou retirez des droits à votre gérant et vos employés</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Définissez qui peut voir ou modifier quoi</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Historique des actions de chaque utilisateur</span>
                </li>
              </ul>
            </div>

            {/* Point 3 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center mb-4">
                <Smartphone className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Pilotage à distance</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Consultez les ventes en temps réel depuis votre téléphone</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Recevez des alertes sur l'activité</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>RAVITO simplifie votre compte rendu quotidien d'activité</span>
                </li>
              </ul>
            </div>

            {/* Point 4 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900">
              <div className="h-12 w-12 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center mb-4">
                <Eye className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Transparence totale</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Fini les rapports tronqués</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Fini les points qui disparaissent avec les cahiers en papier</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Toutes les données sont horodatées et traçables</span>
                </li>
              </ul>
            </div>

            {/* Point 5 */}
            <div className="bg-white rounded-xl p-4 sm:p-6 text-gray-900">
              <div className="h-12 w-12 bg-gradient-to-br from-pink-400 to-rose-400 rounded-lg flex items-center justify-center mb-4">
                <Cloud className="text-white" size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3">Données toujours disponibles</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Changez de téléphone sans perdre vos données</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Accessible sur tablette, ordinateur, téléphone</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>Sauvegarde automatique et sécurisée</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate('/register')}
              className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg shadow-lg inline-flex items-center gap-2"
            >
              Essayer gratuitement pendant 30 jours
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section id="comment-ca-marche" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              3 étapes simples pour démarrer
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-400 text-white rounded-full text-2xl font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-300 to-amber-300"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('/register')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-semibold text-lg shadow-lg"
            >
              Commencer maintenant - C'est gratuit
            </button>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Des tarifs simples et transparents
            </h2>
            <p className="text-xl text-gray-600 mb-2">
              30 jours d'essai gratuit - Sans carte bancaire
            </p>
            <p className="text-lg text-gray-500">
              Paiement accepté : Espèces, Wave, Orange Money, MTN Money
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl p-6 sm:p-8 border-2 ${
                  plan.recommended
                    ? 'border-orange-500 shadow-2xl sm:scale-105 relative'
                    : 'border-gray-200 shadow-lg'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      ⭐ Recommandé
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  {plan.savings && (
                    <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-3">
                      🎁 {plan.savings}
                    </div>
                  )}
                  <div className="mb-2">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-500 ml-2">FCFA</span>
                  </div>
                  <div className="text-gray-600">par {plan.period}</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="text-green-500 w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigate('/register')}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  Commencer l'essai gratuit
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="temoignages" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Des centaines de propriétaires et gérants satisfaits en Côte d'Ivoire
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-600">{testimonial.business}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
            <p className="text-xl text-gray-600">
              Tout ce que vous devez savoir sur RAVITO Gestion
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFaqIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaqIndex === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 text-white relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Rocket className="w-6 h-6" />
              <span className="font-bold">Prochainement</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              RAVITO Marketplace
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
              <div className="text-5xl sm:text-6xl font-bold">J-{daysUntilMarketplace}</div>
              <div className="text-center sm:text-left">
                <div className="text-xl sm:text-2xl font-semibold">14 mars 2026</div>
                <div className="text-purple-200">Le grand lancement</div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Commandes 24h/24</h3>
                  <p className="text-purple-100">
                    Commandez vos boissons à n'importe quelle heure, même la nuit. Fini les stocks vides !
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Meilleurs prix</h3>
                  <p className="text-purple-100">
                    Comparez les offres de plusieurs dépôts et choisissez la meilleure. Économisez sur chaque commande.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Livraison rapide</h3>
                  <p className="text-purple-100">
                    Recevez vos commandes en moins de 2 heures. Suivi en temps réel de votre livraison.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex items-start gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Tout dans une app</h3>
                  <p className="text-purple-100">
                    Gérez votre activité ET commandez vos stocks depuis la même application. Simple et efficace.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center px-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 inline-block max-w-full">
              <p className="text-base sm:text-xl mb-4">
                🎁 <strong>Offre de lancement :</strong> Les premiers abonnés RAVITO Gestion auront un accès prioritaire au Marketplace !
              </p>
              <button
                onClick={() => onNavigate('/register')}
                className="px-8 py-4 bg-white text-purple-600 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg shadow-lg inline-flex items-center gap-2"
              >
                Créer mon compte maintenant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-orange-500 to-amber-500 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à digitaliser votre gestion ?
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-orange-50">
            Rejoignez des centaines de gérants qui ont déjà fait le choix de RAVITO Gestion
          </p>
          <button
            onClick={() => onNavigate('/register')}
            className="px-8 py-4 bg-white text-orange-500 rounded-xl hover:bg-gray-100 transition-all font-semibold text-lg shadow-xl inline-flex items-center gap-2"
          >
            Démarrer mon essai gratuit maintenant
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-orange-100 mt-4">
            Sans carte bancaire • 30 jours gratuits • Sans engagement
          </p>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};
