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

export const CLIENT_GUIDE_TABS: GuideTab[] = [
  {
    id: 'demarrage',
    label: 'Démarrage',
    icon: 'rocket',
    intro:
      'Bienvenue sur Ravito Gestion ! Ce guide vous accompagne pas à pas pour prendre en main votre espace en quelques minutes.',
    steps: [
      {
        number: 1,
        title: 'Complétez votre profil',
        description:
          'Rendez-vous dans "Mon Profil" (menu de gauche). Renseignez le nom de votre commerce, votre adresse, et ajoutez une photo de votre devanture. Ces informations permettent aux fournisseurs de vous identifier facilement.',
        tip: 'Un profil complet accélère l\'approbation de votre compte par l\'équipe Ravito.',
      },
      {
        number: 2,
        title: 'Choisissez votre abonnement',
        description:
          'Allez dans "Mon Abonnement". Vous bénéficiez d\'un mois d\'essai gratuit à l\'inscription. Choisissez le plan (Mensuel, Semestriel ou Annuel) qui correspond à votre activité et confirmez.',
        tip: 'La période d\'essai vous permet de tester toutes les fonctionnalités sans engagement.',
      },
      {
        number: 3,
        title: 'Accédez à votre espace de gestion',
        description:
          'Une fois votre abonnement actif, toutes les sections du menu se débloquent : Gestion Activité, Mon Équipe, etc. Commencez par "Gestion Activité" pour configurer vos produits.',
        tip: 'Si une section est grisée, vérifiez que votre abonnement est bien actif.',
      },
    ],
    notes: [
      'L\'accès complet est conditionné à l\'approbation de votre compte par l\'équipe Ravito.',
      'En cas de problème, contactez le support via la section "Support" du menu.',
    ],
  },
  {
    id: 'activite',
    label: 'Gestion Activité',
    icon: 'clipboard',
    intro:
      'La Gestion Activité est le cœur de votre espace. C\'est ici que vous saisissez vos stocks, vos emballages, vos recettes de caisse et que vous suivez l\'évolution de votre activité.',
    steps: [
      {
        number: 1,
        title: 'Sélectionnez la date du jour',
        description:
          'En haut de la page "Gestion Activité", un sélecteur de date est affiché. Il est automatiquement positionné sur aujourd\'hui. Vous pouvez naviguer vers une date passée pour consulter ou modifier une saisie.',
        tip: 'La saisie du jour est la plus courante. Prenez l\'habitude de renseigner chaque jour.',
      },
      {
        number: 2,
        title: 'Onglet Stocks : saisir vos quantités',
        description:
          'Cliquez sur l\'onglet "Stocks". Pour chaque produit de votre catalogue, saisissez : le stock de début de journée (ce que vous avez en rayons le matin), le stock de fin (ce qu\'il reste le soir). Ravito calcule automatiquement les quantités vendues.',
        tip: 'Si un produit n\'apparaît pas, configurez votre catalogue dans les paramètres produits.',
      },
      {
        number: 3,
        title: 'Onglet Emballages : gérer les consignes',
        description:
          'L\'onglet "Emballages" vous permet de saisir les mouvements d\'emballages consignés (caisses, palettes, etc.). Indiquez les quantités reçues et restituées. Le solde est calculé automatiquement.',
        tip: 'Un suivi rigoureux des emballages évite les litiges avec vos fournisseurs.',
      },
      {
        number: 4,
        title: 'Onglet Caisse : saisir vos recettes',
        description:
          'Dans l\'onglet "Caisse", saisissez le montant encaissé en espèces et les autres recettes (mobile money, virement). Vous pouvez également enregistrer des dépenses exceptionnelles. Le bilan de caisse est calculé en temps réel.',
        tip: 'Pensez à saisir toutes les entrées et sorties pour avoir un bilan fiable.',
      },
      {
        number: 5,
        title: 'Onglet Récapitulatif : valider la journée',
        description:
          'Le récapitulatif centralise toutes les données de la journée (ventes, emballages, caisse). Vérifiez que les chiffres correspondent à votre réalité. Ce récapitulatif peut être exporté en PDF.',
      },
      {
        number: 6,
        title: 'Onglets Mensuel et Annuel : analyser les tendances',
        description:
          'Les onglets "Mensuel" et "Annuel" affichent des graphiques et tableaux récapitulatifs sur vos performances passées. Utilisez-les pour identifier vos meilleurs produits et anticiper vos commandes.',
        tip: 'Exportez les données en PDF ou Excel pour vos réunions ou bilans comptables.',
      },
    ],
    notes: [
      'Les données sont sauvegardées automatiquement à chaque saisie.',
      'En cas de saisie erronée, vous pouvez corriger une journée passée en sélectionnant la date concernée.',
    ],
  },
  {
    id: 'credits',
    label: 'Gestion des Crédits',
    icon: 'credit-card',
    intro:
      'Le module Crédits vous permet de suivre les ventes à crédit accordées à vos clients. Vous pouvez enregistrer des clients, suivre leurs encours et gérer leurs remboursements.',
    steps: [
      {
        number: 1,
        title: 'Accéder au module Crédits',
        description:
          'Dans "Gestion Activité", cliquez sur l\'onglet "Crédits". Vous verrez apparaître la liste de vos clients avec leur encours actuel.',
      },
      {
        number: 2,
        title: 'Ajouter un nouveau client crédit',
        description:
          'Cliquez sur le bouton "+ Nouveau client". Renseignez le nom du client, son contact téléphonique et éventuellement une limite de crédit autorisée. Validez pour créer le dossier client.',
        tip: 'Définir une limite de crédit vous alertera automatiquement lorsque le plafond est proche.',
      },
      {
        number: 3,
        title: 'Enregistrer une vente à crédit',
        description:
          'Sur la fiche d\'un client, cliquez sur "+ Ajouter une consommation". Saisissez le montant de la vente et une description optionnelle. L\'encours du client est mis à jour immédiatement.',
      },
      {
        number: 4,
        title: 'Enregistrer un remboursement',
        description:
          'Lorsque le client rembourse tout ou partie de sa dette, cliquez sur "Enregistrer un paiement" sur sa fiche. Saisissez le montant reçu. Le solde restant est recalculé automatiquement.',
        tip: 'Vous pouvez effectuer des remboursements partiels autant de fois que nécessaire.',
      },
      {
        number: 5,
        title: 'Gérer les alertes de crédit',
        description:
          'Le bandeau d\'alertes en haut de l\'onglet vous signale les clients dont l\'encours dépasse la limite autorisée ou qui n\'ont pas remboursé depuis longtemps. Agissez rapidement pour éviter les impayés.',
      },
      {
        number: 6,
        title: 'Suspendre un compte client',
        description:
          'Si un client ne règle pas sa dette, vous pouvez suspendre son compte crédit en cliquant sur "Suspendre". Aucune nouvelle consommation ne sera possible jusqu\'à la régularisation.',
      },
    ],
    notes: [
      'Les alertes sont automatiques selon les seuils que vous définissez par client.',
      'L\'historique complet des transactions est accessible sur chaque fiche client.',
    ],
  },
  {
    id: 'equipe',
    label: 'Mon Équipe',
    icon: 'users',
    intro:
      'La section "Mon Équipe" vous permet d\'inviter des collaborateurs (employés, gérants adjoints, commerciaux) et de définir précisément ce à quoi chacun peut accéder dans votre espace.',
    steps: [
      {
        number: 1,
        title: 'Inviter un membre',
        description:
          'Dans "Mon Équipe", cliquez sur "Inviter un membre". Saisissez l\'adresse email de votre collaborateur. Il recevra un email d\'invitation pour créer son compte et rejoindre votre organisation.',
        tip: 'Votre collaborateur doit utiliser exactement l\'adresse email que vous avez indiquée pour s\'inscrire.',
      },
      {
        number: 2,
        title: 'Définir les permissions d\'accès',
        description:
          'Une fois le membre actif, cliquez sur sa fiche puis sur "Gérer les permissions". Cochez les sections auxquelles il peut accéder (ex : Stocks uniquement, ou Stocks + Caisse). Il ne verra que ce que vous lui autorisez.',
        tip: 'Un gérant de nuit n\'a pas forcément besoin d\'accéder aux données financières annuelles.',
      },
      {
        number: 3,
        title: 'Attribuer un rôle',
        description:
          'Vous pouvez attribuer des rôles prédéfinis (ex : Gérant, Employé, Comptable) ou des rôles personnalisés que vous aurez créés. Les rôles simplifient la gestion des permissions pour plusieurs membres.',
      },
      {
        number: 4,
        title: 'Suspendre ou retirer un membre',
        description:
          'Si un collaborateur quitte votre commerce, cliquez sur sa fiche et sélectionnez "Suspendre" pour bloquer temporairement son accès, ou "Retirer" pour le supprimer définitivement de l\'équipe.',
        tip: 'Suspendre est préférable à retirer si le collaborateur est absent temporairement.',
      },
    ],
    notes: [
      'Le nombre de membres autorisés dépend de votre plan d\'abonnement.',
      'Vous êtes le seul à pouvoir gérer les membres et leurs permissions en tant que propriétaire.',
    ],
  },
  {
    id: 'abonnement',
    label: 'Mon Abonnement',
    icon: 'badge',
    intro:
      'La section "Mon Abonnement" vous permet de suivre votre plan actuel, de le modifier, et d\'accéder à votre historique de factures.',
    steps: [
      {
        number: 1,
        title: 'Consulter votre plan actuel',
        description:
          'Dans "Mon Abonnement", vous voyez en un coup d\'œil votre plan (Mensuel, Semestriel, Annuel), la date de fin de période, le montant du prochain prélèvement et votre statut (Actif, Essai, Suspendu).',
      },
      {
        number: 2,
        title: 'Changer de plan',
        description:
          'Si vos besoins évoluent, cliquez sur "Changer de plan". Vous pouvez passer à un plan supérieur (ex : Mensuel → Annuel) ou inférieur. Le changement prend effet à la fin de la période en cours.',
        tip: 'Le plan Annuel est le plus économique si vous utilisez Ravito Gestion tout au long de l\'année.',
      },
      {
        number: 3,
        title: 'Effectuer un paiement',
        description:
          'Lorsqu\'une facture est en attente, un bouton "Payer" apparaît. Cliquez dessus, choisissez votre moyen de paiement (Wave, Orange Money, MTN Money) et suivez les instructions. Le paiement est confirmé en temps réel.',
        tip: 'Gardez votre téléphone à portée de main pour valider le paiement sur votre application de paiement mobile.',
      },
      {
        number: 4,
        title: 'Télécharger une facture',
        description:
          'Dans l\'onglet "Historique", toutes vos factures sont listées. Cliquez sur le bouton de téléchargement (icône PDF) à côté d\'une facture pour l\'enregistrer sur votre appareil.',
      },
    ],
    notes: [
      'La période d\'essai d\'un mois est offerte une seule fois par organisation.',
      'En cas de non-paiement, l\'accès à Ravito Gestion est suspendu jusqu\'à régularisation.',
    ],
  },
  {
    id: 'profil',
    label: 'Mon Profil',
    icon: 'user',
    intro:
      'Votre profil regroupe les informations de votre commerce et de votre compte utilisateur. Gardez-les à jour pour une expérience optimale.',
    steps: [
      {
        number: 1,
        title: 'Modifier vos informations',
        description:
          'Dans "Mon Profil", cliquez sur "Modifier". Vous pouvez mettre à jour le nom de votre commerce, votre adresse, votre numéro de téléphone et votre description. Cliquez sur "Enregistrer" pour valider.',
      },
      {
        number: 2,
        title: 'Ajouter une photo de devanture',
        description:
          'Cliquez sur l\'icône d\'appareil photo sur votre photo de profil. Sélectionnez une image de bonne qualité de votre commerce. Elle sera visible par les fournisseurs qui reçoivent vos commandes.',
        tip: 'Une photo nette et récente renforce la confiance de vos partenaires fournisseurs.',
      },
      {
        number: 3,
        title: 'Changer votre mot de passe',
        description:
          'Dans l\'onglet "Sécurité" de votre profil, vous pouvez modifier votre mot de passe. Saisissez votre mot de passe actuel, puis le nouveau deux fois pour confirmer. Validez.',
        tip: 'Choisissez un mot de passe d\'au moins 8 caractères, mêlant lettres, chiffres et symboles.',
      },
      {
        number: 4,
        title: 'Localisation de votre commerce',
        description:
          'Vous pouvez définir la position GPS de votre commerce sur la carte. Cliquez sur "Définir ma position" et centrez le marqueur sur votre emplacement réel. Cela améliore la précision des livraisons.',
      },
    ],
    notes: [
      'Vos informations personnelles sont confidentielles et ne sont jamais partagées avec des tiers.',
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'headset',
    intro:
      'En cas de difficulté ou de question, l\'équipe Ravito est disponible pour vous aider. Voici comment contacter efficacement le support.',
    steps: [
      {
        number: 1,
        title: 'Accéder au support',
        description:
          'Cliquez sur "Support" dans le menu. Vous accédez à l\'espace de création de tickets d\'assistance et à l\'historique de vos demandes.',
      },
      {
        number: 2,
        title: 'Créer un ticket d\'assistance',
        description:
          'Cliquez sur "Nouvelle demande". Choisissez la catégorie de votre problème (ex : Facturation, Technique, Comptabilité). Décrivez votre problème en détail et joignez une capture d\'écran si nécessaire. Soumettez le ticket.',
        tip: 'Plus votre description est précise, plus vite notre équipe peut résoudre votre problème.',
      },
      {
        number: 3,
        title: 'Suivre l\'avancement de votre ticket',
        description:
          'Vos tickets ouverts apparaissent dans la liste avec leur statut : "En attente", "En cours", "Résolu". Cliquez sur un ticket pour voir les échanges avec l\'équipe support et répondre si besoin.',
      },
      {
        number: 4,
        title: 'Contacter par email',
        description:
          'Pour une question rapide, vous pouvez également envoyer un email à support@ravito.ci en mentionnant le nom de votre commerce et votre adresse email de connexion.',
      },
    ],
    notes: [
      'Le délai de réponse habituel est de 24h ouvrées.',
      'Pour les urgences, précisez "URGENT" dans l\'objet de votre ticket.',
    ],
  },
];
