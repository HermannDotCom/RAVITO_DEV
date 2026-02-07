import React from 'react';
import { LandingHeader } from '../../components/Landing/LandingHeader';
import { AlertTriangle } from 'lucide-react';

interface CGVPageProps {
  onNavigate: (path: string) => void;
}

export const CGVPage: React.FC<CGVPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-white">
      <LandingHeader showNavigation={false} onNavigate={onNavigate} />

      <div className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">
              Conditions Générales de Vente
            </h1>
            <p className="text-gray-600">
              Date de dernière mise à jour : 7 février 2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Préambule */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                PRÉAMBULE
              </h2>
              <p className="text-gray-700 leading-relaxed">
                Les présentes Conditions Générales de Vente (CGV) régissent les relations commerciales entre RAVITO, plateforme d'intermédiation numérique, et ses utilisateurs (Clients et Fournisseurs). RAVITO ne vend pas directement de produits mais met en relation les établissements CHR avec les fournisseurs de boissons à Abidjan, Côte d'Ivoire.
              </p>
            </section>

            {/* Article 1 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 1 - OBJET ET CHAMP D'APPLICATION
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>1.1</strong> RAVITO est une plateforme d'intermédiation qui permet aux établissements du secteur CHR (Cafés, Hôtels, Restaurants) de commander des boissons auprès de fournisseurs agréés (dépôts de boissons).</p>
                <p><strong>1.2</strong> RAVITO n'est pas partie au contrat de vente conclu entre le Client et le Fournisseur. Les transactions commerciales sont réalisées directement entre ces deux parties.</p>
                <p><strong>1.3</strong> Les présentes CGV s'appliquent à toutes les transactions réalisées via la plateforme RAVITO.</p>
              </div>
            </section>

            {/* Article 2 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 2 - RÔLE ET RESPONSABILITÉS DE RAVITO
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>2.1 Service d'intermédiation</strong></p>
                <p className="ml-4">RAVITO fournit exclusivement un service technologique de mise en relation. La plateforme facilite la communication et les transactions entre Clients et Fournisseurs sans intervenir dans la vente elle-même.</p>

                <p><strong>2.2 Non-responsabilité sur les produits</strong></p>
                <p className="ml-4">RAVITO n'est pas responsable de :</p>
                <ul className="ml-8 space-y-1">
                  <li>• La qualité, la conformité ou l'état des produits livrés</li>
                  <li>• La conformité des produits aux normes sanitaires</li>
                  <li>• Les délais de livraison annoncés par les Fournisseurs</li>
                  <li>• Les litiges commerciaux entre Clients et Fournisseurs</li>
                  <li>• Les dommages causés pendant le transport</li>
                </ul>

                <p><strong>2.3 Rôle de médiation</strong></p>
                <p className="ml-4">En cas de litige, RAVITO peut proposer ses services de médiation pour faciliter la résolution amiable, sans obligation de résultat.</p>
              </div>
            </section>

            {/* Article 3 - TARIFICATION */}
            <section className="mb-8">
              <div className="bg-orange-50 border-2 border-orange-500 rounded-xl p-6">
                <div className="flex items-start mb-4">
                  <AlertTriangle className="text-orange-500 mr-3 flex-shrink-0 mt-1" size={24} />
                  <h2 className="text-2xl font-bold text-gray-900">
                    ARTICLE 3 - TARIFICATION DES SERVICES RAVITO
                  </h2>
                </div>
                <div className="space-y-3 text-gray-700">
                  <p><strong>3.1 Commissions d'intermédiation</strong></p>
                  <p className="ml-4">RAVITO perçoit une commission sur chaque transaction réalisée via la plateforme :</p>
                  <ul className="ml-8 space-y-2">
                    <li>• <strong>Clients :</strong> 4% du montant total de la commande</li>
                    <li>• <strong>Fournisseurs :</strong> 1% du montant total de la livraison</li>
                  </ul>

                  <p><strong>3.2 Transparence tarifaire</strong></p>
                  <p className="ml-4">Les commissions sont affichées clairement lors de chaque commande et sont prélevées automatiquement lors du paiement.</p>

                  <p><strong>3.3 Facturation</strong></p>
                  <ul className="ml-8 space-y-1">
                    <li>• <strong>Pour les Clients :</strong> La commission est ajoutée au montant total de la commande.</li>
                    <li>• <strong>Pour les Fournisseurs :</strong> La commission est déduite du montant qui leur est reversé après livraison.</li>
                  </ul>

                  <div className="bg-orange-100 border border-orange-600 rounded-lg p-4 my-4">
                    <p className="font-bold text-orange-900 mb-2">⚠️ CLAUSE IMPORTANTE :</p>
                    <p className="text-orange-900"><strong>3.4</strong> Les tarifs des commissions peuvent évoluer. Toute modification sera notifiée aux utilisateurs avec un préavis minimum de 30 jours.</p>
                    <p className="text-orange-900 mt-2"><strong>3.5</strong> RAVITO se réserve le droit d'introduire un système d'abonnement premium facultatif ou obligatoire pour accéder à des fonctionnalités avancées.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Article 4 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 4 - PROCESSUS DE COMMANDE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>4.1 Passation de commande</strong></p>
                <ol className="ml-8 space-y-2 list-decimal">
                  <li>Le Client sélectionne les produits souhaités depuis le catalogue</li>
                  <li>La commande est diffusée aux Fournisseurs de la zone géographique</li>
                  <li>Les Fournisseurs intéressés soumettent des offres avec leurs prix et délais</li>
                  <li>Le Client compare les offres et sélectionne celle de son choix</li>
                  <li>Le Client procède au paiement (incluant la commission RAVITO)</li>
                  <li>Le Fournisseur prépare et livre la commande</li>
                  <li>Le Client confirme la réception avec un code de confirmation</li>
                </ol>

                <p><strong>4.2 Validation de la commande</strong></p>
                <p className="ml-4">Une fois le paiement effectué, la commande est confirmée et le Fournisseur est engagé à livrer dans les délais annoncés.</p>

                <p><strong>4.3 Code de confirmation</strong></p>
                <p className="ml-4">Un code unique à 8 caractères est généré pour chaque commande. Le Client doit communiquer ce code au livreur pour confirmer la réception. Sans validation du code, le paiement reste en attente.</p>
              </div>
            </section>

            {/* Article 5 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 5 - PRIX DES PRODUITS
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>5.1 Fixation des prix</strong></p>
                <p className="ml-4">Les prix des produits sont librement fixés par chaque Fournisseur dans leurs offres. RAVITO ne contrôle pas ces prix mais peut afficher des prix de référence à titre informatif.</p>

                <p><strong>5.2 Prix affichés</strong></p>
                <p className="ml-4">Les prix sont indiqués en Francs CFA (XOF) et incluent :</p>
                <ul className="ml-8 space-y-1">
                  <li>• Le prix unitaire ou par casier</li>
                  <li>• Le prix de la consigne (si applicable)</li>
                  <li>• Les frais de livraison éventuels</li>
                </ul>

                <p><strong>5.3 Commission RAVITO</strong></p>
                <p className="ml-4">La commission RAVITO (4% pour les clients) est ajoutée au montant total avant paiement et affichée clairement.</p>

                <p><strong>5.4 Modification des prix</strong></p>
                <p className="ml-4">Les prix affichés dans une offre sont garantis pour cette commande. Les Fournisseurs peuvent modifier leurs tarifs entre deux offres.</p>
              </div>
            </section>

            {/* Article 6 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 6 - MODALITÉS DE PAIEMENT
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>6.1 Moyens de paiement acceptés</strong></p>
                <ul className="ml-8 space-y-1">
                  <li>• Orange Money</li>
                  <li>• MTN Mobile Money</li>
                  <li>• Moov Money</li>
                  <li>• Wave</li>
                  <li>• Carte bancaire</li>
                </ul>

                <p><strong>6.2 Moment du paiement</strong></p>
                <p className="ml-4">Le Client paie l'intégralité de la commande (produits + commission RAVITO) au moment de l'acceptation de l'offre, avant la livraison.</p>

                <p><strong>6.3 Sécurisation des paiements</strong></p>
                <p className="ml-4">Les paiements sont sécurisés et gérés par des prestataires de paiement certifiés. RAVITO ne conserve aucune donnée bancaire.</p>

                <p><strong>6.4 Reversement aux Fournisseurs</strong></p>
                <p className="ml-4">RAVITO reverse au Fournisseur le montant de la vente diminué de la commission de 1% sous 48 heures ouvrables après confirmation de livraison (code saisi par le client).</p>
                <p className="ml-4"><strong>Exemple :</strong> Pour une commande de 500 000 FCFA, le fournisseur recevra 495 000 FCFA (500 000 - 5 000).</p>
                <p className="ml-4"><strong>Délais :</strong> Si la confirmation intervient un week-end ou jour férié, le reversement est effectué le lundi ouvrable suivant.</p>
                <p className="ml-4"><strong>Retard exceptionnel :</strong> En cas de retard technique exceptionnel, RAVITO notifiera le fournisseur et appliquera une majoration de 0,5% par jour de retard, plafonnée à 5 jours maximum.</p>
              </div>
            </section>

            {/* Article 7 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 7 - LIVRAISON
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>7.1 Responsabilité de la livraison</strong></p>
                <p className="ml-4">La livraison est assurée par le Fournisseur ou son représentant. RAVITO n'intervient pas dans la logistique de livraison.</p>

                <p><strong>7.2 Délais de livraison</strong></p>
                <p className="ml-4">Les délais de livraison sont indiqués par chaque Fournisseur dans son offre. Ces délais sont indicatifs et ne constituent pas une obligation contractuelle pour RAVITO.</p>

                <p><strong>7.3 Adresse de livraison</strong></p>
                <p className="ml-4">Le Client doit fournir une adresse précise et accessible. Toute impossibilité de livraison due à une adresse erronée ou inaccessible est à la charge du Client.</p>

                <p><strong>7.4 Réception de la commande</strong></p>
                <p className="ml-4">Le Client (ou son représentant) doit être présent à l'adresse indiquée lors de la livraison et vérifier la conformité de la commande avant de communiquer le code de confirmation.</p>

                <p><strong>7.5 Réclamations</strong></p>
                <p className="ml-4">Toute réclamation concernant la livraison (produits manquants, endommagés, non conformes) doit être signalée immédiatement au Fournisseur et au support RAVITO.</p>
              </div>
            </section>

            {/* Article 8 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 8 - ANNULATION ET REMBOURSEMENT
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>8.1 Annulation avant paiement</strong></p>
                <p className="ml-4">Le Client peut annuler sa commande gratuitement tant qu'il n'a pas accepté d'offre et effectué le paiement.</p>

                <p><strong>8.2 Annulation après paiement</strong></p>
                <p className="ml-4">Après paiement, l'annulation doit être négociée directement avec le Fournisseur. Le Fournisseur peut accepter ou refuser selon l'état d'avancement de la préparation.</p>

                <p><strong>8.3 Remboursements</strong></p>
                <p className="ml-4">Les demandes de remboursement sont traitées au cas par cas :</p>
                <ul className="ml-8 space-y-1">
                  <li>• <strong>Non-livraison :</strong> Remboursement intégral</li>
                  <li>• <strong>Livraison non conforme :</strong> Remboursement partiel ou total selon la gravité</li>
                  <li>• <strong>Annulation par le Fournisseur :</strong> Remboursement intégral</li>
                </ul>

                <p><strong>8.4 Délai de remboursement</strong></p>
                <p className="ml-4">Les remboursements validés sont effectués dans un délai de 7 jours ouvrés sur le moyen de paiement utilisé.</p>

                <p><strong>8.5 Commission RAVITO</strong></p>
                <p className="ml-4">En cas de remboursement pour dysfonctionnement de la plateforme ou faute du Fournisseur, la commission RAVITO est également remboursée. En cas d'annulation à l'initiative du Client, la commission peut être retenue.</p>
              </div>
            </section>

            {/* Article 9 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 9 - GARANTIES ET CONFORMITÉ
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>9.1 Garantie légale</strong></p>
                <p className="ml-4">Les produits vendus bénéficient de la garantie légale de conformité et de la garantie contre les vices cachés, en application du droit ivoirien. Ces garanties s'exercent contre le Fournisseur vendeur.</p>

                <p><strong>9.2 Conformité des produits</strong></p>
                <p className="ml-4">Les Fournisseurs garantissent que les produits livrés sont conformes aux normes sanitaires et commerciales en vigueur en Côte d'Ivoire.</p>

                <p><strong>9.3 Non-responsabilité de RAVITO</strong></p>
                <p className="ml-4">RAVITO, en tant qu'intermédiaire, n'est pas garant de la conformité des produits. Toute réclamation doit être adressée directement au Fournisseur.</p>
              </div>
            </section>

            {/* Article 10 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 10 - SYSTÈME D'ÉVALUATION
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>10.1 Évaluation mutuelle</strong></p>
                <p className="ml-4">Après chaque commande, Clients et Fournisseurs peuvent s'évaluer mutuellement sur des critères de ponctualité, qualité et communication.</p>

                <p><strong>10.2 Transparence des avis</strong></p>
                <p className="ml-4">Les évaluations sont publiques et contribuent à la réputation des utilisateurs sur la plateforme.</p>

                <p><strong>10.3 Modération</strong></p>
                <p className="ml-4">RAVITO se réserve le droit de modérer ou supprimer les avis injurieux, diffamatoires ou ne respectant pas les règles de la communauté.</p>
              </div>
            </section>

            {/* Article 11 - TARIFICATION RAVITO GESTION */}
            <section className="mb-8">
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ARTICLE 11 - TARIFICATION RAVITO GESTION
                </h2>
                <div className="space-y-3 text-gray-700">
                  <p><strong>11.1 Grille tarifaire</strong></p>
                  <p className="ml-4">Le module RAVITO Gestion est accessible sur abonnement payant selon les tarifs suivants :</p>
                  
                  <div className="overflow-x-auto ml-4 my-4">
                    <table className="min-w-full border-collapse border border-gray-300">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Plan</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Tarif</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Durée</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Avantage</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Mensuel</td>
                          <td className="border border-gray-300 px-4 py-2"><strong>6 000 FCFA</strong></td>
                          <td className="border border-gray-300 px-4 py-2">1 mois</td>
                          <td className="border border-gray-300 px-4 py-2">-</td>
                        </tr>
                        <tr className="bg-green-50">
                          <td className="border border-gray-300 px-4 py-2"><strong>Semestriel (Recommandé)</strong></td>
                          <td className="border border-gray-300 px-4 py-2"><strong>30 000 FCFA</strong></td>
                          <td className="border border-gray-300 px-4 py-2">6 mois</td>
                          <td className="border border-gray-300 px-4 py-2"><span className="text-green-600">🎁 1 mois offert</span></td>
                        </tr>
                        <tr>
                          <td className="border border-gray-300 px-4 py-2">Annuel</td>
                          <td className="border border-gray-300 px-4 py-2"><strong>48 000 FCFA</strong></td>
                          <td className="border border-gray-300 px-4 py-2">12 mois</td>
                          <td className="border border-gray-300 px-4 py-2"><span className="text-green-600">🎁 4 mois offerts</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p><strong>11.2 Période d'essai gratuite</strong></p>
                  <p className="ml-4">
                    Tout nouvel utilisateur bénéficie d'une période d'essai gratuite de <strong>30 jours</strong> à compter de sa première souscription. Cette période permet de tester l'intégralité des fonctionnalités du module sans engagement et sans moyen de paiement requis.
                  </p>

                  <p><strong>11.3 Modes de paiement acceptés</strong></p>
                  <p className="ml-4">Les paiements peuvent être effectués par les moyens suivants :</p>
                  <ul className="ml-8 space-y-1">
                    <li>• Espèces (via reçu validé par l'administration RAVITO)</li>
                    <li>• Wave</li>
                    <li>• Orange Money</li>
                    <li>• MTN Money</li>
                  </ul>

                  <p><strong>11.4 Facturation et reçus</strong></p>
                  <p className="ml-4">
                    Une facture PDF est automatiquement générée et envoyée par email à chaque paiement. La facture comprend le détail du plan souscrit, le montant payé, les dates de validité et le numéro de transaction.
                  </p>

                  <p><strong>11.5 Renouvellement de l'abonnement</strong></p>
                  <p className="ml-4">
                    Le renouvellement <strong>n'est pas automatique</strong>. Des rappels sont envoyés par email et notification à :
                  </p>
                  <ul className="ml-8 space-y-1">
                    <li>• <strong>J-30</strong> : Premier rappel</li>
                    <li>• <strong>J-15</strong> : Deuxième rappel</li>
                    <li>• <strong>J-7</strong> : Troisième rappel</li>
                    <li>• <strong>J-2</strong> : Dernier rappel</li>
                  </ul>
                  <p className="ml-4 mt-2">
                    L'utilisateur doit effectuer manuellement le paiement pour renouveler son abonnement. En cas de non-renouvellement, l'accès au module est suspendu à partir de J+1 après l'échéance.
                  </p>

                  <p><strong>11.6 Modification des tarifs</strong></p>
                  <p className="ml-4">
                    RAVITO se réserve le droit de modifier les tarifs de ses abonnements. Toute modification sera notifiée aux utilisateurs avec un préavis minimum de <strong>30 jours</strong>. Les abonnements en cours restent aux tarifs souscrits jusqu'à leur échéance.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 12 - REMBOURSEMENT ET RÉSILIATION */}
            <section className="mb-8">
              <div className="bg-blue-50 border-2 border-blue-500 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  ARTICLE 12 - REMBOURSEMENT ET RÉSILIATION RAVITO GESTION
                </h2>
                <div className="space-y-3 text-gray-700">
                  <p><strong>12.1 Droit de rétractation</strong></p>
                  <p className="ml-4">
                    Conformément à la loi ivoirienne sur la consommation, l'utilisateur dispose d'un délai de <strong>14 jours</strong> à compter de la souscription pour exercer son droit de rétractation sans avoir à justifier de motifs. En cas de rétractation dans ce délai, le remboursement intégral est effectué sous 14 jours ouvrés.
                  </p>

                  <p><strong>12.2 Conditions de remboursement</strong></p>
                  <p className="ml-4">
                    En dehors du délai de rétractation, les remboursements sont calculés au prorata temporis selon la formule suivante :
                  </p>
                  <p className="ml-8 italic">
                    Montant remboursé = (Montant payé × Jours restants) / Durée totale de l'abonnement
                  </p>
                  <p className="ml-4 mt-2">
                    Les demandes de remboursement doivent être effectuées par email à <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a> avec justification. Les remboursements sont traités sous 30 jours ouvrés.
                  </p>

                  <p><strong>12.3 Résiliation par l'utilisateur</strong></p>
                  <p className="ml-4">
                    L'utilisateur peut résilier son abonnement à tout moment depuis les paramètres de son compte. La résiliation prend effet à la date d'échéance de l'abonnement en cours. Aucun remboursement n'est effectué pour les jours non utilisés sauf dans le cas d'un dysfonctionnement majeur du service imputable à RAVITO.
                  </p>

                  <p><strong>12.4 Résiliation par RAVITO</strong></p>
                  <p className="ml-4">
                    RAVITO se réserve le droit de résilier un abonnement dans les cas suivants :
                  </p>
                  <ul className="ml-8 space-y-1">
                    <li>• Non-respect des Conditions Générales d'Utilisation</li>
                    <li>• Utilisation frauduleuse ou abusive du service</li>
                    <li>• Non-paiement à l'échéance après un délai de grâce de 60 jours</li>
                    <li>• Inactivité du compte pendant plus de 12 mois consécutifs</li>
                  </ul>
                  <p className="ml-4 mt-2">
                    En cas de résiliation par RAVITO pour manquement de l'utilisateur, aucun remboursement n'est effectué. Un préavis de 7 jours est accordé sauf en cas de fraude avérée.
                  </p>

                  <p><strong>12.5 Conservation et exportation des données</strong></p>
                  <p className="ml-4">
                    En cas de résiliation, l'utilisateur dispose d'un délai de <strong>30 jours</strong> pour exporter l'intégralité de ses données (cahier digital, stocks, dépenses, crédits clients) au format PDF ou Excel. Passé ce délai, les données sont définitivement supprimées des serveurs RAVITO.
                  </p>
                </div>
              </div>
            </section>

            {/* Article 13 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 13 - LITIGES
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>13.1 Résolution amiable</strong></p>
                <p className="ml-4">En cas de litige entre un Client et un Fournisseur, les parties sont encouragées à rechercher une solution amiable. RAVITO peut proposer ses services de médiation.</p>

                <p><strong>13.2 Service support</strong></p>
                <p className="ml-4">Pour toute réclamation, contacter le support RAVITO à : <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a></p>

                <p><strong>13.3 Conciliation et juridiction compétente</strong></p>
                <p className="ml-4">En cas de litige persistant, les parties peuvent recourir gratuitement à la conciliation proposée par le CEPICI (Centre de Promotion des Investissements en Côte d'Ivoire) à Abidjan.</p>
                <p className="ml-4">En cas d'échec de la conciliation, les tribunaux compétents d'Abidjan, Côte d'Ivoire, auront compétence exclusive pour statuer sur le litige.</p>
              </div>
            </section>

            {/* Article 14 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 14 - MODIFICATION DES CGV
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>14.1</strong> RAVITO se réserve le droit de modifier les présentes CGV à tout moment pour s'adapter aux évolutions législatives, techniques ou commerciales.</p>
                <p><strong>14.2</strong> Les modifications seront notifiées aux utilisateurs avec un préavis raisonnable.</p>
                <p><strong>14.3</strong> La poursuite de l'utilisation de la plateforme après notification vaut acceptation des nouvelles CGV.</p>
              </div>
            </section>

            {/* Article 15 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 15 - DROIT APPLICABLE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>15.1</strong> Les présentes CGV sont régies par le droit ivoirien et notamment par :</p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>L'Acte Uniforme OHADA relatif au droit commercial général (articles 153-160 sur les intermédiaires)</li>
                  <li>La loi n° 2016-412 du 15 juin 2016 relative à la consommation (article 12 sur la transparence)</li>
                  <li>L'ordonnance n° 2017-500 du 2 août 2017 relative aux échanges électroniques</li>
                </ul>
                <p className="mt-3"><strong>15.2</strong> Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis aux tribunaux compétents d'Abidjan.</p>
              </div>
            </section>

            {/* Article 16 - NOUVEAU */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 16 - FORCE MAJEURE
              </h2>
              <div className="space-y-3 text-gray-700">
                <p><strong>16.1 Définition</strong></p>
                <p className="ml-4">Sont considérés comme cas de force majeure, conformément à l'article 1148 du Code civil harmonisé OHADA, les événements suivants :</p>
                <ul className="ml-8 space-y-1 list-disc">
                  <li>Panne majeure des prestataires de paiement (Wave, Orange Money, MTN, Moov, etc.)</li>
                  <li>Cyberattaque visant la plateforme ou ses infrastructures</li>
                  <li>Catastrophe naturelle (inondation, tremblement de terre, etc.)</li>
                  <li>Grève générale affectant les services essentiels</li>
                  <li>Décision administrative ou gouvernementale empêchant l'activité</li>
                </ul>

                <p><strong>16.2 Notification</strong></p>
                <p className="ml-4">En cas de survenance d'un événement de force majeure, RAVITO notifiera les utilisateurs par email et/ou SMS dans un délai de 48 heures.</p>

                <p><strong>16.3 Exonération de responsabilité</strong></p>
                <p className="ml-4">RAVITO est exonéré de toute responsabilité pendant la durée de l'événement de force majeure et pendant une période de 7 jours suivant la fin de cet événement pour permettre la reprise normale des activités.</p>

                <p><strong>16.4 Reprise des obligations</strong></p>
                <p className="ml-4">Les parties reprennent l'exécution de leurs obligations contractuelles dès la cessation de l'événement de force majeure, sans qu'aucune indemnité ne soit due de part et d'autre.</p>
              </div>
            </section>

            {/* Article 17 */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                ARTICLE 17 - CONTACT
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>Pour toute question relative aux présentes CGV :</p>
                <ul className="space-y-1 ml-6">
                  <li>• Email général : <a href="mailto:contact@ravito.ci" className="text-orange-500 hover:text-orange-600">contact@ravito.ci</a></li>
                  <li>• Support client : <a href="mailto:support@ravito.ci" className="text-orange-500 hover:text-orange-600">support@ravito.ci</a></li>
                  <li>• Service commercial : <a href="mailto:commercial@ravito.ci" className="text-orange-500 hover:text-orange-600">commercial@ravito.ci</a></li>
                </ul>
              </div>
            </section>

            {/* Footer note */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
              <p className="text-gray-700 text-sm">
                <strong>Note importante :</strong> Les présentes Conditions Générales de Vente complètent les Conditions Générales d'Utilisation (CGU) de la plateforme RAVITO. En cas de contradiction, les présentes CGV prévalent pour les aspects commerciaux et transactionnels.
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
            © 2026 RAVITO - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};
