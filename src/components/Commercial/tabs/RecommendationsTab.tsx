import React from 'react';
import type { Recommendation } from '../../../types/sales';

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  isLoading: boolean;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  recommendations,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement des conseils...</p>
        </div>
      </div>
    );
  }

  const getCardColor = (type: string) => {
    switch (type) {
      case 'objective':
        return 'bg-blue-50 border-blue-200';
      case 'zone':
        return 'bg-purple-50 border-purple-200';
      case 'bonus':
        return 'bg-green-50 border-green-200';
      case 'ranking':
        return 'bg-yellow-50 border-yellow-200';
      case 'success':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'objective':
        return 'text-blue-600';
      case 'zone':
        return 'text-purple-600';
      case 'bonus':
        return 'text-green-600';
      case 'ranking':
        return 'text-yellow-600';
      case 'success':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">🤖 CONSEILS PERSONNALISÉS</h2>
        <p className="text-gray-600">Basés sur ton activité et tes objectifs</p>
      </div>

      {recommendations.length > 0 ? (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded-lg border-2 p-6 ${getCardColor(rec.type)}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`text-4xl ${getIconColor(rec.type)}`}>
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold mb-2 ${getIconColor(rec.type)}`}>
                    {rec.title}
                  </h3>
                  <p className="text-gray-900 font-medium mb-2">
                    {rec.message}
                  </p>
                  <div className="flex items-start space-x-2 mt-3 p-3 bg-white bg-opacity-70 rounded-lg">
                    <span className="text-gray-700 mt-0.5">→</span>
                    <p className="text-gray-700">
                      {rec.tip}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucun conseil pour le moment
          </h3>
          <p className="text-gray-600">
            Continue ton excellent travail !
          </p>
        </div>
      )}

      {/* Info box */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-3">💡 Comment sont générés les conseils ?</h4>
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Ces conseils sont générés automatiquement en fonction de:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Ta progression vers tes objectifs</li>
            <li>Le nombre de jours restants dans le mois</li>
            <li>Ton classement par rapport aux autres commerciaux</li>
            <li>Les bonus que tu peux débloquer</li>
            <li>Tes performances passées</li>
          </ul>
          <p className="mt-3 pt-3 border-t border-blue-200">
            Les conseils sont mis à jour en temps réel selon ton activité.
          </p>
        </div>
      </div>

      {/* Action suggestions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-semibold text-gray-900 mb-4">🎯 Actions recommandées</h4>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">✓</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Consulte l'onglet "Inscrits"</p>
              <p className="text-sm text-gray-600 mt-1">
                Identifie les clients proches de l'activation et relance-les
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">✓</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Priorise les zones à potentiel</p>
              <p className="text-sm text-gray-600 mt-1">
                Concentre tes efforts sur les secteurs sous-exploités
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">✓</span>
            <div className="flex-1">
              <p className="font-medium text-gray-900">Suis ton classement</p>
              <p className="text-sm text-gray-600 mt-1">
                Compare tes performances avec les autres dans l'onglet "Statistiques"
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
