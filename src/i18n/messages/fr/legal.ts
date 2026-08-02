export const legal = {
  backToHome: '← Retour à l\'accueil',
  lastUpdated: 'Dernière mise à jour : {{date}}',
  privacy: {
    title: 'Politique de confidentialité',
    updated: 'Août 2026',
    sections: {
      whoWeAre: {
        heading: 'Qui sommes-nous',
        body: '{{entityName}} (« nous ») fournit un logiciel de statistiques de surf pour entraîneurs et athlètes.{{taxIdLine}}{{addressLine}} Contact : {{contactEmail}}.',
        taxIdLine: ' Numéro fiscal : {{taxId}}.',
        addressLine: ' Adresse enregistrée : {{address}}.',
      },
      dataWeCollect: {
        heading: 'Données collectées',
        body: 'Données de compte (nom, e-mail, numéro fiscal si fourni), sessions d\'entraînement (vagues, manœuvres, scores, notes), relations d\'appairage athlète–entraîneur, statut d\'abonnement, adresse de facturation pour les entraîneurs et détails organisationnels optionnels pour Team Academy.',
      },
      howWeUseData: {
        heading: 'Utilisation des données',
        body: 'Pour fournir le service : stocker vos sessions, calculer les statistiques, activer l\'appairage entraîneur–athlète, traiter les abonnements, émettre des factures le cas échéant et répondre aux demandes de support.',
      },
      cookies: {
        heading: 'Cookies et stockage local',
        body: 'Nous utilisons des cookies essentiels et le stockage local du navigateur pour vous maintenir connecté, mémoriser la progression de session sur la plage et enregistrer votre choix de consentement aux cookies. Nous n\'utilisons pas de cookies publicitaires ou de suivi tiers. Une surveillance optionnelle des erreurs (Sentry) peut collecter des données de crash anonymisées si activée par nous.',
      },
      storageSecurity: {
        heading: 'Stockage et sécurité',
        body: 'Les données cloud sont stockées sur Supabase (régions compatibles UE selon votre projet). Nous utilisons une authentification standard et la sécurité au niveau des lignes pour que les entraîneurs n\'accèdent qu\'aux données de leur organisation.',
      },
      sharing: {
        heading: 'Partage',
        bodyManual: 'Nous ne vendons pas de données personnelles. Les athlètes contrôlent les stats partagées avec chaque entraîneur. Le paiement se fait par virement bancaire (IBAN / MB Way) sur notre compte — nous ne stockons pas les numéros de carte.',
        bodyStripe: 'Nous ne vendons pas de données personnelles. Les athlètes contrôlent les stats partagées avec chaque entraîneur. Les paiements par carte sont traités par Stripe lorsque la facturation en ligne est activée ; nous ne stockons pas les données complètes de carte.',
      },
      yourRights: {
        heading: 'Vos droits',
        body: 'Vous pouvez demander la suppression de votre compte depuis Compte et abonnement (entraîneurs) ou le portail athlète. Nous traitons les demandes sous 30 jours. Vous pouvez aussi nous contacter pour accès, rectification ou portabilité selon la loi applicable (y compris RGPD).',
      },
      retention: {
        heading: 'Conservation',
        body: 'Nous conservons les données tant que votre compte est actif. Après suppression de compte ou annulation d\'abonnement, nous supprimons ou anonymisons les données personnelles sauf obligation légale, fiscale ou de facturation.',
      },
      complaints: {
        heading: 'Réclamations',
        body: 'Pour les réclamations de service, contactez {{contactEmail}}. Au Portugal, vous pouvez aussi utiliser le livre de réclamations électronique : {{complaintsBookUrl}}',
      },
      contact: { heading: 'Contact', body: '{{entitySummary}}' },
    },
  },
  terms: {
    title: 'Conditions d\'utilisation',
    updated: 'Août 2026',
    sections: {
      service: {
        heading: 'Service',
        body: 'SurfStar est un logiciel par abonnement pour entraîneurs et athlètes de surf. Les fonctionnalités dépendent de votre forfait (Coach, Coach Premium, Team Academy). Les athlètes rejoignent gratuitement ; les entraîneurs s\'abonnent.',
      },
      accounts: {
        heading: 'Comptes',
        body: 'Vous devez fournir des informations exactes, y compris numéro fiscal et adresse de facturation lors de l\'inscription en tant qu\'entraîneur. Vous êtes responsable de la sécurité de votre mot de passe. N\'utilisez pas abusivement le service ni n\'accédez aux données d\'autres utilisateurs.',
      },
      subscriptions: {
        heading: 'Abonnements et facturation',
        bodyManual: 'Les forfaits payants se renouvellent mensuellement ou annuellement jusqu\'à annulation. Après inscription, vous soumettez une demande de paiement ; nous l\'examinons, envoyons les instructions de virement (IBAN / MB Way) et activons votre compte après confirmation du paiement. Les factures sont émises séparément pour conformité fiscale. Team Academy nécessite une approbation avant activation. Vous pouvez annuler en fin de période depuis les paramètres du compte ; l\'accès continue jusqu\'à la fin de la période payée.',
        bodyStripe: 'Les forfaits payants se renouvellent mensuellement ou annuellement jusqu\'à annulation via le portail de facturation. Team Academy nécessite une approbation avant activation. Les remboursements suivent la loi applicable et les politiques du prestataire de paiement.',
      },
      refunds: {
        heading: 'Remboursements',
        bodyManual: 'Si vous annulez dans les 14 jours suivant la première activation et n\'avez pas substantiellement utilisé le service, contactez-nous pour un examen de remboursement. Après cette période, les frais ne sont pas remboursables sauf obligation légale. Les mois partiels ne sont pas remboursés en cas d\'annulation en cours de cycle.',
        bodyStripe: 'Les demandes de remboursement sont traitées selon la loi applicable et les politiques de facturation Stripe. Contactez-nous si vous pensez qu\'un prélèvement a été effectué par erreur.',
      },
      acceptableUse: {
        heading: 'Usage acceptable',
        body: 'Pas de contenu illégal, de harcèlement ni de contournement des limites du forfait. Nous pouvons suspendre les comptes qui violent ces conditions.',
      },
      disclaimer: {
        heading: 'Avertissement',
        body: 'SurfStar est un outil d\'entraînement, pas un substitut au jugement de sécurité en mer. Les entraîneurs restent responsables de la sécurité des athlètes dans l\'océan.',
      },
      changes: {
        heading: 'Modifications',
        body: 'Nous pouvons mettre à jour ces conditions. L\'utilisation continue après modification vaut acceptation. Les changements importants seront communiqués par e-mail ou notification in-app lorsque possible.',
      },
      contactComplaints: {
        heading: 'Contact et réclamations',
        body: '{{entitySummary}}. Livre de réclamations électronique (Portugal) : {{complaintsBookUrl}}',
      },
    },
  },
} as const
