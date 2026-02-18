export interface GuideStep {
  number: number;
  title: string;
  description: string;
  tip?: string;
}

export interface GuideTab {
  id: string;
  label: string;
  icon: string;
  intro: string;
  steps: GuideStep[];
  notes?: string[];
}

export const ADMIN_GUIDE_TABS: GuideTab[] = [
  {
    id: 'demarrage',
    label: 'Démarrage',
    icon: 'rocket',
    intro:
      "Bienvenue dans l'espace d'administration Ravito. Ce guide décrit comment superviser la plateforme, valider les inscriptions, gérer les abonnements et configurer les paramètres globaux.",
    steps: [
      {
        number: 1,
        title: 'Se connecter en tant qu\'administrateur',
        description:
          'Connectez-vous avec votre email et mot de passe administrateur sur la page de connexion. L\'interface admin est distincte des interfaces Client et Fournisseur : vous accédez directement au Tableau de Bord dès la connexion.',
        tip: 'Seuls les comptes ayant le rôle "admin" accèdent à cette interface. Veillez à ne jamais partager vos identifiants.',
      },
      {
        number: 2,
        title: 'Consulter le Tableau de Bord',
        description:
          'Le Tableau de Bord est votre écran d\'accueil. Il affiche en temps réel : le nombre de commandes, les commissions perçues, les alertes en attente et les tops clients/fournisseurs de la période. C\'est votre boussole quotidienne.',
      },
      {
        number: 3,
        title: 'Comprendre la navigation',
        description:
          'Le menu latéral gauche liste toutes les sections de l\'administration. Chaque section correspond à un domaine d\'action : utilisateurs, abonnements, zones, tickets, etc. Naviguez en cliquant sur l\'item souhaité.',
        tip: 'Certaines sections (Rôles, Données, Paramètres) sont réservées au Super Administrateur.',
      },
      {
        number: 4,
        title: 'Gérer votre équipe admin',
        description:
          'Dans "Mon Équipe", vous pouvez inviter d\'autres collaborateurs administrateurs et leur attribuer des permissions spécifiques (ex : accès aux tickets uniquement, ou gestion des utilisateurs uniquement). Cela permet de déléguer sans donner un accès total.',
      },
    ],
    notes: [
      'Toutes les actions effectuées dans l\'administration sont enregistrées dans les journaux d\'activité.',
      'En cas de doute sur une action critique, consultez votre responsable avant de valider.',
    ],
  },
  {
    id: 'tableau-de-bord',
    label: 'Tableau de Bord',
    icon: 'layout-dashboard',
    intro:
      "Le Tableau de Bord centralise les indicateurs clés de la plateforme : commissions, activité commerciale, alertes et classements. C'est le point de départ de chaque session.",
    steps: [
      {
        number: 1,
        title: 'Lire les indicateurs clés (KPIs)',
        description:
          'En haut du tableau de bord, vous trouvez les métriques principales : commissions clients totales, commissions fournisseurs, nombre total de commandes, chiffre d\'affaires de la période et taux de conversion. Ces chiffres sont actualisés en temps réel.',
      },
      {
        number: 2,
        title: 'Analyser le graphique mensuel',
        description:
          'Le graphique de commissions mensuel vous permet de visualiser l\'évolution mois par mois sur l\'année en cours. Survolez les barres pour afficher le détail (commissions clients, fournisseurs, nombre de commandes).',
        tip: 'Une baisse soudaine sur un mois peut signaler un problème technique ou saisonnier à investiguer.',
      },
      {
        number: 3,
        title: 'Consulter les tops clients et fournisseurs',
        description:
          'Les tableaux "Top Clients" et "Top Fournisseurs" listent les acteurs les plus actifs de la période. Ils vous aident à identifier vos partenaires stratégiques et à détecter ceux dont l\'activité a baissé.',
      },
      {
        number: 4,
        title: 'Traiter les alertes',
        description:
          'Le bandeau d\'alertes signale les actions prioritaires : inscriptions en attente, tickets non traités, abonnements expirés, etc. Cliquez sur une alerte pour accéder directement à la section concernée.',
        tip: 'Traitez les alertes en début de journée pour ne rien laisser en suspens.',
      },
    ],
  },
  {
    id: 'utilisateurs',
    label: 'Utilisateurs',
    icon: 'users',
    intro:
      "La section Utilisateurs est le cœur de la gestion des inscriptions. Vous y validez ou refusez les nouvelles demandes et gérez les comptes existants (clients et fournisseurs).",
    steps: [
      {
        number: 1,
        title: 'Traiter les inscriptions en attente',
        description:
          'L\'onglet "En attente" liste tous les nouveaux comptes qui attendent votre validation. Pour chaque demande, vous voyez : le nom, le rôle (client ou fournisseur), la zone, le numéro de téléphone et l\'adresse du commerce.',
      },
      {
        number: 2,
        title: 'Examiner un dossier d\'inscription',
        description:
          'Cliquez sur une inscription pour ouvrir le dossier complet. Vérifiez la cohérence des informations (nom du commerce, adresse, zone de livraison). Si tout est correct, cliquez sur "Approuver". En cas de doute ou d\'information manquante, cliquez sur "Rejeter" en saisissant une raison.',
        tip: 'Le motif de rejet est communiqué par notification à l\'utilisateur. Soyez précis et constructif.',
      },
      {
        number: 3,
        title: 'Rechercher et filtrer les comptes',
        description:
          'Dans l\'onglet "Comptes actifs", utilisez la barre de recherche (nom, email) et les filtres (rôle : client / fournisseur, statut : actif / inactif) pour trouver rapidement un compte spécifique.',
      },
      {
        number: 4,
        title: 'Consulter le détail d\'un compte',
        description:
          'Cliquez sur un compte approuvé pour voir sa fiche complète : informations personnelles, statut d\'abonnement, historique d\'activité, note et avis. Vous pouvez depuis cette fiche contacter l\'utilisateur ou modifier son statut.',
      },
      {
        number: 5,
        title: 'Désactiver ou réactiver un compte',
        description:
          'Si un compte présente un comportement anormal ou une situation de non-paiement, cliquez sur "Désactiver" dans sa fiche. L\'utilisateur sera immédiatement déconnecté et verra le message de compte suspendu. Pour réactiver, cliquez sur "Activer".',
        tip: 'La désactivation ne supprime aucune donnée. Elle empêche seulement l\'accès à la plateforme.',
      },
    ],
    notes: [
      'Un email automatique est envoyé à l\'utilisateur à chaque changement de statut (approbation, rejet, désactivation).',
      'La suppression définitive d\'un compte est irréversible. Préférez la désactivation en cas de doute.',
    ],
  },
  {
    id: 'abonnements',
    label: 'Gestion Abonnements',
    icon: 'badge-check',
    intro:
      "La Gestion des Abonnements vous permet de superviser tous les abonnements Ravito Gestion : suivre les paiements, valider les règlements manuels, gérer les plans et configurer les paramètres de facturation.",
    steps: [
      {
        number: 1,
        title: 'Consulter la liste des abonnés',
        description:
          'L\'onglet "Abonnés" affiche tous les clients avec leur plan actuel, leur statut (Essai, Actif, Suspendu, Annulé) et leur prochaine date de facturation. Utilisez les filtres pour afficher uniquement les abonnements actifs, en essai ou en retard de paiement.',
      },
      {
        number: 2,
        title: 'Valider un paiement manuel',
        description:
          'Lorsqu\'un client paie par virement ou en espèces, rendez-vous dans l\'onglet "Paiements". Recherchez le paiement en attente de validation, vérifiez la référence et le montant, puis cliquez sur "Valider". L\'abonnement du client est automatiquement remis en statut "Actif".',
        tip: 'Exigez toujours une preuve de paiement (reçu mobile money, capture de virement) avant de valider.',
      },
      {
        number: 3,
        title: 'Gérer les factures',
        description:
          'L\'onglet "Factures" liste toutes les factures émises, avec leur statut (Payée, En attente, En retard). Vous pouvez télécharger une facture en PDF ou marquer une facture comme annulée en cas d\'erreur.',
      },
      {
        number: 4,
        title: 'Créer ou modifier un plan',
        description:
          'Dans l\'onglet "Plans", vous gérez les offres d\'abonnement disponibles (Mensuel, Semestriel, Annuel). Pour modifier un plan, cliquez sur son nom, ajustez le prix ou la durée, et sauvegardez. La modification ne s\'applique qu\'aux nouveaux abonnements.',
        tip: 'Ne supprimez jamais un plan qui possède des abonnés actifs. Désactivez-le plutôt.',
      },
      {
        number: 5,
        title: 'Configurer les paramètres de facturation',
        description:
          'L\'onglet "Paramètres" permet de définir : la durée de la période d\'essai, le délai de grâce après expiration, les rappels automatiques de paiement et les méthodes de paiement acceptées.',
      },
    ],
    notes: [
      'Un client en retard de plus de [délai de grâce] jours est automatiquement suspendu.',
      'Les statistiques en haut de la page (abonnés actifs, revenus mensuels, taux de renouvellement) sont actualisées quotidiennement.',
    ],
  },
  {
    id: 'zones',
    label: 'Zones de Livraison',
    icon: 'map-pin',
    intro:
      "Les Zones de Livraison définissent les secteurs géographiques dans lesquels les fournisseurs peuvent opérer. Vous créez les zones, approuvez les demandes des fournisseurs et suivez leur activité.",
    steps: [
      {
        number: 1,
        title: 'Consulter les zones existantes',
        description:
          'La liste des zones affiche chaque zone avec son nom, son statut (active/inactive), le nombre de fournisseurs inscrits et les statistiques de commandes associées. Cliquez sur une zone pour voir son détail.',
      },
      {
        number: 2,
        title: 'Créer une nouvelle zone',
        description:
          'Cliquez sur "+ Nouvelle zone". Saisissez le nom de la zone, sa description géographique et définissez si elle est active dès la création. Une fois créée, les fournisseurs peuvent demander à y opérer.',
        tip: 'Nommez les zones de façon claire (ex : "Abidjan Plateau", "Yopougon Centre") pour faciliter la gestion.',
      },
      {
        number: 3,
        title: 'Traiter les demandes d\'inscription en zone',
        description:
          'Lorsqu\'un fournisseur souhaite opérer dans une zone, il soumet une demande. Ces demandes apparaissent dans le panneau "Demandes en attente". Cliquez sur une demande, vérifiez le profil du fournisseur et sa couverture géographique, puis Approuvez ou Refusez.',
      },
      {
        number: 4,
        title: 'Activer ou désactiver une zone',
        description:
          'Si une zone doit être temporairement suspendue (zone en travaux, crise logistique), cliquez sur son nom puis sur "Désactiver". Les fournisseurs et clients de cette zone ne pourront plus passer de commandes jusqu\'à la réactivation.',
      },
    ],
    notes: [
      'La suppression d\'une zone n\'est possible que si aucun fournisseur actif n\'y est rattaché.',
      'Les statistiques de zones (taux de succès, délais moyens) vous aident à évaluer la qualité de service par secteur.',
    ],
  },
  {
    id: 'tickets',
    label: 'Support & Tickets',
    icon: 'headphones',
    intro:
      "La section Support & Tickets centralise toutes les demandes d'assistance envoyées par les clients et fournisseurs. Votre objectif est de traiter chaque ticket rapidement et efficacement.",
    steps: [
      {
        number: 1,
        title: 'Consulter les tickets ouverts',
        description:
          'La liste des tickets affiche le titre, la catégorie (Facturation, Technique, Comptabilité...), la priorité (Normale, Haute, Urgente) et le statut (En attente, En cours, Résolu). Les tickets urgents sont mis en évidence en haut de la liste.',
      },
      {
        number: 2,
        title: 'Ouvrir et traiter un ticket',
        description:
          'Cliquez sur un ticket pour ouvrir la conversation. Lisez le message de l\'utilisateur, puis répondez dans la zone de texte en bas. Votre réponse est envoyée au client par notification et par email. Changez le statut en "En cours" dès que vous commencez à travailler dessus.',
        tip: 'Accusez réception du ticket même si vous n\'avez pas encore la solution. Cela rassure l\'utilisateur.',
      },
      {
        number: 3,
        title: 'Utiliser les notes internes',
        description:
          'Vous pouvez ajouter des notes internes visibles uniquement par l\'équipe admin (non visibles par l\'utilisateur). Utilisez-les pour consigner des informations de diagnostic, des pistes de résolution ou des échanges avec d\'autres admins.',
      },
      {
        number: 4,
        title: 'Clôturer un ticket',
        description:
          'Une fois le problème résolu, changez le statut en "Résolu" et envoyez un message de confirmation à l\'utilisateur. Le ticket est archivé mais reste consultable depuis le filtre "Résolus".',
        tip: 'Attendez la confirmation de l\'utilisateur avant de clôturer si le problème nécessite une vérification de sa part.',
      },
      {
        number: 5,
        title: 'Créer un ticket pour un utilisateur',
        description:
          'En tant qu\'admin, vous pouvez créer un ticket au nom d\'un utilisateur (ex : pour signaler un problème détecté lors d\'une supervision). Cliquez sur "+ Nouveau ticket", sélectionnez l\'utilisateur concerné et rédigez le ticket.',
      },
    ],
    notes: [
      'Les tickets sans réponse depuis plus de 48h génèrent une alerte automatique sur le tableau de bord.',
      'Les statistiques de support (temps de réponse moyen, taux de résolution) sont visibles dans la section Analytique.',
    ],
  },
  {
    id: 'activite-commerciale',
    label: 'Activité Commerciale',
    icon: 'briefcase',
    intro:
      "L'Activité Commerciale vous donne une vue d'ensemble des performances de votre réseau commercial : commissions générées, objectifs des commerciaux et suivi des clients recommandés.",
    steps: [
      {
        number: 1,
        title: 'Consulter les statistiques commerciales',
        description:
          'L\'onglet "Statistiques" affiche le volume d\'affaires généré par votre réseau commercial sur la période sélectionnée : nombre de clients actifs, commissions totales, progression vs période précédente.',
      },
      {
        number: 2,
        title: 'Suivre les performances des commerciaux',
        description:
          'L\'onglet "Commissions" liste chaque commercial avec son chiffre d\'affaires réalisé, les commissions dues et leur statut de paiement (En attente / Payé). Vous pouvez filtrer par commercial et par période.',
      },
      {
        number: 3,
        title: 'Gérer les objectifs',
        description:
          'Dans l\'onglet "Objectifs", définissez des cibles mensuelles ou trimestrielles pour chaque commercial. Une fois les objectifs saisis, la progression de chaque commercial est affichée sous forme de barre de progression.',
        tip: 'Des objectifs réalistes et mesurables motivent mieux qu\'des objectifs trop élevés et inatteignables.',
      },
      {
        number: 4,
        title: 'Consulter les clients recommandés',
        description:
          'L\'onglet "Clients inscrits" affiche tous les clients qui ont été recommandés par les commerciaux. Vous pouvez vérifier quel commercial a apporté quel client et depuis quelle date.',
      },
    ],
  },
  {
    id: 'roles',
    label: 'Gestion des Rôles',
    icon: 'shield',
    intro:
      "La Gestion des Rôles vous permet de créer des profils de permissions personnalisés pour vos collaborateurs admin, clients ou fournisseurs. Un rôle regroupe un ensemble de droits d'accès réutilisable.",
    steps: [
      {
        number: 1,
        title: 'Comprendre le principe des rôles',
        description:
          'Un rôle est un ensemble de pages accessibles. Plutôt que de configurer les permissions de chaque collaborateur individuellement, vous créez un rôle (ex : "Comptable Client") avec les pages autorisées, puis vous l\'assignez à plusieurs personnes.',
      },
      {
        number: 2,
        title: 'Créer un nouveau rôle',
        description:
          'Cliquez sur "+ Nouveau rôle". Choisissez le type d\'organisation concerné (Client, Fournisseur ou Admin). Donnez un nom clair au rôle, puis cochez les pages auxquelles ce rôle donne accès. Enregistrez.',
        tip: 'Créez des rôles avec le principe du moindre privilège : n\'accordez que les accès strictement nécessaires.',
      },
      {
        number: 3,
        title: 'Modifier ou supprimer un rôle',
        description:
          'Cliquez sur un rôle existant pour modifier ses permissions. Les rôles système (Propriétaire, Administrateur) sont verrouillés et ne peuvent pas être modifiés. Les rôles personnalisés que vous avez créés peuvent être édités ou supprimés.',
        tip: 'Avant de supprimer un rôle, vérifiez qu\'aucun collaborateur ne l\'utilise encore.',
      },
      {
        number: 4,
        title: 'Filtrer les rôles par type',
        description:
          'Utilisez le filtre en haut de la liste pour afficher uniquement les rôles d\'un type donné (Client / Fournisseur / Admin). Cela facilite la gestion quand vous avez de nombreux rôles personnalisés.',
      },
    ],
    notes: [
      'Les rôles système intégrés (Propriétaire, Membre) ne peuvent pas être modifiés ni supprimés.',
      'Un rôle supprimé n\'affecte pas immédiatement les utilisateurs qui l\'ont : ils conservent leurs accès jusqu\'à la prochaine mise à jour de leur profil.',
    ],
  },
  {
    id: 'donnees',
    label: 'Gestion des Données',
    icon: 'database',
    intro:
      "La Gestion des Données vous permet de sécuriser la plateforme via des sauvegardes manuelles, de restaurer des données en cas d'incident et de vérifier l'intégrité de la base.",
    steps: [
      {
        number: 1,
        title: 'Créer une sauvegarde manuelle',
        description:
          'Cliquez sur "Créer une sauvegarde". Le système génère un instantané complet des données de la plateforme à ce moment précis. La sauvegarde apparaît dans la liste avec sa date et son statut.',
        tip: 'Créez une sauvegarde avant toute opération critique : mise à jour de paramètres, purge de données, etc.',
      },
      {
        number: 2,
        title: 'Restaurer depuis une sauvegarde',
        description:
          'En cas d\'incident ou d\'erreur de données, cliquez sur "Restaurer". Sélectionnez la sauvegarde la plus récente avant l\'incident dans la liste. Confirmez l\'opération. ATTENTION : la restauration écrase les données actuelles.',
        tip: 'La restauration est irréversible. Assurez-vous de bien sélectionner la bonne sauvegarde.',
      },
      {
        number: 3,
        title: 'Vérifier l\'intégrité des données',
        description:
          'Cliquez sur "Vérifier l\'intégrité". Le système effectue une série de contrôles automatiques (cohérence des commandes, des soldes, des abonnements). Un rapport de résultats s\'affiche avec les éventuelles anomalies détectées.',
      },
      {
        number: 4,
        title: 'Purger les anciennes commandes',
        description:
          'La purge supprime définitivement les commandes archivées au-delà d\'une certaine ancienneté pour alléger la base. Cliquez sur "Purger les commandes", confirmez la période concernée dans la fenêtre de dialogue, puis validez. Cette action est irréversible.',
        tip: 'Assurez-vous d\'avoir créé une sauvegarde avant toute purge.',
      },
    ],
    notes: [
      'Les sauvegardes automatiques sont réalisées quotidiennement par l\'infrastructure Ravito.',
      'La purge ne touche que les commandes archivées, jamais les données de profils ou d\'abonnements.',
    ],
  },
  {
    id: 'parametres',
    label: 'Paramètres',
    icon: 'settings',
    intro:
      "Les Paramètres regroupent toute la configuration globale de la plateforme : informations générales, règles de commandes, taux de commissions, notifications, sécurité et produits.",
    steps: [
      {
        number: 1,
        title: 'Paramètres généraux',
        description:
          'Configurez le nom de la plateforme, l\'email de support, les horaires d\'ouverture du service. Ces informations apparaissent dans les emails envoyés aux utilisateurs et dans les pages légales.',
      },
      {
        number: 2,
        title: 'Paramètres de commandes',
        description:
          'Définissez les règles opérationnelles : distance maximale de livraison (en km), délai de livraison par défaut (en minutes), timeout d\'une commande sans réponse, et montant minimum de commande. Ces valeurs s\'appliquent à toutes les commandes.',
        tip: 'Un timeout trop court peut frustrer les clients ; un timeout trop long bloque les fournisseurs. Trouvez le bon équilibre.',
      },
      {
        number: 3,
        title: 'Taux de commissions',
        description:
          'Saisissez le taux de commission prélevé côté client (en %) et côté fournisseur (en %) sur chaque transaction. Toute modification prend effet sur les nouvelles commandes uniquement.',
        tip: 'Les taux en vigueur sont affichés dans les conditions générales de vente. Mettez-les à jour en cas de changement.',
      },
      {
        number: 4,
        title: 'Paramètres de notifications',
        description:
          'Activez ou désactivez les canaux de notification : SMS, email, push (notifications sur l\'application), WhatsApp. Vous pouvez les activer ou désactiver globalement selon vos contrats de service.',
      },
      {
        number: 5,
        title: 'Paramètres de sécurité',
        description:
          'Configurez les exigences de sécurité : vérification du téléphone à l\'inscription, vérification de l\'email, authentification à deux facteurs (2FA), durée de session (en heures). Des paramètres plus stricts protègent mieux la plateforme.',
      },
      {
        number: 6,
        title: 'Paramètres produits et emballages',
        description:
          'Activez les intégrations produits (Solibra, Brassivoire), la mise à jour automatique des prix et le suivi des consignes. Configurez également les types d\'emballages consignés (caisses, palettes) disponibles sur la plateforme.',
      },
      {
        number: 7,
        title: 'Méthodes de paiement',
        description:
          'Dans l\'onglet "Moyens de paiement", activez ou désactivez les méthodes disponibles pour les abonnements (Wave, Orange Money, MTN Money) et renseignez les numéros de collecte associés.',
      },
    ],
    notes: [
      'Chaque modification de paramètre est enregistrée avec horodatage dans les journaux admin.',
      'Certains paramètres (taux de commissions, délais) ont un impact immédiat sur l\'expérience utilisateur. Communiquez les changements importants à vos équipes.',
    ],
  },
];
