import type { ComboLevel, ManeuverKind, ManeuverLevel, TrainingMode } from '../types'
import type { analytics as EnAnalytics } from './messages/en/analytics'
import type { plans as EnPlans } from './messages/en/plans'
import type { session as EnSession } from './messages/en/session'
import type { ui as EnUi } from './messages/en/ui'

/** Converts literal EN message shapes to locale-agnostic string maps. */
export type Localized<T> = T extends string
  ? string
  : T extends readonly (infer U)[]
    ? readonly Localized<U>[]
    : T extends object
      ? { [K in keyof T]: Localized<T[K]> }
      : T

export type AnalyticsReportCopy = Localized<typeof EnAnalytics.analyticsReport>
export type AnalyticsTopicSheetCopy = Localized<typeof EnAnalytics.topicSheet>
export type PlanFeaturePreviewCopy = Localized<typeof EnPlans.featurePreview>
export type SessionRegisterCopy = Localized<typeof EnSession.register>
export type SavedWavesCopy = Localized<typeof EnUi.savedWaves>

export type SupportedLocale = 'en' | 'pt' | 'fr' | 'es'

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'pt', 'fr', 'es']

export type LandingWhatsNewItem = {
  tag: string
  title: string
  text: string
  audience: string
}

export type LandingPillar = {
  icon: string
  title: string
  text: string
}

export type LandingPremiumSpotlightCustom = {
  id: 'custom'
  eyebrow: string
  title: string
  lead: string
  bullets: readonly string[]
  preview: {
    pill: string
    spot: string
    chips: readonly string[]
    kpis: readonly { value: string; label: string }[]
    foot: string
  }
}

export type LandingPremiumSpotlightSea = {
  id: 'sea'
  eyebrow: string
  title: string
  lead: string
  bullets: readonly string[]
  preview: {
    pill: string
    spot: string
    recommend: { peak: string; note: string }
    peaks: readonly { name: string; score: string; obs: string }[]
    chips: readonly string[]
  }
}

export type LandingValueGroup = {
  id: string
  icon: string
  label: string
  headline: string
  lead: string
  benefits: readonly string[]
}

export type LandingStep = {
  step: string
  title: string
  text: string
}

export type LandingFaqItem = {
  q: string
  a: string
}

export type AuthScreenCopy = {
  roleLabel: string
  modeLabel: string
  title: string
  submit: string
  switchPrompt: string
  switchActionLabel: string
  otherRolePrompt: string
  otherRoleActionLabel: string
}

export type TrainingHelpGuideMessages = {
  planLabel: string
  summary: string
  steps: readonly string[]
}

export type LegalSection = {
  heading: string
  body: string
}

export type MessageCatalog = {
  locale: SupportedLocale
  common: {
    loading: string
    menu: string
    close: string
    help: string
    signOut: string
    admin: string
    back: string
    cancel: string
    save: string
    delete: string
    confirm: string
    dismiss: string
    continue: string
    home: string
    pleaseWait: string
    submitting: string
    sending: string
    checking: string
    saving: string
    gotIt: string
    notNow: string
    select: string
    optional: string
  }
  roles: {
    coach: string
    athlete: string
  }
  language: {
    title: string
    hint: string
    en: string
    pt: string
    fr: string
    es: string
  }
  trainingModes: Record<TrainingMode, string>
  maneuvers: Record<ManeuverKind, string>
  comboLevels: Record<ComboLevel, string>
  levels: Record<ManeuverLevel, string>
  subscription: {
    title: string
    currentPlan: string
    activeAthletes: string
    changePassword: string
    newPassword: string
    confirmPassword: string
    updatePassword: string
    passwordUpdated: string
    passwordsMismatch: string
  }
  athletePortal: {
    languageTitle: string
    signOut: string
  }
  landing: {
    nav: {
      whatsNew: string
      features: string
      pricing: string
      faq: string
      coachSignIn: string
      athleteSignIn: string
      createCoachAccount: string
      createAthleteAccount: string
      contactUs: string
      mobileNavLabel: string
      sectionsLabel: string
    }
    hero: {
      eyebrow: string
      titlePrefix: string
      titleAccent: string
      leadDesktop: string
      leadMobile: string
      checks: readonly string[]
      showcase: {
        pill: string
        spot: string
        success: string
        waves: string
        athletes: string
        rail: string
        topTurn: string
        progressive: string
      }
    }
    whatsNew: {
      sectionEyebrow: string
      sectionTitle: string
      sectionSub: string
      items: readonly LandingWhatsNewItem[]
    }
    pillars: {
      ariaLabel: string
      items: readonly LandingPillar[]
    }
    premiumSpotlights: {
      sectionEyebrow: string
      sectionTitle: string
      sectionSub: string
      tabsLabel: string
      recommendedPeak: string
      items: readonly (LandingPremiumSpotlightCustom | LandingPremiumSpotlightSea)[]
    }
    valueGroups: {
      sectionEyebrow: string
      sectionTitle: string
      sectionSub: string
      items: readonly LandingValueGroup[]
    }
    steps: {
      sectionEyebrow: string
      sectionTitle: string
      items: readonly LandingStep[]
    }
    pricing: {
      sectionEyebrow: string
      sectionTitle: string
      sectionSub: string
    }
    faq: {
      sectionEyebrow: string
      sectionTitle: string
      items: readonly LandingFaqItem[]
    }
    cta: {
      eyebrow: string
      title: string
      createCoachAccount: string
      contactUs: string
    }
    footer: {
      tagline: string
      explore: string
      account: string
      support: string
      contactSurfStar: string
      copyright: string
    }
  }
  nav: Record<string, string>
  auth: {
    loading: string
    home: string
    signIn: string
    coachSignIn: string
    athleteSignIn: string
    createCoachAccount: string
    createAthleteAccount: string
    email: string
    emailAddress: string
    password: string
    name: string
    fullName: string
    confirmPassword: string
    selectedPlan: string
    billingDetails: string
    billingDetailsLead: string
    forgotPassword: string
    pleaseWait: string
    createAccountWithPlan: string
    namePlaceholderCoach: string
    namePlaceholderAthlete: string
    emailPlaceholder: string
    passwordPlaceholderNew: string
    passwordPlaceholderSignIn: string
    confirmPasswordPlaceholder: string
    acceptTermsError: string
    passwordsMismatch: string
    screens: Record<
      'coach-sign-in' | 'coach-sign-up' | 'athlete-sign-in' | 'athlete-sign-up',
      AuthScreenCopy
    >
    forgotPasswordFlow: Record<string, string>
    resetPassword: Record<string, string>
  }
  coach: {
    hello: string
    defaultName: string
    dashboardFallback: string
    planLine: string
    newSession: string
    welcomeHint: string
    onboarding: {
      ariaLabel: string
      eyebrow: string
      title: string
      progress: string
      dismiss: string
      steps: readonly { label: string; hint: string; cta: string }[]
    }
    subscription: MessageCatalog['subscription']
  }
  athlete: {
    signInRequired: string
    hello: string
    dashboardSubtitle: string
    generalStatistics: string
    generalStatisticsSub: string
    totalWaves: string
    totalTrainings: string
    heatWins: string
    heats: string
    championshipWins: string
    titleWon: string
    titlesWon: string
    avgHeatScore: string
    wavesWithPotential: string
    noWavesLogged: string
    avgLevelCombined: string
    starsLanded: string
    starsBreakdown: string
    languageTitle: string
    signOut: string
    helpAndInstall: string
    contactSurfStar: string
    noSessionsHint: string
    shareMoreHint: string
    dashboardNavLabel: string
    menu: {
      title: string
      openLabel: string
      openDescription: string
      dataSection: string
      settingsSection: string
      navLabel: string
      appSettings: {
        label: string
        description: string
        title: string
      }
    }
    actions: Record<
      string,
      { label: string; descriptionDefault?: string; description?: string; descriptionCount?: string; descriptionCountPlural?: string; descriptionNew?: string; descriptionNewPlural?: string; descriptionSharing?: string; descriptionSharingPlural?: string; descriptionWaiting?: string; descriptionWaitingPlural?: string }
    >
    sheets: Record<string, string>
    help: Record<string, { title: string; body: string }>
  }
  session: Localized<typeof EnSession>
  plans: Localized<typeof EnPlans>
  billing: {
    address: Record<string, string>
    taxId: Record<string, string>
    validation: Record<string, string>
  }
  components: {
    cookieConsent: Record<string, string>
    legalFooter: Record<string, string>
    authShell: Record<string, string>
    termsAcceptance: Record<string, string>
    manualBillingNotice: {
      ariaLabel: string
      title: string
      leadWaiting: string
      leadSubmitted: string
      steps: readonly string[]
      footer: string
    }
    sessionFeedback: Record<string, string>
    installInstructions: Record<string, string>
    endSessionSheet: Record<string, string>
    leaveSessionConfirm: Record<string, string>
    closeWaveConfirm: Record<string, string>
    noPotentialWaveConfirm: Record<string, string>
    confirmDelete: Record<string, string>
    installAppBanner: {
      ariaLabel: string
      eyebrow: string
      title: string
      iosSteps: readonly string[]
      androidPrompt: string
      androidManual: string
      install: string
      gotIt: string
      notNow: string
    }
    deleteAccount: Record<string, string>
  }
  analytics: Localized<typeof EnAnalytics>
  legal: {
    backToHome: string
    lastUpdated: string
    privacy: {
      title: string
      updated: string
      sections: Record<string, LegalSection | Record<string, string>>
    }
    terms: {
      title: string
      updated: string
      sections: Record<string, LegalSection | Record<string, string>>
    }
  }
  help: {
    page: {
      quickStart: string
      trainingModes: string
      trainingModesSub: string
      athleteGuide: string
      addToHomeScreen: string
      installOnPhone: string
      contactTitle: string
      contactLead: string
      sendMessage: string
    }
    coachQuickTips: readonly string[]
    trainingGuides: Record<TrainingMode, TrainingHelpGuideMessages>
    install: {
      title: string
      lead: string
      iphone: { title: string; steps: readonly string[] }
      android: { title: string; steps: readonly string[] }
      note: string
    }
  }
  admin: {
    title: string
    surfStarAdmin: string
    tabsLabel: string
    tabs: Record<'dashboard' | 'requests' | 'subscriptions' | 'accounts' | 'contact', string>
  }
  ui: Localized<typeof EnUi>
  errors: Record<string, string>
}
