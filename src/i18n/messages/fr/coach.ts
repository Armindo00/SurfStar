export const coach = {
  hello: 'Bonjour,',
  defaultName: 'Entraîneur',
  dashboardFallback: 'Tableau de bord entraîneur SurfStar',
  planLine: 'Forfait {{planName}} · {{price}} · {{athleteLimit}}',
  newSession: 'Nouvelle session',
  welcomeHint:
    'Bienvenue sur SurfStar. Ajoutez des athlètes depuis Gérer les athlètes, puis démarrez votre première session sur la plage — les stats se mettent à jour en direct au fil des vagues enregistrées.',
  onboarding: {
    ariaLabel: 'Premiers pas',
    eyebrow: 'Premiers pas',
    title: 'Configurez votre espace d\'entraînement',
    progress: '{{completed}} sur {{total}} terminés',
    dismiss: 'Ignorer',
    steps: [
      {
        label: 'Ajoutez votre premier athlète',
        hint: 'Partagez un code d\'appairage pour qu\'il se lie à votre compte.',
        cta: 'Gérer les athlètes',
      },
      {
        label: 'Enregistrez votre première session',
        hint: 'Démarrez un entraînement sur la plage et enregistrez-le à la fin.',
        cta: 'Nouvelle session',
      },
      {
        label: 'Consultez l\'analytique équipe',
        hint: 'Voir les graphiques d\'évolution sur 6 mois et le détail par athlète.',
        cta: 'Ouvrir l\'analytique',
      },
    ] as const,
  },
  subscription: {
    title: 'Compte et abonnement',
    currentPlan: 'Forfait actuel',
    activeAthletes: 'athlètes actifs',
    changePassword: 'Changer le mot de passe',
    newPassword: 'Nouveau mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    updatePassword: 'Mettre à jour',
    passwordUpdated: 'Mot de passe mis à jour.',
    passwordsMismatch: 'Les mots de passe ne correspondent pas.',
  },
} as const
