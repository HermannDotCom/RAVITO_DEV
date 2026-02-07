import React from 'react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { AlertTriangle } from 'lucide-react';

interface CGUPageProps {
  onNavigate: (path: string) => void;
}

export const CGUPage: React.FC<CGUPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader showNavigation={false} onNavigate={onNavigate} />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Conditions Générales d'Utilisation
            </h1>
            <p className="text-gray-600">
              Date de dernière mise à jour : 7 février 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Article 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 1 - PRÉSENTATION DU SERVICE
              </h2>
              <p className="text-gray-700 leading-relaxed">
                RAVITO est une plateforme numérique de mise en relation entre les établissements du secteur CHR (Cafés, Hôtels, Restaurants) et les fournisseurs de boissons (dépôts) à Abidjan, Côte d'Ivoire. RAVITO est un service payant fonctionnant sur un modèle de commission. Le service est disponible 24 heures sur 24, 7 jours sur 7.
              </p>
            </section>

            {/* Article 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 2 - DÉFINITIONS
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li><strong>« Plateforme »</strong> : le site web ravito.ci et ses applications</li>
                <li><strong>« Client »</strong> : tout établissement CHR inscrit</li>
                <li><strong>« Fournisseur »</strong> : tout dépôt de boissons inscrit</li>
                <li><strong>« Utilisateur »</strong> : tout Client ou Fournisseur</li>
                <li><strong>« Commande »</strong> : demande d'achat effectuée par un Client</li>
                <li><strong>« Offre »</strong> : proposition commerciale d'un Fournisseur</li>
              </ul>
            </section>

            {/* Article 3 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 3 - INSCRIPTION ET COMPTE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>3.1</strong> Pour utiliser les services, l'Utilisateur doit créer un compte.</p>
                <p><strong>3.2</strong> L'Utilisateur s'engage à fournir des informations exactes et à jour.</p>
                <p><strong>3.3</strong> L'Utilisateur est responsable de la confidentialité de ses identifiants.</p>
                <p><strong>3.4</strong> RAVITO se réserve le droit de refuser ou suspendre tout compte.</p>

                <p><strong>3.5 Sanctions et suspension de compte</strong></p>
                <p className="ml-4">En cas de manquement aux présentes CGU, RAVITO applique les sanctions graduées suivantes :</p>
                <ul className="ml-8 space-y-2 list-disc">
                  <li><strong>1er manquement :</strong> Avertissement écrit (notification par email)</li>
                  <li><strong>2e manquement :</strong> Suspension temporaire du compte pour une durée de 7 jours</li>
                  <li><strong>3e manquement :</strong> Radiation définitive du compte sans préavis</li>
                </ul>
                <p className="ml-4 mt-2">Sont notamment considérés comme manquements :</p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Non-paiement des commissions dues à RAVITO</li>
                  <li>Fourniture de fausses informations ou documents frauduleux</li>
                  <li>Publication d'avis abusifs, diffamatoires ou mensongers</li>
                  <li>Tentative de contournement du système de paiement de la plateforme</li>
                  <li>Comportement nuisible envers les autres utilisateurs</li>
                </ul>
              </div>
            </section>

            {/* Article 4 - IMPORTANT */}
            <section className="mb-8">
              <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-6">
                <div className="flex items-start mb-4">
                  <AlertTriangle className="text-amber-500 mr-3 flex-shrink-0 mt-1" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    ARTICLE 4 - TARIFICATION ET PAIEMENT
                  </h2>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p><strong>4.1 Commissions applicables :</strong></p>
                  <ul className="ml-6 space-y-2">
                    <li>• Clients : 4% du montant de chaque commande</li>
                    <li>• Fournisseurs : 1% du montant de chaque livraison</li>
                  </ul>
                  <p><strong>4.2</strong> Les commissions sont prélevées automatiquement.</p>
                  <div className="bg-amber-100 border border-amber-600 rounded-lg p-4 my-4">
                    <p className="font-bold text-amber-900 mb-2">⚠️ IMPORTANT :</p>
                    <p className="text-amber-900"><strong>4.3</strong> Les tarifs sont susceptibles d'évoluer à tout moment.</p>
                    <p className="text-amber-900"><strong>4.4 Services premium optionnels :</strong> RAVITO propose des services premium optionnels sous forme d'abonnement mensuel facultatif, incluant des fonctionnalités avancées telles que la priorité sur les offres et des outils d'analytics améliorés. Toute mise en place ou modification d'offres premium sera notifiée aux utilisateurs avec un préavis de 30 jours.</p>
                  </div>
                  <p><strong>4.5</strong> Toute modification tarifaire sera notifiée avec un préavis raisonnable.</p>
                  <p><strong>4.6 Modes de paiement :</strong> Orange Money, Wave, MTN Mobile Money, Moov Money, Carte bancaire.</p>
                </div>
              </div>
            </section>

            {/* Article 5 - MODULE RAVITO GESTION */}
            <section className="mb-8">
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ARTICLE 5 - MODULE RAVITO GESTION
                </h2>
                <div className="space-y-3 text-gray-700">
                  <p><strong>5.1 Description du service</strong></p>
                  <p className="ml-4">
                    RAVITO Gestion est un module de gestion d'activité destiné aux établissements CHR. Il permet de gérer l'activité quotidienne : cahier digital, gestion des stocks, suivi des dépenses, crédits clients, rapports et statistiques. Ce module fonctionne de manière autonome et peut être utilisé indépendamment du module RAVITO Marketplace.
                  </p>

                  <p><strong>5.2 Période d'essai gratuite</strong></p>
                  <p className="ml-4">
                    Tout nouvel utilisateur bénéficie d'une période d'essai gratuite de 30 jours à compter de sa première souscription. Durant cette période, l'utilisateur a accès à toutes les fonctionnalités du module RAVITO Gestion sans limitation. Aucun moyen de paiement n'est requis pour bénéficier de la période d'essai.
                  </p>

                  <p><strong>5.3 Abonnement et tarification</strong></p>
                  <p className="ml-4">
                    À l'issue de la période d'essai, l'accès au module RAVITO Gestion nécessite un abonnement payant. Les tarifs sont les suivants :
                  </p>
                  <ul className="ml-8 space-y-1">
                    <li>• <strong>Plan Mensuel :</strong> 6 000 FCFA par mois</li>
                    <li>• <strong>Plan Semestriel :</strong> 30 000 FCFA pour 6 mois (équivalent à 5 mois payés, 1 mois offert)</li>
                    <li>• <strong>Plan Annuel :</strong> 48 000 FCFA par an (équivalent à 8 mois payés, 4 mois offerts)</li>
                  </ul>
                  <p className="ml-4 mt-2">
                    Les paiements sont acceptés en Espèces, Wave, Orange Money et MTN Money. Les factures sont générées automatiquement et envoyées par email. Le renouvellement n'est pas automatique : des rappels sont envoyés à J-30, J-15, J-7 et J-2 avant l'échéance.
                  </p>

                  <p><strong>5.4 Propriété des données</strong></p>
                  <p className="ml-4">
                    L'utilisateur conserve l'entière propriété de toutes les données saisies dans le module RAVITO Gestion (ventes, stocks, dépenses, crédits clients, etc.). RAVITO agit uniquement en tant qu'hébergeur sécurisé de ces données. Les données sont chiffrées et sauvegardées automatiquement chaque jour.
                  </p>

                  <p><strong>5.5 Exportation des données</strong></p>
                  <p className="ml-4">
                    L'utilisateur peut à tout moment exporter ses données au format PDF ou Excel. En cas de résiliation, l'utilisateur dispose d'un délai de 30 jours pour exporter l'intégralité de ses données avant leur suppression définitive des serveurs RAVITO.
                  </p>

                  <p><strong>5.6 Suspension et résiliation</strong></p>
                  <p className="ml-4">
                    En cas de non-paiement à l'échéance, l'accès au module RAVITO Gestion est automatiquement suspendu après un délai de grâce de 1 jour. Durant la suspension, l'utilisateur ne peut plus accéder à ses données mais celles-ci restent conservées pendant 60 jours. L'utilisateur peut réactiver son abonnement à tout moment en effectuant le paiement en attente. Après 60 jours de suspension, le compte et les données peuvent être supprimés définitivement.
                  </p>

                  <p><strong>5.7 Fonctionnement en mode offline</strong></p>
                  <p className="ml-4">
                    Le module RAVITO Gestion est une Progressive Web App (PWA) permettant de travailler sans connexion Internet. Les données saisies en mode offline sont automatiquement synchronisées lors du retour de la connexion. En cas de conflit, l'utilisateur est notifié pour résoudre manuellement les incohérences.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 6 - FONCTIONNEMENT DU SERVICE MARKETPLACE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>6.1</strong> Le Client passe une commande via la Plateforme en sélectionnant les produits souhaités.</p>
                <p><strong>6.2</strong> La commande est diffusée aux Fournisseurs actifs dans la zone de livraison.</p>
                <p><strong>6.3</strong> Les Fournisseurs soumettent des offres avec leurs prix et délais de livraison.</p>
                <p><strong>6.4</strong> Le Client sélectionne l'offre de son choix.</p>
                <p><strong>6.5</strong> Le Client effectue le paiement via les moyens de paiement proposés.</p>
                <p><strong>6.6</strong> Le Fournisseur prépare et livre la commande à l'adresse indiquée.</p>
                <p><strong>6.7</strong> Le Client confirme la réception en saisissant un code de confirmation.</p>
                <p><strong>6.8</strong> Les deux parties peuvent s'évaluer mutuellement à l'issue de la transaction.</p>
              </div>
            </section>

            {/* Article 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 7 - OBLIGATIONS DES CLIENTS
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>7.1</strong> Le Client s'engage à fournir une adresse de livraison exacte et accessible.</p>
                <p><strong>7.2</strong> Le Client doit être présent ou représenté à l'adresse de livraison.</p>
                <p><strong>7.3</strong> Le Client s'engage à payer le montant total de la commande, incluant la commission.</p>
                <p><strong>7.4</strong> Le Client s'engage à évaluer le Fournisseur de manière honnête et constructive.</p>
                <p><strong>7.5</strong> Le Client ne peut utiliser la Plateforme à des fins frauduleuses ou illégales.</p>
              </div>
            </section>

            {/* Article 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 8 - OBLIGATIONS DES FOURNISSEURS
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>8.1</strong> Le Fournisseur doit disposer des agréments et autorisations nécessaires pour son activité.</p>
                <p><strong>8.2</strong> Le Fournisseur s'engage à fournir des produits conformes aux normes sanitaires en vigueur.</p>
                <p><strong>8.3</strong> Le Fournisseur s'engage à respecter les délais de livraison annoncés dans son offre.</p>
                <p><strong>8.4</strong> Le Fournisseur doit livrer les produits en bon état et conformes à la commande.</p>
                <p><strong>8.5</strong> Le Fournisseur s'engage à évaluer le Client de manière honnête et constructive.</p>
                <p><strong>8.6</strong> Le Fournisseur accepte de payer la commission sur chaque livraison effectuée.</p>
              </div>
            </section>

            {/* Article 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 9 - RESPONSABILITÉS
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>9.1</strong> RAVITO agit uniquement en tant qu'intermédiaire de mise en relation.</p>
                <p><strong>9.2</strong> RAVITO n'est pas partie au contrat de vente conclu entre le Client et le Fournisseur.</p>
                <p><strong>9.3</strong> RAVITO n'est pas responsable de la qualité, de la conformité ou de la légalité des produits.</p>
                <p><strong>9.4</strong> RAVITO n'est pas responsable des retards, erreurs ou manquements des Fournisseurs.</p>
                <p><strong>9.5</strong> RAVITO peut néanmoins intervenir en tant que médiateur en cas de litige.</p>
                <p><strong>9.6</strong> RAVITO s'efforce d'assurer la disponibilité de la Plateforme mais ne garantit pas un fonctionnement ininterrompu.</p>
                <p><strong>9.7 Articulation avec les CGV :</strong> Pour tous les aspects commerciaux et transactionnels (tarification, paiements, livraison, garanties), les Conditions Générales de Vente (CGV) de RAVITO prévalent en cas de conflit ou de contradiction entre les CGU et les CGV.</p>
              </div>
            </section>

            {/* Article 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 10 - ANNULATION ET REMBOURSEMENT
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>10.1</strong> Le Client peut annuler sa commande avant acceptation par un Fournisseur sans frais.</p>
                <p><strong>10.2</strong> Après acceptation, l'annulation doit être validée par le Fournisseur.</p>
                <p><strong>10.3</strong> En cas de problème avec la livraison, le Client peut demander un remboursement via le support.</p>
                <p><strong>10.4</strong> Les remboursements sont traités dans un délai de 7 jours ouvrés après validation.</p>
                <p><strong>10.5</strong> Les commissions RAVITO ne sont pas remboursables sauf en cas de dysfonctionnement de la Plateforme.</p>
              </div>
            </section>

            {/* Article 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 11 - PROPRIÉTÉ INTELLECTUELLE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>11.1</strong> La marque RAVITO, le logo, le design et tous les contenus de la Plateforme sont protégés.</p>
                <p><strong>11.2</strong> Toute reproduction, représentation ou exploitation non autorisée est interdite.</p>
                <p><strong>11.3</strong> Les Utilisateurs conservent les droits sur les contenus qu'ils publient (photos, avis).</p>
              </div>
            </section>

            {/* Article 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 12 - DONNÉES PERSONNELLES
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>12.1</strong> RAVITO collecte et traite les données personnelles conformément à la réglementation en vigueur.</p>
                <p><strong>12.2</strong> Les données sont utilisées pour le fonctionnement du service, la facturation et l'amélioration de la Plateforme.</p>
                <p><strong>12.3</strong> L'Utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.</p>
                <p><strong>12.4</strong> Pour exercer ces droits, contacter : <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a></p>
              </div>
            </section>

            {/* Article 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 13 - RÉSILIATION
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>13.1</strong> L'Utilisateur peut supprimer son compte à tout moment via les paramètres de la Plateforme.</p>
                <p><strong>13.2</strong> RAVITO peut suspendre ou résilier un compte en cas de non-respect des CGU.</p>
                <p><strong>13.3</strong> En cas de résiliation, les commandes en cours restent soumises aux présentes CGU.</p>
              </div>
            </section>

            {/* Article 14 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 14 - MODIFICATION DES CGU
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>14.1</strong> RAVITO se réserve le droit de modifier les présentes CGU à tout moment.</p>
                <p><strong>14.2</strong> Les modifications seront notifiées aux Utilisateurs par email ou via la Plateforme.</p>
                <p><strong>14.3</strong> La poursuite de l'utilisation de la Plateforme après notification vaut acceptation des nouvelles CGU.</p>
              </div>
            </section>

            {/* Article 15 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 15 - DROIT APPLICABLE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>15.1</strong> Les présentes CGU sont soumises au droit ivoirien, notamment :</p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Ordonnance n° 2017-500 du 2 août 2017 relative aux échanges électroniques (article 9 sur la clarté des conditions)</li>
                  <li>Acte Uniforme OHADA relatif au droit commercial général (article 116 sur l'équité contractuelle)</li>
                  <li>Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel</li>
                </ul>
                <p className="mt-3"><strong>15.2</strong> En cas de litige, les parties s'efforceront de trouver une solution amiable.</p>
                <p><strong>15.3</strong> À défaut, les tribunaux compétents d'Abidjan, Côte d'Ivoire, seront compétents.</p>
              </div>
            </section>

            {/* Article 16 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 16 - CONTACT
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>Pour toute question relative aux présentes CGU, vous pouvez nous contacter :</p>
                <ul className="space-y-1 ml-6">
                  <li>• Email : <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></li>
                  <li>• Support : <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a></li>
                </ul>
              </div>
            </section>
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
