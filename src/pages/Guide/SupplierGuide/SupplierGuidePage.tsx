import React, { useState } from 'react';
import {
  BookOpen,
  Rocket,
  Store,
  ClipboardList,
  Send,
  MapPin,
  Wallet,
  BadgeCheck,
  BarChart2,
  Users,
  Headphones,
  ChevronRight,
  Download,
} from 'lucide-react';
import { SUPPLIER_GUIDE_TABS, GuideTab } from './steps';
import { GuideTabContent } from './GuideTabContent';

const TAB_ICONS: Record<string, React.FC<{ className?: string }>> = {
  demarrage: Rocket,
  profil: Store,
  commandes: ClipboardList,
  offres: Send,
  zones: MapPin,
  tresorerie: Wallet,
  abonnement: BadgeCheck,
  intelligence: BarChart2,
  equipe: Users,
  support: Headphones,
};

export const SupplierGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(SUPPLIER_GUIDE_TABS[0].id);

  const currentTab = SUPPLIER_GUIDE_TABS.find((t) => t.id === activeTab) as GuideTab;
  const currentIndex = SUPPLIER_GUIDE_TABS.findIndex((t) => t.id === activeTab);

  const goNext = () => {
    if (currentIndex < SUPPLIER_GUIDE_TABS.length - 1) {
      setActiveTab(SUPPLIER_GUIDE_TABS[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveTab(SUPPLIER_GUIDE_TABS[currentIndex - 1].id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mode Opératoire</h1>
                <p className="text-emerald-100 text-sm mt-0.5">
                  Guide d&apos;utilisation — Interface Fournisseur
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimer
            </button>
          </div>
          <p className="mt-4 text-emerald-100 text-sm leading-relaxed">
            Ce guide décrit le fonctionnement de chaque section de votre espace Fournisseur Ravito.
            Il vous accompagne de la configuration initiale de votre profil jusqu&apos;à la gestion
            quotidienne de vos commandes et de votre trésorerie.
          </p>
          <div className="mt-4 flex items-center gap-2 text-emerald-200 text-xs">
            <span className="bg-white/20 rounded-full px-2 py-0.5">
              {SUPPLIER_GUIDE_TABS.length} sections
            </span>
            <span className="bg-white/20 rounded-full px-2 py-0.5">
              {SUPPLIER_GUIDE_TABS.reduce((acc, t) => acc + t.steps.length, 0)} étapes expliquées
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <nav className="hidden md:flex flex-col gap-1 w-56 flex-shrink-0">
            {SUPPLIER_GUIDE_TABS.map((tab, idx) => {
              const Icon = TAB_ICONS[tab.id] ?? BookOpen;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/20'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium truncate">{tab.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                  {!isActive && (
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {idx + 1}/{SUPPLIER_GUIDE_TABS.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile tab selector */}
            <div className="md:hidden overflow-x-auto">
              <div className="flex gap-2 pb-1">
                {SUPPLIER_GUIDE_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.id] ?? BookOpen;
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                {(() => {
                  const Icon = TAB_ICONS[currentTab.id] ?? BookOpen;
                  return (
                    <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                    {currentTab.label}
                  </h2>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {currentIndex + 1} sur {SUPPLIER_GUIDE_TABS.length} sections
                  </p>
                </div>
              </div>

              <GuideTabContent tab={currentTab} accentColor="emerald" />
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                ← Section précédente
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {currentIndex + 1} / {SUPPLIER_GUIDE_TABS.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex === SUPPLIER_GUIDE_TABS.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Section suivante →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
