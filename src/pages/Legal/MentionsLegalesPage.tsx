import React from 'react';
import { LandingHeader } from '../../components/Landing/LandingHeader';

interface MentionsLegalesPageProps {
  onNavigate: (path: string) => void;
}

export const MentionsLegalesPage: React.FC<MentionsLegalesPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader showNavigation={false} onNavigate={onNavigate} />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Mentions Légales
            </h1>
            <p className="text-gray-600">
              Date de dernière mise à jour : 15 décembre 2025
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Section 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                1. ÉDITEUR DU SITE
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="space-y-2 text-gray-700">
                  <p><strong>Raison sociale :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Forme juridique :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Capital social :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Numéro RCCM :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Siège social :</strong> Abidjan, Côte d'Ivoire</p>
                  <p><strong>Adresse :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Téléphone :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                  <p><strong>Email :</strong> <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></p>
                  <p><strong>Directeur de la publication :</strong> <span className="text-amber-600">[À COMPLÉTER]</span></p>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                2. HÉBERGEMENT
              </h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Hébergeur :</strong> Vercel Inc.</p>
                <p><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:text-orange-600">vercel.com</a></p>
              </div>
            </section>

            {/* Section 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                3. PROPRIÉTÉ INTELLECTUELLE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  L'ensemble des contenus présents sur le site ravito.ci (textes, images, graphismes, logo, icônes, sons, logiciels) est la propriété exclusive de RAVITO, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
                </p>
                <p>
                  Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de RAVITO.
                </p>
                <p>
                  La marque RAVITO est une marque déposée. Toute utilisation non autorisée de cette marque constituerait une contrefaçon passible de sanctions pénales.
                </p>
              </div>
            </section>

            {/* Section 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                4. DONNÉES PERSONNELLES
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>Responsable du traitement :</strong> RAVITO</p>
                <p><strong>Contact DPO (Délégué à la Protection des Données) :</strong> <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a></p>
                
                <div className="mt-4">
                  <p className="font-semibold mb-2">Données collectées :</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Données d'identification (nom, prénom, email, téléphone)</li>
                    <li>Données professionnelles (nom de l'établissement, adresse, type d'activité)</li>
                    <li>Données de transaction (commandes, paiements, évaluations)</li>
                    <li>Données de connexion (adresse IP, logs, cookies)</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">Finalités du traitement :</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Gestion des comptes utilisateurs</li>
                    <li>Traitement et suivi des commandes</li>
                    <li>Facturation et paiement des commissions</li>
                    <li>Communication avec les utilisateurs</li>
                    <li>Amélioration de la plateforme et des services</li>
                    <li>Respect des obligations légales et réglementaires</li>
                  </ul>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">Durée de conservation :</p>
                  <p>
                    Les données sont conservées pendant la durée de la relation commerciale et pendant une période de 5 ans après la fin de celle-ci, conformément aux obligations légales.
                  </p>
                </div>

                <div className="mt-4">
                  <p className="font-semibold mb-2">Droits des utilisateurs :</p>
                  <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Droit d'accès à vos données personnelles</li>
                    <li>Droit de rectification de vos données</li>
                    <li>Droit d'effacement de vos données</li>
                    <li>Droit à la portabilité de vos données</li>
                    <li>Droit d'opposition au traitement de vos données</li>
                    <li>Droit de limitation du traitement</li>
                  </ul>
                  <p className="mt-2">
                    Pour exercer ces droits, vous pouvez nous contacter à l'adresse : <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a>
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. COOKIES
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Le site ravito.ci utilise des cookies pour améliorer l'expérience utilisateur et assurer le bon fonctionnement de la plateforme.
                </p>
                
                <div className="mt-4">
                  <p className="font-semibold mb-2">Types de cookies utilisés :</p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (authentification, panier)</li>
                    <li><strong>Cookies de performance :</strong> Permettent d'analyser l'utilisation du site et d'améliorer les services</li>
                    <li><strong>Cookies fonctionnels :</strong> Mémorisent vos préférences (langue, zone géographique)</li>
                  </ul>
                </div>

                <p className="mt-4">
                  Vous pouvez à tout moment gérer vos préférences de cookies via les paramètres de votre navigateur ou via les paramètres de la plateforme.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. LIMITATION DE RESPONSABILITÉ
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  RAVITO s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur le site, mais ne peut garantir l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
                </p>
                <p>
                  RAVITO ne saurait être tenu responsable des erreurs, d'une absence de disponibilité des informations et/ou de la présence de virus sur son site.
                </p>
                <p>
                  RAVITO agit en tant qu'intermédiaire de mise en relation et ne peut être tenu responsable des litiges entre clients et fournisseurs.
                </p>
              </div>
            </section>

            {/* Section 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. LIENS HYPERTEXTES
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Le site ravito.ci peut contenir des liens hypertextes vers d'autres sites internet. RAVITO n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
                </p>
                <p>
                  La mise en place de liens hypertextes vers le site ravito.ci nécessite une autorisation préalable écrite de RAVITO.
                </p>
              </div>
            </section>

            {/* Section 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                8. DROIT APPLICABLE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  Les présentes mentions légales sont soumises au droit ivoirien.
                </p>
                <p>
                  En cas de litige et à défaut d'accord amiable, le litige sera porté devant les tribunaux compétents d'Abidjan.
                </p>
              </div>
            </section>

            {/* Section 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. CONTACT
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :</p>
                <ul className="space-y-1 ml-6">
                  <li>• Email : <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></li>
                  <li>• Support : <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a></li>
                </ul>
              </div>
            </section>

            {/* Note about completion */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-8">
              <p className="text-amber-900 text-sm">
                <strong>Note :</strong> Les sections marquées <span className="text-amber-600">[À COMPLÉTER]</span> devront être remplies avec les informations légales exactes de l'entreprise RAVITO une fois la structure juridique établie.
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="mt-12 text-center">
            <button
              onClick={() => onNavigate('/')}
              className="text-orange-500 hover:text-orange-600 font-medium"
            >
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © 2025 RAVITO - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};
