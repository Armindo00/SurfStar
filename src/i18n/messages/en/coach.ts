export const coach = {
  hello: 'Hello,',
  defaultName: 'Coach',
  dashboardFallback: 'SurfStar coach dashboard',
  planLine: '{{planName}} plan · {{price}} · {{athleteLimit}}',
  newSession: 'New session',
  welcomeHint:
    'Welcome to SurfStar. Add athletes from Manage athletes, then start your first session at the beach — stats update live as you log waves.',
  onboarding: {
    ariaLabel: 'Getting started',
    eyebrow: 'Getting started',
    title: 'Set up your coaching workspace',
    progress: '{{completed}} of {{total}} complete',
    dismiss: 'Dismiss',
    steps: [
      {
        label: 'Add your first athlete',
        hint: 'Share a pairing code so they can link to your account.',
        cta: 'Manage athletes',
      },
      {
        label: 'Log your first session',
        hint: 'Start a training at the beach and save it when you finish.',
        cta: 'New session',
      },
      {
        label: 'Review team analytics',
        hint: 'See 6-month evolution charts and session breakdowns per athlete.',
        cta: 'Open analytics',
      },
    ] as const,
  },
  subscription: {
    title: 'Account & subscription',
    currentPlan: 'Current plan',
    activeAthletes: 'active athletes',
    changePassword: 'Change password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
    updatePassword: 'Update password',
    passwordUpdated: 'Password updated.',
    passwordsMismatch: 'Passwords do not match.',
  },
} as const
