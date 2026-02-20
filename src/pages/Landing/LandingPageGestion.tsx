import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Target,
  Lock,
  Bell,
  Wallet,
  TrendingDown,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  Play,
  X,
  Menu,
  MapPin,
  Award,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { LandingFooter } from '../../components/Landing/LandingFooter';

interface LandingPageGestionProps {
  onNavigate: (path: string) => void;
}

// Animation hook for scroll reveal
const useScrollReveal = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
};

// Animated counter component
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({
  end,
  suffix = '',
  duration = 2000,
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let startTime: number;
          const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(easeOutQuart * end));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return (
    <span ref={countRef}>
      {count}
      {suffix}
    </span>
  );
};

// Testimonial carousel component
const TestimonialCarousel: React.FC<{
  testimonials: Array<{
    name: string;
    business: string;
    role?: string;
    text: string;
    rating: number;
    avatar?: string;
  }>;
}> = ({ testimonials }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);

  const goTo = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const next = () => goTo((currentIndex + 1) % testimonials.length);
  const prev = () => goTo((currentIndex - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {testimonials.map((testimonial, index) => (
            <div key={index} className="w-full flex-shrink-0 px-4">
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-orange-100">
                <div className="flex gap-1 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                  "{testimonial.text}"
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xl font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-lg">{testimonial.name}</div>
                    <div className="text-gray-500">{testimonial.role || testimonial.business}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-50 transition-colors"
      >
        <ChevronLeft className="w-6 h-6 text-gray-600" />
      </button>
      <button
        onClick={next}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-orange-50 transition-colors"
      >
        <ChevronRight className="w-6 h-6 text-gray-600" />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-8">
        {testimonials.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex ? 'bg-orange-500 w-8' : 'bg-gray-300 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Feature card with hover effect
const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
  delay: number;
}> = ({ icon: Icon, title, description, color, delay }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`group relative bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${color}`}
      />
      <div className="relative z-10">
        <div
          className={`h-14 w-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="text-white" size={28} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-900 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

// Benefit comparison item
const BenefitItem: React.FC<{
  type: 'before' | 'after';
  text: string;
  delay: number;
}> = ({ type, text, delay }) => {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`flex items-start gap-3 transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {type === 'before' ? (
        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      ) : (
        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
      )}
      <span className={type === 'before' ? 'text-gray-600' : 'text-gray-700'}>{text}</span>
    </div>
  );
};

export const LandingPageGestion: React.FC<LandingPageGestionProps> = ({ onNavigate }) => {
  const [daysUntilMarketplace, setDaysUntilMarketplace] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

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
      title: 'Cahier Digital Intelligent',
      description:
        'Enregistrez vos ventes en 2 clics. Fini les cahiers papier illisibles et les erreurs de calcul.',
      color: 'from-orange-400 to-amber-500',
    },
    {
      icon: Package,
      title: 'Gestion des Stocks',
      description:
        'Suivi en temps réel avec alertes avant rupture. Ne manquez jamais une vente par manque de stock.',
      color: 'from-purple-400 to-indigo-500',
    },
    {
      icon: CreditCard,
      title: 'Suivi des Dépenses',
      description:
        'Catégorisez et analysez toutes vos dépenses. Sachez exactement où va votre argent.',
      color: 'from-emerald-400 to-teal-500',
    },
    {
      icon: Users,
      title: 'Crédits Clients',
      description:
        'Gérez les crédits sans oublier un seul paiement. Récupérez tout votre argent, sans exception.',
      color: 'from-pink-400 to-rose-500',
    },
    {
      icon: BarChart3,
      title: 'Rapports Détaillés',
      description:
        'Visualisez vos performances avec des graphiques clairs. Prenez les bonnes décisions basées sur des données.',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Shield,
      title: '100% Sécurisé',
      description:
        'Vos données sont chiffrées et sauvegardées automatiquement. Changez de téléphone sans rien perdre.',
      color: 'from-violet-400 to-purple-500',
    },
  ];

  const steps = [
    {
      number: '1',
      title: 'Créez votre compte',
      description: 'Inscription en 2 minutes. 30 jours gratuits, sans carte bancaire.',
      icon: Sparkles,
      color: 'from-orange-400 to-amber-500',
    },
    {
      number: '2',
      title: 'Configurez votre établissement',
      description: 'Ajoutez vos produits, vos employés et vos paramètres.',
      icon: Target,
      color: 'from-purple-400 to-indigo-500',
    },
    {
      number: '3',
      title: 'Commencez à gagner du temps',
      description: 'Gérez votre activité comme un pro et gagnez 2h par jour.',
      icon: Zap,
      color: 'from-emerald-400 to-teal-500',
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
      badge: null,
    },
    {
      name: 'Semestriel',
      price: '30 000',
      period: '6 mois',
      savings: '1 mois offert',
      savingsValue: '6 000 FCFA',
      features: [
        'Tout du plan Mensuel',
        'Support prioritaire',
        'Export avancé des données',
        'Rapports personnalisés',
      ],
      recommended: true,
      badge: 'Plus populaire',
    },
    {
      name: 'Annuel',
      price: '48 000',
      period: 'an',
      savings: '4 mois offerts',
      savingsValue: '24 000 FCFA',
      features: [
        'Tout du plan Semestriel',
        'Support VIP 24/7',
        'Formation personnalisée',
        'Accès prioritaire aux nouveautés',
      ],
      recommended: false,
      badge: 'Meilleur rapport',
    },
  ];

  const testimonials = [
    {
      name: 'Adjoua Marie',
      business: 'Maquis La Joie, Yopougon',
      text: 'Avant RAVITO Gestion, je passais 3 heures par jour à compter mes cahiers. Maintenant, tout est automatique. Je gagne 2 heures par jour que je consacre à développer mon business !',
      rating: 5,
    },
    {
      name: 'Kouadio Yves',
      business: 'Bar Le Phenix, Cocody',
      text: 'Fini les crédits oubliés ! Grâce à RAVITO, je récupère maintenant tout mon argent. Mon chiffre d\'affaires a augmenté de 15% en seulement 3 mois.',
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
      text: 'Simple, rapide et efficace. Même mes employés peuvent l\'utiliser sans formation. C\'est exactement ce dont j\'avais besoin pour moderniser mon restaurant.',
      rating: 5,
    },
  ];

  const faqs = [
    {
      question: 'Comment fonctionne la période d\'essai de 30 jours ?',
      answer:
        'Vous bénéficiez de 30 jours gratuits dès votre inscription. Aucune carte bancaire n\'est requise. Vous pouvez tester TOUTES les fonctionnalités sans aucune limitation. À la fin de la période, vous choisissez si vous souhaitez continuer avec un abonnement payant.',
    },
    {
      question: 'Quels sont les modes de paiement acceptés ?',
      answer:
        'Nous acceptons les paiements en Espèces, Wave, Orange Money et MTN Money. Choisissez le mode qui vous convient le mieur. Le paiement est simple et sécurisé.',
    },
    {
      question: 'Mes données sont-elles vraiment sécurisées ?',
      answer:
        'Absolument ! Vos données sont chiffrées avec les meilleurs standards de sécurité et sauvegardées automatiquement chaque jour. Vous pouvez également exporter vos données à tout moment. Vos informations ne seront jamais partagées avec des tiers.',
    },
    {
      question: 'Puis-je annuler mon abonnement à tout moment ?',
      answer:
        'Oui, vous pouvez résilier votre abonnement quand vous voulez, sans aucun frais d\'annulation. Vous conservez l\'accès à toutes vos fonctionnalités jusqu\'à la fin de votre période payée.',
    },
    {
      question: 'RAVITO Gestion fonctionne-t-il sans connexion Internet ?',
      answer:
        'Oui ! RAVITO Gestion fonctionne en mode offline. Vos données se synchronisent automatiquement dès que vous retrouvez une connexion. Vous ne perdez jamais de vente, même sans internet.',
    },
    {
      question: 'Qu\'est-ce que RAVITO Marketplace et quand arrive-t-il ?',
      answer:
        'RAVITO Marketplace est notre nouvelle plateforme qui arrive le 14 mars 2026. Elle vous permettra de commander vos boissons directement auprès des dépôts 24h/24. En vous abonnant maintenant à Gestion, vous aurez un accès prioritaire au Marketplace !',
    },
    {
      question: 'Je suis propriétaire mais c\'est mon gérant qui gère au quotidien. Comment ça marche ?',
      answer:
        'Parfait ! Vous créez votre compte en tant que propriétaire, puis vous invitez votre gérant dans votre équipe via "Mon Équipe". Vous définissez ses droits (ce qu\'il peut voir et modifier). Votre gérant utilise l\'app au quotidien, et vous avez accès à toutes les données en temps réel depuis votre téléphone.',
    },
    {
      question: 'Puis-je gérer plusieurs établissements avec un seul compte ?',
      answer:
        'Actuellement, chaque établissement nécessite une inscription séparée pour garantir une gestion optimale. Cependant, nous travaillons sur une fonctionnalité multi-établissements qui sera disponible prochainement.',
    },
  ];

  const ownerBenefits = [
    {
      icon: Crown,
      title: 'Vous êtes le pilote N°1',
      description: 'Accès complet à toutes les données et tous les droits sur votre établissement.',
      color: 'from-orange-400 to-amber-500',
    },
    {
      icon: Lock,
      title: 'Contrôle total des accès',
      description: 'Donnez ou retirez des droits à votre gérant et vos employés en un clic.',
      color: 'from-purple-400 to-indigo-500',
    },
    {
      icon: Smartphone,
      title: 'Pilotage à distance',
      description: 'Consultez les ventes en temps réel depuis votre téléphone, où que vous soyez.',
      color: 'from-blue-400 to-cyan-500',
    },
    {
      icon: Eye,
      title: 'Transparence totale',
      description: 'Fini les rapports tronqués. Toutes les données sont horodatées et traçables.',
      color: 'from-green-400 to-emerald-500',
    },
    {
      icon: Cloud,
      title: 'Données toujours disponibles',
      description: 'Changez de téléphone sans perdre vos données. Sauvegarde automatique.',
      color: 'from-pink-400 to-rose-500',
    },
    {
      icon: Bell,
      title: 'Alertes en temps réel',
      description: 'Recevez des notifications sur l\'activité de votre établissement.',
      color: 'from-violet-400 to-purple-500',
    },
  ];

  const beforeAfter = {
    before: [
      '3 heures par jour pour faire le point',
      'Crédits clients oubliés = argent perdu',
      'Erreurs de calcul fréquentes',
      'Stocks mal gérés = ruptures fréquentes',
      'Pas de vision claire sur les dépenses',
      'Difficile de prendre les bonnes décisions',
      'Gérant qui cache des informations',
      'Cahiers de points qui disparaissent',
      'Impossible de contrôler à distance',
    ],
    after: [
      'Tout automatisé : gagnez 2h par jour',
      'Tous vos crédits suivis et récupérés',
      'Zéro erreur : calculs automatiques précis',
      'Alertes avant rupture de stock',
      'Vue claire de toutes vos dépenses',
      'Rapports détaillés pour mieux décider',
      'Transparence totale, tout est tracé',
      'Données sécurisées dans le cloud',
      'Pilotage en temps réel depuis votre téléphone',
    ],
  };

  const { ref: statsRef, isVisible: statsVisible } = useScrollReveal();
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollReveal();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header */}
      <LandingHeader showNavigation={true} onNavigate={onNavigate} />

      {/* HERO SECTION - Modern & Impactful */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-white to-amber-50" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-orange-400/20 to-yellow-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-br from-purple-300/10 to-indigo-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Floating Elements */}
        <div className="absolute top-32 left-10 w-20 h-20 bg-orange-400/10 rounded-2xl rotate-12 animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute top-48 right-20 w-16 h-16 bg-amber-400/10 rounded-full animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/4 w-12 h-12 bg-purple-400/10 rounded-xl -rotate-12 animate-bounce" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-sm font-semibold animate-pulse">
                  <Crown className="h-4 w-4" />
                  Idéal pour les propriétaires
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 rounded-full text-sm font-semibold">
                  <Sparkles className="h-4 w-4" />
                  30 jours gratuits
                </div>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                Gérez votre{' '}
                <span className="relative">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600">
                    maquis
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path
                      d="M2 8C50 2 150 2 198 8"
                      stroke="url(#gradient)"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{' '}
                comme un pro
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                La solution digitale qui simplifie la gestion de votre bar, maquis ou restaurant.
                <span className="text-orange-600 font-semibold"> Gagnez 2h par jour</span> et
                augmentez vos revenus.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
                <button
                  onClick={() => onNavigate('/register')}
                  className="group px-8 py-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/25 hover:shadow-2xl hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1 flex items-center justify-center gap-2"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => scrollToSection('pricing')}
                  className="px-8 py-4 bg-white text-gray-700 border-2 border-gray-200 rounded-2xl font-bold text-lg hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Voir les tarifs
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Sans carte bancaire
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Sans engagement
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Support 24/7
                </div>
              </div>
            </div>

            {/* Right Content - Stats Cards */}
            <div ref={statsRef} className="relative">
              <div className="grid grid-cols-2 gap-4">
                {/* Main Stat Card */}
                <div
                  className={`col-span-2 bg-white rounded-3xl p-6 shadow-xl border border-orange-100 transition-all duration-700 ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gray-900">
                        <AnimatedCounter end={2} />h
                      </div>
                      <div className="text-gray-500">gagnées par jour</div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full" />
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div
                  className={`bg-white rounded-2xl p-5 shadow-lg border border-gray-100 transition-all duration-700 delay-100 ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center mb-3">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">+15%</div>
                  <div className="text-sm text-gray-500">CA en moyenne</div>
                </div>

                {/* Stat Card 3 */}
                <div
                  className={`bg-white rounded-2xl p-5 shadow-lg border border-gray-100 transition-all duration-700 delay-200 ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center mb-3">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-500">utilisateurs</div>
                </div>

                {/* Stat Card 4 */}
                <div
                  className={`col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white transition-all duration-700 delay-300 ${
                    statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-200 mb-1">RAVITO Marketplace</div>
                      <div className="text-2xl font-bold">J-{daysUntilMarketplace}</div>
                    </div>
                    <Rocket className="w-10 h-10 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-400" />
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <section className="py-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-400">500+</div>
              <div className="text-sm text-gray-400">Établissements</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-400">50K+</div>
              <div className="text-sm text-gray-400">Ventes enregistrées</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-400">4.9/5</div>
              <div className="text-sm text-gray-400">Note moyenne</div>
            </div>
            <div className="hidden md:block w-px h-12 bg-gray-700" />
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-400">24/7</div>
              <div className="text-sm text-gray-400">Support client</div>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE/AFTER SECTION */}
      <section id="avant-apres" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
              <Target className="h-4 w-4" />
              Les problèmes que nous résolvons
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Avant vs Après RAVITO
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Découvrez comment RAVITO transforme la gestion de votre établissement au quotidien
            </p>
          </div>

          <div ref={benefitsRef} className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* BEFORE */}
            <div className="relative bg-gradient-to-br from-red-50 to-rose-50 rounded-3xl p-8 border-2 border-red-200">
              <div className="absolute -top-4 left-8 px-4 py-2 bg-red-500 text-white rounded-full font-bold flex items-center gap-2">
                <X className="w-4 h-4" />
                Avant RAVITO
              </div>
              <ul className="space-y-4 mt-4">
                {beforeAfter.before.map((item, index) => (
                  <BenefitItem key={index} type="before" text={item} delay={index * 50} />
                ))}
              </ul>
            </div>

            {/* AFTER */}
            <div className="relative bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border-2 border-green-200">
              <div className="absolute -top-4 left-8 px-4 py-2 bg-green-500 text-white rounded-full font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Avec RAVITO
              </div>
              <ul className="space-y-4 mt-4">
                {beforeAfter.after.map((item, index) => (
                  <BenefitItem key={index} type="after" text={item} delay={index * 50} />
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold mb-4">
              <Zap className="h-4 w-4" />
              Fonctionnalités puissantes
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Une solution complète et intuitive pour gérer votre établissement comme un pro
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* OWNER SECTION */}
      <section id="proprietaires" className="py-20 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4">
              <Crown className="h-4 w-4" />
              Pour les propriétaires
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Reprenez le contrôle total
            </h2>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Fini le manque de transparence et les rapports tronqués. Pilotez votre activité à
              distance, en temps réel.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ownerBenefits.map((benefit, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <div
                  className={`h-12 w-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <benefit.icon className="text-white" size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('/register')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
            >
              Essayer gratuitement pendant 30 jours
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="comment-ca-marche" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-4">
              <Play className="h-4 w-4" />
              Simple et rapide
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Trois étapes simples pour transformer votre gestion
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div
                    className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-6 shadow-lg`}
                  >
                    <step.icon size={32} />
                  </div>
                  <div className="inline-flex items-center justify-center w-8 h-8 bg-gray-900 text-white rounded-full text-sm font-bold mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-full">
                    <ArrowRight className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section
        id="pricing"
        className="py-20 md:py-32 bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold mb-4">
              <Wallet className="h-4 w-4" />
              Tarifs transparents
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Des tarifs adaptés à votre besoin
            </h2>
            <p className="text-xl text-gray-600 mb-2">30 jours d'essai gratuit</p>
            <p className="text-gray-500">
              Paiement : Espèces, Wave, Orange Money, MTN Money
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl ${
                  plan.recommended
                    ? 'border-2 border-orange-500 shadow-xl scale-105 z-10'
                    : 'border border-gray-200 hover:border-orange-200'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-4 py-1 rounded-full text-sm font-bold ${
                        plan.recommended
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  {plan.savings && (
                    <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                      🎁 {plan.savings}
                    </div>
                  )}
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-xl text-gray-500">FCFA</span>
                  </div>
                  <div className="text-gray-500">par {plan.period}</div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onNavigate('/register')}
                  className={`w-full py-4 rounded-xl font-bold transition-all ${
                    plan.recommended
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
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

      {/* TESTIMONIALS SECTION */}
      <section id="temoignages" className="py-20 md:py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold mb-4">
              <Star className="h-4 w-4" />
              Ils nous font confiance
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des centaines de propriétaires et gérants satisfaits en Côte d'Ivoire
            </p>
          </div>

          <TestimonialCarousel testimonials={testimonials} />
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-20 md:py-32 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              <HelpCircle className="h-4 w-4" />
              Questions fréquentes
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Vous avez des questions ?
            </h2>
            <p className="text-xl text-gray-600">Tout ce que vous devez savoir sur RAVITO Gestion</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`bg-white rounded-2xl border transition-all duration-300 ${
                  openFaqIndex === index
                    ? 'border-orange-300 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-300 ${
                      openFaqIndex === index ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaqIndex === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-5 text-gray-600 leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MARKETPLACE PREVIEW */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6">
              <Rocket className="w-4 h-4" />
              Prochainement
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">RAVITO Marketplace</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="text-6xl md:text-7xl font-bold text-white">J-{daysUntilMarketplace}</div>
              <div className="text-center sm:text-left">
                <div className="text-2xl font-semibold text-white">14 mars 2026</div>
                <div className="text-purple-200">Le grand lancement</div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {[
              {
                icon: Clock,
                title: 'Commandes 24h/24',
                description: 'Commandez vos boissons à n\'importe quelle heure',
              },
              {
                icon: TrendingUp,
                title: 'Meilleurs prix',
                description: 'Comparez les offres de plusieurs dépôts',
              },
              {
                icon: Zap,
                title: 'Livraison rapide',
                description: 'Recevez en moins de 2 heures',
              },
              {
                icon: Smartphone,
                title: 'Tout dans une app',
                description: 'Gestion + commandes au même endroit',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-colors"
              >
                <div className="bg-white/20 rounded-xl p-3 w-fit mb-4">
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-purple-100 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 inline-block max-w-2xl">
              <p className="text-xl text-white mb-6">
                🎁 <strong>Offre de lancement :</strong> Les premiers abonnés RAVITO Gestion auront
                un accès prioritaire au Marketplace !
              </p>
              <button
                onClick={() => onNavigate('/register')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl"
              >
                Créer mon compte maintenant
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full opacity-10 blur-3xl" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Prêt à digitaliser votre gestion ?
          </h2>
          <p className="text-xl md:text-2xl mb-10 text-orange-50">
            Rejoignez des centaines de gérants qui ont déjà fait le choix de RAVITO Gestion
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={() => onNavigate('/register')}
              className="group px-8 py-4 bg-white text-orange-600 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl inline-flex items-center justify-center gap-2"
            >
              Démarrer mon essai gratuit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-orange-100">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sans carte bancaire
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              30 jours gratuits
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Sans engagement
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <LandingFooter onNavigate={onNavigate} />
    </div>
  );
};

// Missing import for HelpCircle
const HelpCircle = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// X icon component
const X = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default LandingPageGestion;
