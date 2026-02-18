import React, { useState } from 'react';
import {
  BookOpen,
  Rocket,
  ClipboardList,
  CreditCard,
  Users,
  BadgeCheck,
  User,
  Headphones,
  ChevronRight,
  Download,
} from 'lucide-react';
import { CLIENT_GUIDE_TABS, GuideTab } from './steps';
import { GuideTabContent } from './GuideTabContent';

const TAB_ICONS: Record<string, React.FC<{ className?: string }>> = {
  demarrage: Rocket,
  activite: ClipboardList,
  credits: CreditCard,
  equipe: Users,
  abonnement: BadgeCheck,
  profil: User,
  support: Headphones,
};

export const ClientGuidePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(CLIENT_GUIDE_TABS[0].id);

  const currentTab = CLIENT_GUIDE_TABS.find((t) => t.id === activeTab) as GuideTab;
  const currentIndex = CLIENT_GUIDE_TABS.findIndex((t) => t.id === activeTab);

  const goNext = () => {
    if (currentIndex < CLIENT_GUIDE_TABS.length - 1) {
      setActiveTab(CLIENT_GUIDE_TABS[currentIndex + 1].id);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setActiveTab(CLIENT_GUIDE_TABS[currentIndex - 1].id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mode Opératoire</h1>
                <p className="text-orange-100 text-sm mt-0.5">
                  Guide d&apos;utilisation — Interface Client
                </p>
              </div>
            </div>
            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Imprimer
            </button>
          </div>
          <p className="mt-4 text-orange-50 text-sm leading-relaxed">
            Ce guide vous explique, étape par étape, comment utiliser chaque fonctionnalité de
            votre espace Ravito Gestion. Consultez l&apos;onglet correspondant à la section que
            vous souhaitez découvrir.
          </p>
          <div className="mt-4 flex items-center gap-2 text-orange-100 text-xs">
            <span className="bg-white/20 rounded-full px-2 py-0.5">
              {CLIENT_GUIDE_TABS.length} sections
            </span>
            <span className="bg-white/20 rounded-full px-2 py-0.5">
              {CLIENT_GUIDE_TABS.reduce((acc, t) => acc + t.steps.length, 0)} étapes expliquées
            </span>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <nav className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
            {CLIENT_GUIDE_TABS.map((tab, idx) => {
              const Icon = TAB_ICONS[tab.id] ?? BookOpen;
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-200 dark:shadow-orange-900/30'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isActive
                        ? 'bg-white/20'
                        : 'bg-gray-100 dark:bg-gray-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/20'
                    }`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 ${
                        isActive
                          ? 'text-white'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-orange-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium truncate">{tab.label}</span>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0" />}
                  {!isActive && (
                    <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                      {idx + 1}/{CLIENT_GUIDE_TABS.length}
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
                {CLIENT_GUIDE_TABS.map((tab) => {
                  const Icon = TAB_ICONS[tab.id] ?? BookOpen;
                  const isActive = tab.id === activeTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-orange-500 text-white shadow-sm'
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
                    <div className="w-9 h-9 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-orange-500" />
                    </div>
                  );
                })()}
                <div>
                  <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">
                    {currentTab.label}
                  </h2>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">
                    {currentIndex + 1} sur {CLIENT_GUIDE_TABS.length} sections
                  </p>
                </div>
              </div>

              <GuideTabContent tab={currentTab} />
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
                {currentIndex + 1} / {CLIENT_GUIDE_TABS.length}
              </span>
              <button
                onClick={goNext}
                disabled={currentIndex === CLIENT_GUIDE_TABS.length - 1}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shadow-orange-200 dark:shadow-orange-900/30"
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
