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

export const SUPPLIER_GUIDE_TABS: GuideTab[] = [
  {
    id: 'demarrage',
    label: 'Démarrage',
    icon: 'rocket',
    intro:
      "Bienvenue dans l'espace Fournisseur Ravito. Ce guide vous explique comment configurer votre profil, recevoir des commandes, gérer vos offres et suivre votre activité sur la plateforme.",
    steps: [
      {
        number: 1,
        title: "S'inscrire et soumettre sa demande",
        description:
          "Lors de votre inscription, renseignez le nom de votre établissement, votre numéro de téléphone, votre zone de couverture et les produits que vous distribuez (Solibra, Brassivoire). Votre dossier est ensuite soumis à l'équipe Ravito pour validation.",
        tip: "Une inscription complète (avec photo de devanture et géolocalisation du dépôt) est traitée beaucoup plus rapidement.",
      },
      {
        number: 2,
        title: "Attendre la validation de votre compte",
        description:
          "Après soumission, votre dossier est examiné par un administrateur Ravito. Vous recevez une notification dès que votre compte est approuvé. En attendant, vous pouvez compléter votre profil.",
      },
      {
        number: 3,
        title: "Compléter votre profil",
        description:
          "Dans l'onglet 'Mon Profil', renseignez toutes vos informations : nom du gérant, téléphone, adresse du dépôt, horaires d'activité, produits disponibles, moyens de paiement acceptés et géolocalisation de votre dépôt. Ces données sont visibles par les clients lors de la sélection d'un fournisseur.",
        tip: "Un profil 100% complet augmente vos chances d'être sélectionné par les clients.",
      },
      {
        number: 4,
        title: "Comprendre la navigation",
        description:
          "Le menu latéral vous donne accès aux différentes sections de votre espace fournisseur : profil, commandes disponibles, mes offres, zones, trésorerie, équipe et support. Naviguez en cliquant sur chaque item.",
      },
    ],
    notes: [
      "Votre compte doit être approuvé par un admin Ravito avant de pouvoir recevoir des commandes.",
      "Toutes vos informations de profil sont stockées de manière sécurisée et ne sont jamais partagées avec des tiers.",
    ],
  },
  {
    id: 'profil',
    label: 'Mon Profil',
    icon: 'store',
    intro:
      "Votre profil est votre vitrine sur Ravito. Il est consulté par les clients avant de vous sélectionner comme fournisseur. Plus il est complet et précis, plus vous avez de chances d'être choisi.",
    steps: [
      {
        number: 1,
        title: "Renseigner vos informations de contact",
        description:
          "Saisissez le nom de votre gérant, votre numéro de téléphone principal et le nom de votre établissement. Ces informations permettent aux clients et à l'équipe Ravito de vous contacter rapidement.",
      },
      {
        number: 2,
        title: "Définir vos horaires d'activité",
        description:
          "Précisez les horaires pendant lesquels vous êtes disponible pour recevoir et préparer des commandes (ex : '18h00 - 06h00'). Les clients voient ces horaires lors de la sélection d'un fournisseur.",
        tip: "Si vos horaires varient, indiquez la plage la plus large et ajustez votre statut de disponibilité manuellement.",
      },
      {
        number: 3,
        title: "Sélectionner vos produits disponibles",
        description:
          "Cochez les marques que vous distribuez : Solibra et/ou Brassivoire. Ces informations sont utilisées pour filtrer les commandes pertinentes dans votre zone.",
      },
      {
        number: 4,
        title: "Configurer les moyens de paiement acceptés",
        description:
          "Indiquez les modes de règlement que vous acceptez : Orange Money, MTN Mobile Money, Moov Money, Wave, espèces. Cela aide les clients à choisir leur mode de paiement au moment de la commande.",
      },
      {
        number: 5,
        title: "Géolocaliser votre dépôt",
        description:
          "Utilisez le sélecteur de localisation pour placer le marqueur précisément sur votre dépôt. Renseignez également l'adresse complète et les instructions d'accès (ex : 'Portail bleu, derrière la station Total'). Cela guide les livreurs et les clients.",
        tip: "Une géolocalisation précise est indispensable pour que vos livraisons arrivent au bon endroit.",
      },
      {
        number: 6,
        title: "Ajouter la photo de votre devanture",
        description:
          "Téléchargez une photo claire et récente de la façade de votre établissement. Cette photo rassure les clients sur l'existence physique de votre commerce et accélère la validation de votre compte.",
      },
      {
        number: 7,
        title: "Activer/désactiver votre disponibilité",
        description:
          "Depuis la carte de résumé en haut de votre profil, vous pouvez activer ou désactiver votre disponibilité en un clic. En mode 'Indisponible', vous ne recevrez plus de nouvelles commandes jusqu'à réactivation.",
        tip: "Pensez à passer en 'Indisponible' lors de vos congés ou ruptures de stock importantes.",
      },
    ],
    notes: [
      "Les modifications de profil sont enregistrées immédiatement et visibles par les clients.",
      "Un alerte en haut de votre profil vous indique les informations manquantes qui pourraient freiner votre validation.",
    ],
  },
  {
    id: 'commandes',
    label: 'Commandes Disponibles',
    icon: 'clipboard-list',
    intro:
      "La section 'Commandes Disponibles' affiche toutes les commandes de clients dans vos zones de livraison auxquelles vous pouvez répondre. C'est ici que vous commencez à générer du chiffre d'affaires.",
    steps: [
      {
        number: 1,
        title: "Consulter les commandes disponibles",
        description:
          "La liste affiche toutes les commandes ouvertes dans vos zones : produits demandés, quantités, adresse de livraison et heure de passage de la commande. Les commandes récentes apparaissent en premier.",
        tip: "Répondez rapidement : un client peut sélectionner le premier fournisseur qui propose une offre attractive.",
      },
      {
        number: 2,
        title: "Analyser le détail d'une commande",
        description:
          "Cliquez sur une commande pour voir son détail complet : liste des produits avec les quantités demandées, l'adresse de livraison du client, la distance approximative et l'heure souhaitée.",
      },
      {
        number: 3,
        title: "Créer une offre pour une commande",
        description:
          "Cliquez sur 'Faire une offre'. Dans le formulaire, vous pouvez confirmer ou ajuster les quantités disponibles, appliquer vos prix personnalisés, et indiquer les emballages consignés (caisses, palettes). Vérifiez le montant total avant de soumettre.",
        tip: "Si vous n'avez pas tous les produits demandés, vous pouvez quand même proposer une offre partielle. Le client décidera.",
      },
      {
        number: 4,
        title: "Suivre l'état de vos offres",
        description:
          "Une fois votre offre soumise, elle apparaît dans la section 'Mes Offres' avec le statut 'En attente'. Le client recevra une notification et pourra accepter, refuser ou négocier votre offre.",
      },
    ],
    notes: [
      "Vous ne pouvez soumettre qu'une seule offre par commande.",
      "Les commandes expirent après un délai défini par la plateforme si aucun fournisseur ne répond.",
      "Votre taux de réponse aux commandes disponibles est pris en compte dans votre score de fiabilité.",
    ],
  },
  {
    id: 'offres',
    label: 'Mes Offres',
    icon: 'send',
    intro:
      "La section 'Mes Offres' centralise toutes les offres que vous avez soumises et les commandes acceptées. C'est votre tableau de suivi de l'activité commerciale en cours.",
    steps: [
      {
        number: 1,
        title: "Consulter vos offres en attente",
        description:
          "L'onglet 'Offres en attente' liste les offres que vous avez soumises mais pour lesquelles le client n'a pas encore statué. Le délai depuis la soumission est affiché pour chaque offre.",
      },
      {
        number: 2,
        title: "Suivre les commandes actives",
        description:
          "L'onglet 'Commandes actives' affiche les commandes dont votre offre a été acceptée par le client. Pour chaque commande, vous voyez le statut : 'En attente de paiement', 'Payé', 'En préparation', 'En livraison'.",
        tip: "Mettez à jour le statut de chaque commande au fur et à mesure pour informer le client en temps réel.",
      },
      {
        number: 3,
        title: "Préparer et confirmer une commande payée",
        description:
          "Dès qu'une commande passe au statut 'Payé', commencez la préparation. Passez manuellement la commande en statut 'En préparation' pour signaler au client que vous avez bien pris en charge sa commande.",
      },
      {
        number: 4,
        title: "Gérer la livraison",
        description:
          "Quand la commande est prête et remise au livreur, passez-la en 'En livraison'. Le client reçoit une notification et peut suivre la progression de sa commande.",
      },
      {
        number: 5,
        title: "Confirmer la livraison avec le code",
        description:
          "À la réception, le client communique son code de confirmation à 8 chiffres. Saisissez ce code pour valider définitivement la livraison. Cette étape déclenche le virement de votre paiement.",
        tip: "Ne confirmez jamais une livraison sans le code du client. Cela protège à la fois le client et vous.",
      },
    ],
    notes: [
      "Une offre refusée par le client n'est pas facturée. Vous pouvez proposer une nouvelle offre sur une autre commande.",
      "La confirmation de livraison par code est obligatoire pour que le paiement soit libéré.",
    ],
  },
  {
    id: 'zones',
    label: 'Zones de Livraison',
    icon: 'map-pin',
    intro:
      "Les Zones de Livraison définissent les secteurs géographiques dans lesquels vous pouvez opérer et recevoir des commandes. Plus vous couvrez de zones actives, plus vous avez de commandes potentielles.",
    steps: [
      {
        number: 1,
        title: "Consulter les zones disponibles",
        description:
          "La liste affiche toutes les zones actives de la plateforme avec le nombre de fournisseurs déjà présents dans chaque zone. Cliquez sur une zone pour voir sa description géographique.",
      },
      {
        number: 2,
        title: "Demander l'accès à une nouvelle zone",
        description:
          "Cliquez sur 'Demander l'accès' pour la zone souhaitée. Votre demande est transmise aux administrateurs Ravito qui vérifient que votre dépôt peut effectivement couvrir cette zone.",
        tip: "Choisissez uniquement les zones que vous pouvez couvrir réellement. Une mauvaise couverture dégrade votre note de fiabilité.",
      },
      {
        number: 3,
        title: "Suivre le statut de vos demandes",
        description:
          "Vos demandes en cours apparaissent dans la section 'Demandes en attente' avec leur statut (En attente, Approuvée, Refusée). En cas de refus, le motif est indiqué pour vous permettre de corriger votre dossier.",
      },
      {
        number: 4,
        title: "Consulter vos zones approuvées",
        description:
          "Les zones dans lesquelles vous êtes approuvé apparaissent dans la section 'Mes zones'. Ce sont les zones pour lesquelles vous recevez des commandes disponibles.",
      },
    ],
    notes: [
      "Votre abonnement peut limiter le nombre de zones dans lesquelles vous pouvez opérer simultanément.",
      "Une zone désactivée par l'administration ne génère plus de commandes jusqu'à sa réactivation.",
    ],
  },
  {
    id: 'tresorerie',
    label: 'Trésorerie',
    icon: 'wallet',
    intro:
      "La Trésorerie vous donne une vue complète de vos flux financiers sur Ravito : revenus des ventes, commissions prélevées, retraits effectués et solde disponible.",
    steps: [
      {
        number: 1,
        title: "Consulter votre solde disponible",
        description:
          "La carte de solde en haut de la page affiche votre solde disponible en temps réel. C'est le montant que vous pouvez retirer à tout moment.",
      },
      {
        number: 2,
        title: "Lire l'historique des transactions",
        description:
          "La liste des transactions affiche l'ensemble de vos mouvements financiers : encaissements (commandes payées), commissions Ravito déduites, retraits et éventuels bonus. Chaque transaction est horodatée avec le libellé de la commande associée.",
      },
      {
        number: 3,
        title: "Filtrer vos transactions",
        description:
          "Utilisez les filtres pour afficher uniquement les transactions d'une période donnée ou d'un type précis (Vente, Commission, Retrait, Bonus). Cela facilite la réconciliation comptable.",
      },
      {
        number: 4,
        title: "Visualiser vos revenus",
        description:
          "Le graphique de revenus affiche votre chiffre d'affaires mensuel sur les dernières semaines ou mois. Il vous aide à identifier vos meilleures périodes et à anticiper votre activité.",
      },
      {
        number: 5,
        title: "Effectuer un retrait",
        description:
          "Cliquez sur 'Retirer des fonds'. Saisissez le montant souhaité et votre numéro de Mobile Money (Orange, MTN, Moov ou Wave). Validez la demande. Le virement est traité dans les délais indiqués.",
        tip: "Vérifiez bien le numéro de Mobile Money avant de confirmer. Les retraits sur numéros incorrects ne peuvent pas être annulés.",
      },
      {
        number: 6,
        title: "Exporter vos données financières",
        description:
          "Cliquez sur 'Exporter' pour télécharger vos transactions au format Excel ou CSV sur la période sélectionnée. Utile pour votre comptabilité ou votre déclaration fiscale.",
      },
    ],
    notes: [
      "La commission Ravito est automatiquement déduite de chaque transaction avant crédit de votre solde.",
      "Les retraits peuvent être soumis à un délai de traitement selon le volume et le prestataire Mobile Money.",
    ],
  },
  {
    id: 'abonnement',
    label: 'Mon Abonnement',
    icon: 'badge-check',
    intro:
      "Votre abonnement détermine votre niveau d'accès sur la plateforme Ravito : nombre de zones, accès aux analytics, support prioritaire. Choisissez le plan adapté à votre volume d'activité.",
    steps: [
      {
        number: 1,
        title: "Consulter votre plan actuel",
        description:
          "La page d'abonnement affiche votre plan en cours (Gratuit, Argent, Or ou Platine), sa date d'expiration et les fonctionnalités incluses. Un encadré met en évidence les fonctionnalités que vous n'avez pas encore débloquées.",
      },
      {
        number: 2,
        title: "Comprendre les niveaux d'abonnement",
        description:
          "Chaque niveau débloque des capacités supplémentaires : le plan Gratuit permet d'opérer dans une zone limitée, les plans supérieurs (Argent, Or, Platine) augmentent le nombre de zones, donnent accès aux analytics avancés et au support prioritaire.",
        tip: "Si vous souhaitez couvrir plusieurs zones simultanément, un plan payant est nécessaire.",
      },
      {
        number: 3,
        title: "Upgrader son abonnement",
        description:
          "Cliquez sur le plan souhaité puis sur 'Passer à ce plan'. Sélectionnez votre moyen de paiement (Mobile Money), confirmez le montant, puis validez. Votre plan est mis à jour instantanément après confirmation du paiement.",
      },
      {
        number: 4,
        title: "Gérer le renouvellement",
        description:
          "Votre abonnement est renouvelé automatiquement à l'échéance si le paiement est configuré. Vous recevez des rappels par notification 7 jours et 1 jour avant l'expiration. En cas de non-renouvellement, votre compte est suspendu après le délai de grâce.",
        tip: "Assurez-vous d'avoir un solde suffisant sur votre Mobile Money à la date de renouvellement.",
      },
    ],
    notes: [
      "Un compte suspendu ne reçoit plus de commandes disponibles, mais vos données et historiques sont conservés.",
      "En cas de problème de paiement, contactez le support immédiatement pour éviter l'interruption de service.",
    ],
  },
  {
    id: 'intelligence',
    label: 'Analytics & Intelligence',
    icon: 'bar-chart-2',
    intro:
      "Le tableau de bord Analytics (disponible à partir du plan Argent) vous donne accès à des indicateurs de performance détaillés pour piloter et optimiser votre activité sur Ravito.",
    steps: [
      {
        number: 1,
        title: "Consulter vos indicateurs de performance (KPIs)",
        description:
          "Le dashboard affiche vos KPIs clés : taux d'acceptation des offres, délai de réponse moyen, note client moyenne et chiffre d'affaires de la période. Chaque indicateur est coloré selon votre niveau de performance (vert = bon, orange = à améliorer, rouge = critique).",
        tip: "Un taux d'acceptation élevé et un délai de réponse court augmentent votre priorité dans les suggestions faites aux clients.",
      },
      {
        number: 2,
        title: "Analyser votre évolution dans le temps",
        description:
          "Les graphiques d'évolution montrent vos performances semaine par semaine ou mois par mois. Comparez vos tendances pour identifier vos meilleures périodes et adapter votre disponibilité en conséquence.",
      },
      {
        number: 3,
        title: "Identifier vos produits les plus vendus",
        description:
          "Le tableau des produits les plus demandés dans vos zones vous aide à prioriser vos stocks. Si un produit revient souvent dans les commandes, assurez-vous d'en avoir toujours en stock.",
      },
      {
        number: 4,
        title: "Comprendre les limites par niveau",
        description:
          "Certaines fonctionnalités analytics sont réservées aux plans supérieurs : historique sur 12 mois (plan Or), intelligence concurrentielle (plan Platine). Les fonctionnalités verrouillées sont indiquées avec un bouton d'upgrade.",
      },
    ],
    notes: [
      "Les données analytics sont mises à jour toutes les 24 heures.",
      "Le plan Gratuit donne accès à un historique limité à 30 jours. Les plans payants débloquent des historiques plus longs.",
    ],
  },
  {
    id: 'equipe',
    label: 'Mon Équipe',
    icon: 'users',
    intro:
      "La section Mon Équipe vous permet d'inviter des collaborateurs (livreurs, caissiers, assistants) et de leur attribuer des accès spécifiques à votre espace fournisseur.",
    steps: [
      {
        number: 1,
        title: "Inviter un collaborateur",
        description:
          "Cliquez sur '+ Inviter un membre'. Saisissez l'email de votre collaborateur et sélectionnez son rôle (Livreur, Assistant, etc.). Il recevra un email d'invitation pour créer son compte et rejoindre votre espace.",
        tip: "Votre plan d'abonnement détermine le nombre maximum de membres que vous pouvez inviter.",
      },
      {
        number: 2,
        title: "Attribuer des permissions",
        description:
          "Pour chaque membre, vous pouvez configurer ses droits d'accès : quelles sections il peut voir et quelles actions il peut effectuer. Un livreur n'a pas besoin d'accéder à votre trésorerie, par exemple.",
      },
      {
        number: 3,
        title: "Gérer les membres actifs",
        description:
          "La liste des membres affiche le nom, le rôle et le statut de chaque collaborateur. Vous pouvez désactiver un accès temporairement (ex : pendant les congés) ou le supprimer définitivement.",
      },
      {
        number: 4,
        title: "Suivre les invitations en attente",
        description:
          "L'onglet 'Invitations' liste les invitations envoyées qui n'ont pas encore été acceptées. Vous pouvez relancer ou annuler une invitation depuis cette liste.",
      },
    ],
    notes: [
      "Les membres de votre équipe agissent au nom de votre compte. Vous êtes responsable de leurs actions.",
      "Un membre désactivé ne peut plus se connecter mais ses données historiques sont conservées.",
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'headphones',
    intro:
      "Le Support vous permet de contacter directement l'équipe Ravito pour tout problème ou question concernant votre activité sur la plateforme.",
    steps: [
      {
        number: 1,
        title: "Créer un nouveau ticket",
        description:
          "Cliquez sur '+ Nouveau ticket'. Sélectionnez la catégorie de votre problème (Facturation, Technique, Commande, Zone, Compte...) et la priorité (Normale, Haute, Urgente). Rédigez un message clair et détaillé pour une prise en charge rapide.",
        tip: "Plus votre description est précise (numéro de commande, montant, heure), plus la résolution sera rapide.",
      },
      {
        number: 2,
        title: "Suivre vos tickets ouverts",
        description:
          "La liste de vos tickets affiche leur statut (En attente, En cours, Résolu) et la date du dernier message. Cliquez sur un ticket pour consulter la conversation et voir la réponse de l'équipe support.",
      },
      {
        number: 3,
        title: "Répondre et échanger avec le support",
        description:
          "Dans le détail d'un ticket, utilisez la zone de texte en bas pour répondre aux questions du support ou fournir des informations complémentaires. Chaque échange est horodaté.",
      },
      {
        number: 4,
        title: "Clôturer un ticket résolu",
        description:
          "Une fois votre problème résolu, le support clôture le ticket. Si vous estimez que le problème persiste, rouvrez-le depuis la liste en cliquant sur 'Rouvrir'. Un ticket résolu reste consultable dans l'historique.",
      },
    ],
    notes: [
      "Les tickets urgents sont traités en priorité dans la file d'attente de l'équipe support.",
      "Pour les problèmes de paiement non résolu sous 24h, indiquez 'Urgente' dans la priorité.",
    ],
  },
];
