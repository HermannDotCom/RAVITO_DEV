import React from 'react';
import { Check, X } from 'lucide-react';
import { useCommission } from '../../context/CommissionContext';

export const PricingSection: React.FC = () => {
  const { commissionSettings, isLoading } = useCommission();

  // Valeurs par défaut en cas de chargement ou d'erreur
  const clientCommission = commissionSettings.clientCommission || 4;
  const supplierCommission = commissionSettings.supplierCommission || 1;

  return (
    <section id="tarifs" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-display">
            Tarification Transparente
          </h2>
          <p className="text-xl text-gray-600">
            Notre modèle de commission simple et équitable
          </p>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500">Chargement des tarifs...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Carte Client */}
            <div className="bg-orange-50 border-4 border-orange-500 rounded-2xl p-8 shadow-xl">
              <h3 className="text-3xl font-bold text-orange-600 mb-4">Client (CHR)</h3>
              <p className="text-gray-600 mb-6">
                Accédez à un service de ravitaillement 24h/24 avec des frais de traitement minimes.
              </p>
              
              <div className="text-5xl font-extrabold text-gray-900 mb-6">
                {clientCommission}%
                <span className="text-xl font-medium text-gray-500 ml-2">de frais de service</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Frais de service de **{clientCommission}%** ajoutés au montant de la commande.</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Accès illimité à tous les fournisseurs.</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Suivi de commande en temps réel.</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Paiement Mobile Money sécurisé.</span>
                </li>
              </ul>
              
              <a 
                href="/register" 
                className="block w-full px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-lg text-center hover:bg-orange-600 transition-colors"
              >
                Commencer en tant que Client
              </a>
            </div>

            {/* Carte Fournisseur */}
            <div className="bg-green-50 border-4 border-green-500 rounded-2xl p-8 shadow-xl">
              <h3 className="text-3xl font-bold text-green-600 mb-4">Fournisseur (Dépôt)</h3>
              <p className="text-gray-600 mb-6">
                Augmentez vos ventes en accédant à une nouvelle clientèle sans effort marketing.
              </p>
              
              <div className="text-5xl font-extrabold text-gray-900 mb-6">
                {supplierCommission}%
                <span className="text-xl font-medium text-gray-500 ml-2">de commission</span>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Commission de **{supplierCommission}%** déduite du montant reversé.</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Accès aux commandes dans vos zones de couverture.</span>
                </li>
                <li className="flex items-start">
                  <Check className="text-green-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Paiement garanti sous 24h après livraison.</span>
                </li>
                <li className="flex items-start">
                  <X className="text-red-500 mr-3 flex-shrink-0 mt-1" size={20} />
                  <span className="text-gray-700">Pas de frais d'abonnement mensuel.</span>
                </li>
              </ul>
              
              <a 
                href="/register" 
                className="block w-full px-6 py-3 bg-green-500 text-white rounded-xl font-semibold text-lg text-center hover:bg-green-600 transition-colors"
              >
                Devenir Fournisseur
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
