import React from 'react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { Shield, Lock, Eye, Database, UserCheck, AlertCircle } from 'lucide-react';

interface PolitiqueConfidentialitePageProps {
  onNavigate: (path: string) => void;
}

export const PolitiqueConfidentialitePage: React.FC<PolitiqueConfidentialitePageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader showNavigation={false} onNavigate={onNavigate} />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <Shield className="text-orange-500" size={48} />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Politique de Confidentialité
            </h1>
            <p className="text-gray-600">
              Date de dernière mise à jour : 5 janvier 2026
            </p>
          </div>

          {/* Intro */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
            <p className="text-gray-700 leading-relaxed">
              RAVITO s'engage à protéger la vie privée et les données personnelles de ses utilisateurs. La présente politique de confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos informations personnelles conformément à la législation ivoirienne et aux meilleures pratiques internationales en matière de protection des données.
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Article 1 */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <Database className="text-orange-500 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  1. RESPONSABLE DU TRAITEMENT DES DONNÉES
                </h2>
              </div>
              <div className="space-y-3 text-gray-700">
                <p><strong>Identité du responsable :</strong></p>
                <div className="ml-4 space-y-1">
                  <p>Nom : RAVITO</p>
                  <p>Siège social : Abidjan, Côte d'Ivoire</p>
                  <p>Email : <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></p>
                  <p>DPO (Délégué à la Protection des Données) : <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a></p>
                </div>
              </div>
            </section>

            {/* Article 2 */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <Eye className="text-orange-500 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  2. DONNÉES COLLECTÉES
                </h2>
              </div>

              <div className="space-y-4 text-gray-700">
                <p><strong>2.1 Données d'identification</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Nom de l'établissement (pour les professionnels)</li>
                  <li>Type de compte (Client ou Fournisseur)</li>
                </ul>

                <p><strong>2.2 Données professionnelles</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Adresse de l'établissement</li>
                  <li>Zone géographique de livraison</li>
                  <li>Type d'activité (bar, maquis, restaurant, dépôt)</li>
                  <li>Agréments et autorisations (pour les fournisseurs)</li>
                </ul>

                <p><strong>2.3 Données de transaction</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Historique des commandes et livraisons</li>
                  <li>Montants des transactions</li>
                  <li>Commissions prélevées (4% clients, 1% fournisseurs)</li>
                  <li>Moyens de paiement utilisés</li>
                  <li>Codes de confirmation de livraison</li>
                </ul>

                <p><strong>2.4 Données de localisation</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Adresses de livraison</li>
                  <li>Coordonnées GPS (si autorisées)</li>
                  <li>Zones de service</li>
                </ul>

                <p><strong>2.5 Données d'utilisation</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Logs de connexion</li>
                  <li>Adresse IP</li>
                  <li>Type de navigateur et d'appareil</li>
                  <li>Données de navigation sur la plateforme</li>
                  <li>Préférences utilisateur</li>
                </ul>

                <p><strong>2.6 Données d'évaluation</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Notes et avis laissés</li>
                  <li>Commentaires sur les transactions</li>
                  <li>Historique de réputation</li>
                </ul>
              </div>
            </section>

            {/* Article 3 */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <UserCheck className="text-orange-500 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  3. FINALITÉS DU TRAITEMENT
                </h2>
              </div>

              <div className="space-y-3 text-gray-700">
                <p>Vos données personnelles sont collectées et traitées pour les finalités suivantes :</p>

                <p><strong>3.1 Gestion des comptes et authentification</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Création et gestion de votre compte utilisateur</li>
                  <li>Authentification et sécurisation de l'accès</li>
                  <li>Vérification de votre identité</li>
                </ul>

                <p><strong>3.2 Mise en relation et traitement des commandes</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Diffusion des commandes aux fournisseurs de la zone</li>
                  <li>Gestion du système d'offres</li>
                  <li>Suivi des livraisons</li>
                  <li>Confirmation de réception avec code</li>
                </ul>

                <p><strong>3.3 Paiements et facturation</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Traitement des paiements sécurisés</li>
                  <li>Calcul et prélèvement des commissions (4% / 1%)</li>
                  <li>Reversement aux fournisseurs</li>
                  <li>Émission de factures et reçus</li>
                </ul>

                <p><strong>3.4 Communication</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Notifications sur l'état des commandes</li>
                  <li>Alertes en temps réel</li>
                  <li>Service client et support technique</li>
                  <li>Informations importantes sur le service</li>
                </ul>

                <p><strong>3.5 Amélioration du service</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Analyse de l'utilisation de la plateforme</li>
                  <li>Statistiques et données agrégées</li>
                  <li>Détection et prévention de la fraude</li>
                  <li>Développement de nouvelles fonctionnalités</li>
                </ul>

                <p><strong>3.6 Conformité légale</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Respect des obligations légales et réglementaires</li>
                  <li>Réponse aux demandes des autorités compétentes</li>
                  <li>Conservation des données comptables</li>
                </ul>
              </div>
            </section>

            {/* Article 4 */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <Lock className="text-orange-500 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  4. BASE LÉGALE DU TRAITEMENT
                </h2>
              </div>

              <div className="space-y-3 text-gray-700">
                <p>Le traitement de vos données personnelles repose sur les bases légales suivantes :</p>

                <p><strong>4.1 Exécution du contrat</strong></p>
                <p className="ml-4">Le traitement est nécessaire à l'exécution des Conditions Générales d'Utilisation et de Vente auxquelles vous avez adhéré en créant votre compte.</p>

                <p><strong>4.2 Consentement</strong></p>
                <p className="ml-4">Pour certains traitements spécifiques (newsletters, notifications push, géolocalisation précise), nous recueillons votre consentement explicite.</p>

                <p><strong>4.3 Obligation légale</strong></p>
                <p className="ml-4">Certaines données doivent être conservées pour respecter nos obligations légales (comptabilité, fiscalité, lutte contre le blanchiment).</p>

                <p><strong>4.4 Intérêt légitime</strong></p>
                <p className="ml-4">Nous traitons certaines données sur la base de notre intérêt légitime à améliorer notre service et à prévenir la fraude.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-blue-900 mb-2">Cadre légal ivoirien</p>
                  <p className="text-blue-800 text-sm">
                    Le traitement de vos données personnelles est effectué conformément à la <strong>Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel</strong> en Côte d'Ivoire et à l'Acte Uniforme OHADA.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                5. DESTINATAIRES DES DONNÉES
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>Vos données personnelles sont accessibles aux destinataires suivants :</p>

                <p><strong>5.1 Personnel autorisé de RAVITO</strong></p>
                <p className="ml-4">Seuls les employés ayant besoin d'accéder à vos données pour l'exécution de leurs missions peuvent les consulter.</p>

                <p><strong>5.2 Autres utilisateurs de la plateforme</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Les fournisseurs voient les commandes et adresses de livraison des clients</li>
                  <li>Les clients voient les informations professionnelles des fournisseurs</li>
                  <li>Les notes et avis sont publics</li>
                </ul>

                <p><strong>5.3 Prestataires de services</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Hébergeur : Vercel (USA) et Supabase (infrastructure cloud sécurisée)</li>
                  <li>Prestataires de paiement : Orange Money, MTN, Moov, Wave</li>
                  <li>Service d'envoi d'emails : Resend</li>
                  <li>Outils d'analyse et monitoring : Sentry</li>
                </ul>

                <p><strong>5.4 Autorités compétentes</strong></p>
                <p className="ml-4">Sur demande légale ou judiciaire, nous pouvons être amenés à communiquer vos données aux autorités ivoiriennes.</p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-900 text-sm">
                    <strong>Note :</strong> Tous nos prestataires sont contractuellement tenus de respecter la confidentialité et la sécurité de vos données.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                6. TRANSFERT DE DONNÉES HORS DE CÔTE D'IVOIRE
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>Certaines de vos données peuvent être transférées et stockées en dehors de la Côte d'Ivoire :</p>

                <p><strong>6.1 Hébergement des données</strong></p>
                <p className="ml-4">Nos serveurs sont hébergés par Vercel (USA) et Supabase (infrastructure internationale). Ces prestataires appliquent des standards de sécurité élevés et sont conformes aux normes internationales.</p>

                <p><strong>6.2 Garanties de protection</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Chiffrement des données en transit et au repos</li>
                  <li>Clauses contractuelles types</li>
                  <li>Certifications de sécurité (ISO 27001, SOC 2)</li>
                </ul>
              </div>
            </section>

            {/* Article 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                7. DURÉE DE CONSERVATION
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>Nous conservons vos données personnelles pendant les durées suivantes :</p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Données de compte actif</td>
                        <td className="py-2">Durée de la relation commerciale</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Données de compte inactif</td>
                        <td className="py-2">3 ans après la dernière connexion</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Données de transaction</td>
                        <td className="py-2">5 ans (obligation légale comptable)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Données de paiement</td>
                        <td className="py-2">5 ans (obligation fiscale)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Logs de connexion</td>
                        <td className="py-2">1 an (sécurité)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-semibold">Avis et évaluations</td>
                        <td className="py-2">Durée de vie du compte</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="mt-4">
                  À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.
                </p>
              </div>
            </section>

            {/* Article 8 */}
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <AlertCircle className="text-orange-500 mr-3" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">
                  8. SÉCURITÉ DES DONNÉES
                </h2>
              </div>

              <div className="space-y-3 text-gray-700">
                <p>RAVITO met en œuvre des mesures techniques et organisationnelles pour protéger vos données :</p>

                <p><strong>8.1 Mesures techniques</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Chiffrement SSL/TLS pour toutes les communications</li>
                  <li>Chiffrement des données sensibles en base de données</li>
                  <li>Authentification sécurisée avec hashage des mots de passe</li>
                  <li>Pare-feu et systèmes de détection d'intrusion</li>
                  <li>Sauvegardes régulières et chiffrées</li>
                  <li>Isolation des données (Row Level Security)</li>
                </ul>

                <p><strong>8.2 Mesures organisationnelles</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Accès limité aux données sur principe du besoin d'en connaître</li>
                  <li>Formation du personnel à la protection des données</li>
                  <li>Procédures de gestion des incidents de sécurité</li>
                  <li>Audits de sécurité réguliers</li>
                </ul>

                <p><strong>8.3 Recommandations pour les utilisateurs</strong></p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Utilisez un mot de passe fort et unique</li>
                  <li>Ne partagez jamais vos identifiants</li>
                  <li>Déconnectez-vous après chaque session sur appareil partagé</li>
                  <li>Signalez toute activité suspecte immédiatement</li>
                </ul>
              </div>
            </section>

            {/* Article 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                9. VOS DROITS
              </h2>

              <div className="space-y-4 text-gray-700">
                <p>Conformément à la législation en vigueur, vous disposez des droits suivants concernant vos données personnelles :</p>

                <div className="space-y-3">
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit d'accès</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez demander une copie de toutes les données que nous détenons sur vous.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit de rectification</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez corriger vos données inexactes ou incomplètes directement depuis votre profil.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit d'effacement</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez demander la suppression de vos données, sauf si nous avons une obligation légale de les conserver.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit à la portabilité</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez récupérer vos données dans un format structuré et lisible par machine.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit d'opposition</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez vous opposer à certains traitements, notamment à des fins de marketing.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit à la limitation</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez demander la limitation du traitement dans certaines circonstances.</p>
                  </div>

                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <p className="font-semibold text-orange-900">✓ Droit de retrait du consentement</p>
                    <p className="text-sm text-orange-800 mt-1">Vous pouvez retirer votre consentement à tout moment pour les traitements basés sur celui-ci.</p>
                  </div>
                </div>

                <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mt-4">
                  <p className="font-semibold text-blue-900 mb-2">Comment exercer vos droits ?</p>
                  <p className="text-blue-800 text-sm">
                    Pour exercer l'un de ces droits, contactez notre Délégué à la Protection des Données :
                  </p>
                  <ul className="ml-6 mt-2 space-y-1 text-blue-800 text-sm">
                    <li>• Email : <a href="mailto:dpo@ravito.ci" className="underline">dpo@ravito.ci</a></li>
                    <li>• En précisant votre demande et en joignant une preuve d'identité</li>
                    <li>• Délai de réponse : 30 jours maximum</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Article 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                10. COOKIES ET TECHNOLOGIES SIMILAIRES
              </h2>

              <div className="space-y-3 text-gray-700">
                <p><strong>10.1 Utilisation des cookies</strong></p>
                <p className="ml-4">La plateforme RAVITO utilise des cookies pour améliorer votre expérience et assurer le bon fonctionnement du service.</p>

                <p><strong>10.2 Types de cookies utilisés</strong></p>

                <div className="ml-4 space-y-2">
                  <div>
                    <p className="font-semibold">Cookies strictement nécessaires (obligatoires)</p>
                    <ul className="ml-6 list-disc text-sm">
                      <li>Authentification et gestion de session</li>
                      <li>Sécurité et prévention de la fraude</li>
                      <li>Panier d'achat et préférences de commande</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Cookies de performance (avec consentement)</p>
                    <ul className="ml-6 list-disc text-sm">
                      <li>Analyse de l'utilisation de la plateforme</li>
                      <li>Statistiques de navigation</li>
                      <li>Détection et résolution des erreurs</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-semibold">Cookies fonctionnels (avec consentement)</p>
                    <ul className="ml-6 list-disc text-sm">
                      <li>Mémorisation de vos préférences (langue, zone)</li>
                      <li>Mode sombre / clair</li>
                      <li>Notifications et alertes</li>
                    </ul>
                  </div>
                </div>

                <p><strong>10.3 Gestion des cookies</strong></p>
                <p className="ml-4">Vous pouvez gérer vos préférences de cookies :</p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Via les paramètres de la plateforme (section "Confidentialité")</li>
                  <li>Via les paramètres de votre navigateur</li>
                  <li>En désactivant les cookies non essentiels</li>
                </ul>

                <p><strong>10.4 Stockage local</strong></p>
                <p className="ml-4">Nous utilisons également le stockage local du navigateur (localStorage) pour mémoriser certaines préférences et améliorer les performances de l'application.</p>
              </div>
            </section>

            {/* Article 11 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                11. DONNÉES DES MINEURS
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>
                  La plateforme RAVITO est destinée exclusivement aux professionnels majeurs (18 ans et plus). Nous ne collectons pas sciemment de données personnelles de mineurs.
                </p>
                <p>
                  Si vous pensez qu'un mineur a fourni des informations personnelles sur notre plateforme, veuillez nous contacter immédiatement à <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a> afin que nous puissions supprimer ces données.
                </p>
              </div>
            </section>

            {/* Article 12 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                12. MODIFICATIONS DE LA POLITIQUE
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>
                  RAVITO se réserve le droit de modifier la présente politique de confidentialité à tout moment pour refléter les évolutions légales, techniques ou de nos pratiques.
                </p>
                <p>
                  En cas de modification substantielle, nous vous en informerons par email ou via une notification sur la plateforme au moins 30 jours avant l'entrée en vigueur des changements.
                </p>
                <p>
                  La date de dernière mise à jour est indiquée en haut de cette page.
                </p>
              </div>
            </section>

            {/* Article 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                13. RÉCLAMATIONS
              </h2>

              <div className="space-y-3 text-gray-700">
                <p>
                  Si vous estimez que le traitement de vos données personnelles ne respecte pas la réglementation applicable, vous pouvez :
                </p>
                <ul className="ml-8 space-y-2 list-decimal">
                  <li>Nous contacter en priorité à <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a></li>
                  <li>Introduire une réclamation auprès de l'autorité de contrôle compétente en Côte d'Ivoire</li>
                  <li>Saisir les tribunaux compétents</li>
                </ul>
              </div>
            </section>

            {/* Article 14 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                14. CONTACT ET QUESTIONS
              </h2>

              <div className="space-y-2 text-gray-700">
                <p>Pour toute question concernant cette politique de confidentialité ou le traitement de vos données personnelles :</p>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-4">
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold">Délégué à la Protection des Données (DPO)</p>
                      <p className="text-sm">Email : <a href="mailto:dpo@ravito.ci" className="text-orange-500 hover:text-orange-600">dpo@ravito.ci</a></p>
                    </div>
                    <div>
                      <p className="font-semibold">Contact général</p>
                      <p className="text-sm">Email : <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></p>
                    </div>
                    <div>
                      <p className="font-semibold">Support technique</p>
                      <p className="text-sm">Email : <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a></p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Final note */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-8">
              <div className="flex items-start">
                <Shield className="text-green-600 mr-3 flex-shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-semibold text-green-900 mb-2">Notre engagement</p>
                  <p className="text-green-800 text-sm">
                    RAVITO s'engage à traiter vos données personnelles avec le plus grand soin et dans le respect de votre vie privée. La protection de vos données est au cœur de nos préoccupations et nous mettons tout en œuvre pour garantir leur sécurité et leur confidentialité.
                  </p>
                </div>
              </div>
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
            © 2026 RAVITO - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};
