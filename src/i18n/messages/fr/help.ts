export const help = {
  page: {
    quickStart: 'Démarrage rapide',
    trainingModes: 'Modes d\'entraînement',
    trainingModesSub: 'Comment fonctionne chaque type de session et comment la mener sur la plage.',
    athleteGuide: 'Guide athlète',
    addToHomeScreen: 'Ajouter à l\'écran d\'accueil',
    installOnPhone: 'Installer sur le téléphone',
    contactTitle: 'Contacter SurfStar',
    contactLead:
      'Envoyez des retours, signalez un bug ou demandez de l\'aide. Nous lisons chaque message et répondons généralement sous 1–2 jours ouvrés.',
    sendMessage: 'Envoyer un message',
  },
  coachQuickTips: [
    'Configurez d\'abord les spots et conditions mer sous Spots et conditions — ils apparaissent dans chaque nouvelle session.',
    'Liez les athlètes via le code d\'appairage sous Gérer les athlètes avant la première session sur la plage.',
    'Utilisez Terminer la session depuis le menu pour tout enregistrer dans Sessions passées et Analytique équipe.',
  ],
  trainingGuides: {
    tecnico: {
      planLabel: 'Tous les forfaits',
      summary: 'Enregistrement vague par vague pour rail, top turn et progressive — avec niveau, côté et réussite.',
      steps: [
        'Appuyez sur Nouvelle session → choisissez Entraînement technique, spot et conditions mer.',
        'Sélectionnez les athlètes qui s\'entraînent, puis appuyez sur Démarrer la session.',
        'Appuyez sur une tuile athlète pour ouvrir la feuille de saisie de la vague en cours.',
        'Enregistrez chaque manœuvre (R / T / P), choisissez le niveau (1–3 ou ★), frontside ou backside, et réussite ou échec.',
        'Ouvrez Stats en direct à tout moment pour voir le taux de réussite et les détails mis à jour en temps réel.',
      ],
    },
    combos: {
      planLabel: 'Tous les forfaits',
      summary: 'Suivez les séquences de manœuvres liées (combos) avec niveaux et taux de réussite.',
      steps: [
        'Appuyez sur Nouvelle session → choisissez Combos, puis spot et conditions.',
        'Sélectionnez les athlètes et démarrez la session.',
        'Pour chaque vague, appuyez sur l\'athlète et enregistrez le niveau de combo atteint (Combo 1–3 ou ★).',
        'Marquez réussite ou échec pour cette tentative de combo.',
        'Consultez les stats combo dans Stats en direct ou Analytique équipe après la session.',
      ],
    },
    heats: {
      planLabel: 'Forfait Coach et supérieurs',
      summary: 'Lancez un heat chronométré — scorez chaque athlète vague par vague comme en compétition.',
      steps: [
        'Appuyez sur Nouvelle session → choisissez Heats et définissez la durée (ex. 15 ou 20 minutes).',
        'Sélectionnez jusqu\'à quatre athlètes pour le heat, puis démarrez.',
        'Enregistrez chaque vague avec scores et interférences au fil de l\'eau.',
        'À la fin du heat, consultez classements et totaux sur l\'écran heat.',
        'Les heats terminés apparaissent dans l\'historique de sessions et Analytique équipe.',
      ],
    },
    campeonato: {
      planLabel: 'Forfait Coach et supérieurs',
      summary: 'Compétition éliminatoire complète — ajoutez tous les surfeurs, choisissez la taille de heat (2 ou 4), et SurfStar construit chaque tour jusqu\'à la finale.',
      steps: [
        'Appuyez sur Nouvelle session → Championnat, définissez durée du heat et surfeurs par heat (2 = le 1er avance, 4 = les 2 premiers avancent).',
        'Sélectionnez tous les athlètes du concours et appuyez sur Démarrer le championnat.',
        'SurfStar divise le tour d\'ouverture en heats de 3 ou 4 (ex. quarts avec 8 surfeurs = 2 heats de 4).',
        'Quand un tour a plusieurs heats, appuyez sur Démarrer tous les heats — ils partagent une horloge et vous scorez côte à côte.',
        'Continuez par demi-finales et finale jusqu\'à couronner un champion.',
      ],
    },
    'sea-analysis': {
      planLabel: 'Coach Premium',
      summary: 'Observation océanique chronométrée de 30 minutes sur deux pics — enregistrez les types de vagues et obtenez une recommandation de pic.',
      steps: [
        'Appuyez sur Nouvelle session → choisissez Analyse mer, spot et conditions (aucun athlète requis).',
        'Démarrez la session et appuyez sur Démarrer le minuteur quand vous commencez à observer.',
        'Enregistrez les types de vagues sur Pic 1 et Pic 2 à mesure que les sets arrivent (sets, intermédiaires, petites vagues).',
        'SurfStar score chaque pic et montre lequel fonctionne le mieux.',
        'Terminez la session pour enregistrer la chronologie et la recommandation dans l\'historique.',
      ],
    },
    custom: {
      planLabel: 'Coach Premium',
      summary: 'Votre format d\'entraînement — boutons de skill personnalisés, niveaux, réussite/échec, minuteur et règles écrites.',
      steps: [
        'Allez dans Modèles d\'entraînement personnalisé et créez un modèle (boutons, niveaux, minuteur, règles).',
        'Appuyez sur Nouvelle session → choisissez Entraînement personnalisé et sélectionnez votre modèle.',
        'Sélectionnez les athlètes et démarrez — la saisie affiche vos boutons personnalisés au lieu des manœuvres intégrées.',
        'Appuyez sur un bouton de skill, choisissez niveau et résultat, et enregistrez directement ou par vague selon votre modèle.',
        'Si un minuteur est activé, démarrez-le depuis la feuille de saisie au début de l\'exercice.',
      ],
    },
  },
  install: {
    title: 'Ajouter SurfStar à l\'écran d\'accueil',
    lead: 'Installez SurfStar comme une app pour un accès en un tap sur la plage. Fonctionne sur iPhone et Android — sans téléchargement App Store.',
    iphone: {
      title: 'iPhone (Safari)',
      steps: [
        'Ouvrez {{siteHost}} dans Safari (Chrome sur iPhone ne gère pas l\'installation de la même façon).',
        'Appuyez sur Partager en bas de l\'écran (□ avec flèche vers le haut).',
        'Faites défiler le menu de partage et appuyez sur Ajouter à l\'écran d\'accueil.',
        'Modifiez le nom si vous voulez, puis appuyez sur Ajouter — l\'icône SurfStar apparaît sur votre écran d\'accueil.',
        'Ouvrez SurfStar depuis cette icône pour une expérience plein écran, comme une app.',
      ],
    },
    android: {
      title: 'Android (Chrome)',
      steps: [
        'Ouvrez {{siteHost}} dans Google Chrome.',
        'Appuyez sur le menu (⋮) en haut à droite.',
        'Appuyez sur Installer l\'app ou Ajouter à l\'écran d\'accueil (libellé variable selon le téléphone).',
        'Confirmez — SurfStar est ajouté à l\'écran d\'accueil et au tiroir d\'apps.',
        'Sur Samsung Internet : menu ≡ → Ajouter la page à → Écran d\'accueil.',
      ],
    },
    note: 'Si vous avez déjà installé SurfStar, vous pouvez ignorer cette section.',
  },
} as const
