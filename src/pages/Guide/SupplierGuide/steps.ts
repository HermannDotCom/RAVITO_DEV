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
    id: 'dashboard',
    label: 'Accueil',
    icon: 'layout-dashboard',
    intro:
      "L'écran d'Accueil est votre tableau de bord principal en tant que fournisseur. Il vous donne une vue synthétique de votre activité en cours, des commandes disponibles et de votre performance.",
    steps: [
      {
        number: 1,
        title: "Consulter les indicateurs en temps réel",
        description:
          "Le tableau de bord affiche vos KPIs clés : nombre de commandes disponibles dans vos zones, offres en attente de réponse client, commandes actives en cours de livraison et votre solde disponible. Ces chiffres se mettent à jour en temps réel.",
      },
      {
        number: 2,
        title: "Voir les commandes urgentes",
        description:
          "Les commandes récentes ou arrivant bientôt à expiration sont mises en avant pour que vous puissiez y répondre en priorité. Un indicateur de temps vous signale les commandes à traiter rapidement.",
        tip: "Répondre dans les premières minutes augmente significativement vos chances d'être sélectionné par le client.",
      },
      {
        number: 3,
        title: "Accéder rapidement aux sections",
        description:
          "Des raccourcis en bas du tableau de bord permettent d'aller directement aux commandes disponibles, à vos offres en cours ou à votre trésorerie sans passer par le menu latéral.",
      },
      {
        number: 4,
        title: "Comprendre votre statut de disponibilité",
        description:
          "Un indicateur sur l'accueil affiche si vous êtes en mode 'Disponible' ou 'Indisponible'. Quand vous êtes indisponible, vous ne recevez plus de nouvelles commandes. Basculez votre statut depuis votre profil.",
      },
    ],
    notes: [
      "Le tableau de bord se rafraîchit automatiquement pour refléter les nouvelles commandes entrantes.",
      "Un compte non encore approuvé par Ravito verra un message d'alerte sur l'accueil.",
    ],
  },
  {
    id: 'delivery-mode',
    label: 'Mode Livreur',
    icon: 'truck',
    intro:
      "Le Mode Livreur est une vue simplifiée et optimisée pour les membres de votre équipe en charge des livraisons. Il affiche uniquement les informations nécessaires à la réalisation d'une tournée.",
    steps: [
      {
        number: 1,
        title: "Activer le mode livreur",
        description:
          "Depuis l'accueil ou le menu, activez le mode livreur pour basculer vers l'interface simplifiée. Ce mode est conçu pour être utilisé sur téléphone mobile lors des déplacements.",
      },
      {
        number: 2,
        title: "Consulter les livraisons assignées",
        description:
          "La liste affiche uniquement les commandes qui vous sont assignées en tant que livreur, avec l'adresse de livraison, le nom du client, les articles à livrer et le mode de paiement prévu.",
      },
      {
        number: 3,
        title: "Naviguer vers l'adresse de livraison",
        description:
          "Appuyez sur l'adresse d'une livraison pour ouvrir votre application de navigation et obtenir l'itinéraire jusqu'au client. La géolocalisation du dépôt du client est utilisée si disponible.",
        tip: "Si le client a fourni des instructions d'accès, elles sont affichées sous l'adresse. Lisez-les avant de partir.",
      },
      {
        number: 4,
        title: "Confirmer une livraison avec le code",
        description:
          "À la remise de la commande, demandez au client son code de confirmation à 8 chiffres. Saisissez ce code dans l'interface pour valider définitivement la livraison. Cette action déclenche le paiement.",
        tip: "Ne confirmez jamais une livraison sans le code du client, même si le client insiste. Ce code protège les deux parties.",
      },
      {
        number: 5,
        title: "Signaler un problème de livraison",
        description:
          "En cas d'incident (client absent, adresse introuvable, refus de la commande), utilisez le bouton 'Signaler un problème' pour notifier l'équipe support et le client.",
      },
    ],
    notes: [
      "Le mode livreur peut être utilisé par n'importe quel membre de votre équipe ayant les permissions de livraison.",
      "Les confirmations de livraison sont irréversibles. Vérifiez bien le code avant de valider.",
    ],
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: 'clipboard-list',
    intro:
      "La section Commandes est le cœur de votre activité sur Ravito. Elle centralise les commandes disponibles dans vos zones auxquelles vous pouvez répondre, vos offres en attente et vos commandes actives.",
    steps: [
      {
        number: 1,
        title: "Onglet 'Disponibles' — Commandes sans offre",
        description:
          "Cet onglet affiche toutes les commandes ouvertes dans vos zones pour lesquelles vous n'avez pas encore soumis d'offre. Pour chaque commande, vous voyez les produits demandés, les quantités, la zone de livraison et le temps écoulé depuis la commande.",
        tip: "Les commandes les plus récentes sont en haut. Plus vous répondez vite, plus vous avez de chances d'être choisi.",
      },
      {
        number: 2,
        title: "Créer une offre pour une commande",
        description:
          "Cliquez sur une commande puis sur 'Faire une offre'. Dans le formulaire, vous pouvez ajuster les quantités disponibles, appliquer vos prix personnalisés ou les prix de référence, et indiquer le statut des emballages consignés (caisses). Vérifiez le montant total avant de soumettre.",
        tip: "Si vous n'avez pas tous les produits, vous pouvez quand même soumettre une offre partielle. Le client décidera s'il l'accepte.",
      },
      {
        number: 3,
        title: "Onglet 'Mes Offres' — En attente de réponse",
        description:
          "Cet onglet liste toutes les offres que vous avez soumises et pour lesquelles le client n'a pas encore statué. Vous voyez pour chaque offre le délai depuis la soumission et le montant proposé.",
      },
      {
        number: 4,
        title: "Onglet 'Actives' — Commandes en cours",
        description:
          "Les commandes dont votre offre a été acceptée apparaissent ici. Chaque commande affiche son statut actuel : 'En attente de paiement', 'Payé', 'En préparation' ou 'En livraison'. Mettez à jour le statut au fur et à mesure.",
      },
      {
        number: 5,
        title: "Mettre à jour le statut d'une commande",
        description:
          "Une fois qu'une commande est payée, passez-la en 'En préparation' pour informer le client. Quand la commande est remise au livreur, passez-la en 'En livraison'. Ces changements déclenchent des notifications automatiques pour le client.",
      },
    ],
    notes: [
      "Vous ne pouvez soumettre qu'une seule offre par commande.",
      "Une offre refusée par le client n'est pas facturée. Votre taux de refus peut influencer votre visibilité.",
      "Les commandes expirent si aucun fournisseur ne répond dans le délai imparti.",
    ],
  },
  {
    id: 'deliveries',
    label: 'Livraisons',
    icon: 'package',
    intro:
      "La section Livraisons regroupe toutes les commandes en cours de livraison. C'est ici que vous suivez et finalisez les livraisons jusqu'à la confirmation par le client.",
    steps: [
      {
        number: 1,
        title: "Consulter les livraisons en cours",
        description:
          "La liste affiche les commandes actuellement en statut 'En livraison' avec les informations de chaque client : adresse, articles commandés, code de confirmation attendu et heure d'envoi.",
      },
      {
        number: 2,
        title: "Voir le détail d'une livraison",
        description:
          "Cliquez sur une livraison pour voir le détail complet : adresse précise avec instructions d'accès, liste des articles avec quantités, montant total et mode de paiement prévu.",
      },
      {
        number: 3,
        title: "Confirmer la réception avec le code client",
        description:
          "À la livraison, le client communique son code de confirmation à 8 chiffres visible dans son application. Saisissez ce code dans l'interface pour valider la livraison. La transaction est alors définitivement enregistrée.",
        tip: "En cas de code refusé, vérifiez que vous êtes bien sur la bonne commande et que le client communique le bon code (visible dans 'Mes commandes').",
      },
      {
        number: 4,
        title: "Gérer les livraisons problématiques",
        description:
          "Si une livraison échoue (client absent, adresse incorrecte, refus), utilisez le bouton de signalement pour documenter le problème. L'équipe support sera notifiée et pourra intervenir.",
      },
    ],
    notes: [
      "La confirmation de livraison déclenche automatiquement le virement du montant sur votre solde Ravito.",
      "Un livreur assigné à votre équipe peut confirmer les livraisons depuis le mode livreur.",
    ],
  },
  {
    id: 'treasury',
    label: 'Revenus',
    icon: 'wallet',
    intro:
      "La section Revenus vous donne une vision complète de vos flux financiers sur Ravito : encaissements, commissions, retraits et évolution de votre chiffre d'affaires.",
    steps: [
      {
        number: 1,
        title: "Consulter votre solde disponible",
        description:
          "La carte en haut de la page affiche votre solde disponible (montant retirable), le montant en attente de confirmation (livraisons en cours), et le total gagné sur le mois.",
      },
      {
        number: 2,
        title: "Analyser le graphique de revenus",
        description:
          "Le graphique affiche votre chiffre d'affaires mensuel sur les 6 derniers mois. La partie verte représente votre revenu net après commission Ravito. Utilisez ce graphique pour identifier vos meilleures périodes et adapter vos disponibilités.",
      },
      {
        number: 3,
        title: "Lire l'historique des transactions",
        description:
          "La liste détaille chaque mouvement financier avec son type : Vente (encaissement d'une commande), Commission (part Ravito déduite automatiquement), Retrait (virement vers Mobile Money), Bonus (promotion ou ajustement). Chaque ligne affiche le montant, le libellé et la date.",
      },
      {
        number: 4,
        title: "Filtrer les transactions",
        description:
          "Utilisez les filtres pour afficher une période précise (7 jours, 30 jours, 90 jours, tout) ou un type de transaction spécifique. La barre de recherche permet de retrouver une transaction par description ou numéro de commande.",
      },
      {
        number: 5,
        title: "Effectuer un retrait",
        description:
          "Cliquez sur 'Retirer des fonds'. Saisissez le montant souhaité (inférieur ou égal à votre solde disponible) et votre numéro de Mobile Money. Choisissez l'opérateur (Orange Money, MTN, Moov ou Wave) et confirmez. Le virement est effectué dans les délais affichés.",
        tip: "Vérifiez minutieusement votre numéro Mobile Money avant de confirmer. Les retraits vers des numéros incorrects ne peuvent pas être annulés.",
      },
      {
        number: 6,
        title: "Exporter vos données financières",
        description:
          "Cliquez sur 'Exporter' pour télécharger un fichier Excel ou CSV de vos transactions sur la période sélectionnée. Utile pour votre comptabilité mensuelle ou votre déclaration fiscale.",
      },
    ],
    notes: [
      "La commission Ravito (5%) est déduite automatiquement à chaque encaissement et apparaît comme une ligne séparée dans l'historique.",
      "Les retraits peuvent prendre jusqu'à 24h selon l'opérateur Mobile Money et le volume des demandes en cours.",
    ],
  },
  {
    id: 'zones',
    label: 'Mes Zones',
    icon: 'map-pin',
    intro:
      "La section Mes Zones vous permet de gérer les secteurs géographiques dans lesquels vous êtes autorisé à opérer et recevoir des commandes. Votre couverture de zone est directement liée au volume de commandes que vous recevrez.",
    steps: [
      {
        number: 1,
        title: "Consulter vos zones approuvées",
        description:
          "La liste de vos zones actives apparaît en haut de la page. Ce sont les zones pour lesquelles vous recevez des commandes disponibles dans la section 'Commandes'. Chaque zone indique le nombre de fournisseurs actifs concurrents.",
      },
      {
        number: 2,
        title: "Demander l'accès à une nouvelle zone",
        description:
          "Parcourez la liste des zones disponibles (non encore demandées) et cliquez sur 'Demander l'accès' pour la zone souhaitée. Votre demande est transmise aux administrateurs Ravito pour validation.",
        tip: "Demandez uniquement les zones que vous pouvez couvrir réellement en respectant vos délais de livraison. Des livraisons tardives ou annulées dégradent votre note et votre visibilité.",
      },
      {
        number: 3,
        title: "Suivre vos demandes en attente",
        description:
          "L'onglet 'Demandes en attente' liste toutes vos demandes de zones non encore traitées. Chaque demande affiche son statut (En attente, Approuvée, Refusée) et la date de soumission.",
      },
      {
        number: 4,
        title: "Comprendre un refus de zone",
        description:
          "Si une demande est refusée, le motif du refus est affiché. Corrigez les points soulevés (ex : profil incomplet, zone hors périmètre de votre dépôt) puis resoumettez une nouvelle demande.",
      },
      {
        number: 5,
        title: "Retirer une zone ou annuler une demande",
        description:
          "Vous pouvez annuler une demande en attente ou demander le retrait d'une zone approuvée si vous ne souhaitez plus y opérer. Cette action prend effet immédiatement : vous ne recevrez plus de commandes de cette zone.",
      },
    ],
    notes: [
      "Votre plan d'abonnement détermine le nombre maximum de zones que vous pouvez couvrir simultanément.",
      "Une zone désactivée par l'administration ne génère plus de commandes jusqu'à sa réactivation par Ravito.",
    ],
  },
  {
    id: 'pricing',
    label: 'Produits Vendus',
    icon: 'tag',
    intro:
      "La section Produits Vendus vous permet de définir vos grilles tarifaires personnalisées par produit et par zone. Ces prix sont utilisés lors de la création de vos offres et peuvent différer des prix de référence Ravito.",
    steps: [
      {
        number: 1,
        title: "Consulter vos grilles de prix existantes",
        description:
          "La liste affiche toutes vos grilles tarifaires actives et passées, avec pour chaque produit : le prix unitaire, le prix à la caisse, le prix de la consigne, la zone concernée et les dates de validité.",
      },
      {
        number: 2,
        title: "Créer une nouvelle grille tarifaire",
        description:
          "Cliquez sur '+ Nouvelle grille'. Sélectionnez le produit, la zone de livraison concernée (ou toutes les zones), puis renseignez vos trois tarifs : prix unitaire (à la bouteille/unité), prix caisse et prix de la consigne de l'emballage. Définissez si nécessaire une date de début et de fin de validité.",
        tip: "Des prix compétitifs augmentent votre taux de sélection, mais assurez-vous de rester rentable après la commission Ravito.",
      },
      {
        number: 3,
        title: "Définir des quantités minimales et maximales",
        description:
          "Pour chaque grille, vous pouvez définir une quantité minimale de commande (ex : minimum 5 caisses) et une quantité maximale que vous pouvez honorer. Ces contraintes sont visibles par les clients lors de leur commande.",
      },
      {
        number: 4,
        title: "Appliquer un taux de remise",
        description:
          "Vous pouvez configurer un pourcentage de remise automatique sur une grille tarifaire. Utile pour les clients réguliers ou les grandes commandes. La remise est calculée et affichée lors de la création de votre offre.",
      },
      {
        number: 5,
        title: "Mettre à jour ou désactiver un tarif",
        description:
          "Cliquez sur une grille existante pour la modifier ou la désactiver. Une grille désactivée n'est plus proposée lors de la création des offres ; les prix de référence Ravito prennent automatiquement le relais.",
      },
      {
        number: 6,
        title: "Consulter l'historique des modifications",
        description:
          "Chaque grille conserve un historique complet de ses modifications (création, mise à jour, activation, désactivation) avec la date et l'auteur du changement. Cet historique est visible en cliquant sur 'Historique des prix' dans le détail d'une grille.",
      },
    ],
    notes: [
      "Si aucune grille personnalisée n'est définie pour un produit, le prix de référence Ravito est utilisé automatiquement lors de vos offres.",
      "Des prix trop éloignés des prix de référence peuvent déclencher une alerte lors de la création de l'offre.",
    ],
  },
  {
    id: 'history',
    label: 'Historique',
    icon: 'history',
    intro:
      "La section Historique centralise toutes vos commandes et livraisons passées, complétées ou annulées. C'est votre archive complète de l'activité commerciale sur Ravito.",
    steps: [
      {
        number: 1,
        title: "Consulter les commandes terminées",
        description:
          "L'historique liste l'ensemble de vos commandes livrées avec, pour chaque entrée : la date, le client (anonymisé), les produits et quantités, le montant encaissé net de commission, et la note laissée par le client.",
      },
      {
        number: 2,
        title: "Filtrer et rechercher dans l'historique",
        description:
          "Utilisez les filtres de période (semaine, mois, trimestre, tout) et la barre de recherche pour retrouver une commande précise par numéro, zone ou produit. L'affichage peut être trié par date ou par montant.",
      },
      {
        number: 3,
        title: "Voir le détail d'une commande passée",
        description:
          "Cliquez sur une commande pour afficher son détail complet : articles, quantités, montant brut, commission déduite, montant net, et la note du client si elle a été laissée.",
      },
      {
        number: 4,
        title: "Consulter les commandes annulées ou refusées",
        description:
          "Un onglet dédié affiche les offres refusées et les commandes annulées avec le motif si renseigné. Ces données vous aident à comprendre pourquoi certaines offres ne sont pas retenues et à ajuster vos tarifs.",
      },
      {
        number: 5,
        title: "Exporter l'historique",
        description:
          "Cliquez sur 'Exporter' pour télécharger votre historique complet en Excel sur la période sélectionnée. Ce fichier contient toutes les colonnes nécessaires à votre déclaration comptable.",
      },
    ],
    notes: [
      "L'historique est conservé indéfiniment sur votre compte, même après annulation d'un abonnement.",
      "Les notes clients visibles dans l'historique sont utilisées pour calculer votre note moyenne affichée sur votre profil.",
    ],
  },
  {
    id: 'profile',
    label: 'Mon Profil',
    icon: 'store',
    intro:
      "Votre profil est votre vitrine sur Ravito. Il est consulté par les clients avant de vous sélectionner. Un profil complet et à jour augmente significativement votre taux de sélection.",
    steps: [
      {
        number: 1,
        title: "Renseigner vos informations de contact",
        description:
          "Saisissez le nom de votre gérant, votre numéro de téléphone et le nom de votre établissement. Ces informations permettent aux clients et à l'équipe Ravito de vous identifier rapidement.",
      },
      {
        number: 2,
        title: "Définir vos horaires d'activité",
        description:
          "Précisez les horaires pendant lesquels vous êtes disponible pour recevoir et préparer des commandes (ex : '18h00 - 06h00'). Ces horaires sont visibles par les clients lors du choix d'un fournisseur.",
        tip: "Si vos horaires varient les week-ends, indiquez la plage la plus large et activez/désactivez manuellement votre disponibilité.",
      },
      {
        number: 3,
        title: "Sélectionner les marques disponibles",
        description:
          "Cochez les marques que vous distribuez : Solibra et/ou Brassivoire. Ces informations filtrent les commandes pertinentes dans votre zone et informent les clients de ce que vous proposez.",
      },
      {
        number: 4,
        title: "Configurer les moyens de paiement acceptés",
        description:
          "Indiquez les modes de règlement que vous acceptez : Orange Money, MTN Mobile Money, Moov Money, Wave, espèces. Les clients voient cette information lors de la validation de leur commande.",
      },
      {
        number: 5,
        title: "Géolocaliser votre dépôt",
        description:
          "Utilisez le sélecteur de localisation pour placer le marqueur précisément sur votre dépôt. Renseignez l'adresse complète et les instructions d'accès pour les livreurs (ex : 'Portail bleu, derrière la station Total'). Cette géolocalisation est indispensable pour les itinéraires de livraison.",
        tip: "Une géolocalisation précise réduit les erreurs de livraison et les réclamations clients.",
      },
      {
        number: 6,
        title: "Ajouter la photo de votre devanture",
        description:
          "Téléchargez une photo claire et récente de la façade de votre établissement. Cette photo rassure les clients et accélère la validation de votre compte par l'administration Ravito.",
      },
      {
        number: 7,
        title: "Gérer votre disponibilité",
        description:
          "Le bouton en haut de votre profil vous permet de basculer entre 'Disponible' et 'Indisponible'. En mode indisponible, vous n'apparaissez plus dans les résultats de recherche et ne recevez plus de nouvelles commandes.",
        tip: "Passez en 'Indisponible' lors de vos congés, ruptures de stock ou périodes de forte charge pour éviter les commandes que vous ne pourrez pas honorer.",
      },
    ],
    notes: [
      "Les modifications de profil sont enregistrées immédiatement et visibles instantanément par les clients.",
      "Une alerte en haut du profil signale les informations manquantes qui pourraient freiner l'approbation de votre compte.",
    ],
  },
  {
    id: 'team',
    label: 'Mon Équipe',
    icon: 'users',
    intro:
      "La section Mon Équipe vous permet d'inviter des collaborateurs (livreurs, assistants, caissiers) et de gérer leurs accès à votre espace fournisseur Ravito.",
    steps: [
      {
        number: 1,
        title: "Inviter un nouveau membre",
        description:
          "Cliquez sur '+ Inviter un membre'. Saisissez l'adresse email de votre collaborateur et sélectionnez son rôle (Livreur, Assistant, etc.). Il recevra un email d'invitation pour créer son compte et rejoindre votre espace.",
        tip: "Votre plan d'abonnement détermine le nombre maximum de membres que vous pouvez avoir simultanément.",
      },
      {
        number: 2,
        title: "Attribuer des permissions modulaires",
        description:
          "Pour chaque membre, configurez précisément ses droits d'accès : quelles sections il peut consulter (commandes, livraisons, trésorerie...) et quelles actions il peut effectuer. Un livreur n'a pas besoin d'accéder à votre trésorerie.",
      },
      {
        number: 3,
        title: "Gérer les membres actifs",
        description:
          "La liste affiche tous vos collaborateurs avec leur nom, rôle, statut et date d'invitation. Vous pouvez désactiver un accès temporairement (congés) ou le supprimer définitivement si le collaborateur quitte votre établissement.",
      },
      {
        number: 4,
        title: "Suivre les invitations en attente",
        description:
          "L'onglet 'Invitations' liste les invitations envoyées non encore acceptées. Vous pouvez relancer l'email d'invitation ou annuler une invitation depuis cette liste.",
      },
    ],
    notes: [
      "Les membres de votre équipe agissent au nom de votre compte fournisseur. Vous êtes responsable de leurs actions sur la plateforme.",
      "Un membre désactivé ne peut plus se connecter, mais toutes ses actions passées restent tracées dans l'historique.",
    ],
  },
  {
    id: 'support',
    label: 'Support',
    icon: 'headphones',
    intro:
      "Le Support vous permet de contacter directement l'équipe Ravito pour tout problème ou question : commandes litigieuses, problèmes de paiement, questions sur votre abonnement ou votre compte.",
    steps: [
      {
        number: 1,
        title: "Créer un nouveau ticket",
        description:
          "Cliquez sur '+ Nouveau ticket'. Choisissez la catégorie (Facturation, Technique, Commande, Zone, Compte...) et la priorité (Normale, Haute, Urgente). Rédigez un message détaillé avec toutes les informations pertinentes : numéro de commande, montant, date, captures d'écran si nécessaire.",
        tip: "Plus votre description est précise, plus la résolution est rapide. Pensez à inclure le numéro de la commande concernée.",
      },
      {
        number: 2,
        title: "Suivre l'avancement de vos tickets",
        description:
          "La liste de vos tickets affiche leur statut actuel (En attente, En cours de traitement, Résolu) et le délai depuis la dernière réponse. Cliquez sur un ticket pour lire la conversation complète.",
      },
      {
        number: 3,
        title: "Répondre aux questions du support",
        description:
          "Dans le détail d'un ticket, utilisez la zone de saisie en bas pour répondre aux demandes d'information du support ou fournir des précisions complémentaires. Chaque message est horodaté.",
      },
      {
        number: 4,
        title: "Rouvrir un ticket non résolu",
        description:
          "Si vous estimez que votre problème persiste après la clôture d'un ticket, rouvrez-le depuis la liste en cliquant sur 'Rouvrir'. Précisez pourquoi le problème n'est pas résolu pour une prise en charge rapide.",
      },
    ],
    notes: [
      "Les tickets avec priorité 'Urgente' sont traités en premier dans la file d'attente du support.",
      "Pour les problèmes de paiement ou de livraison non résolus sous 24h, passez la priorité à 'Urgente'.",
    ],
  },
];
