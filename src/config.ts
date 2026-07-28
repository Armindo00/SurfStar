export function isCloudEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function isDemoSubscriptionEnabled(): boolean {
  const value = import.meta.env.VITE_DEMO_SUBSCRIPTION
  return value === 'true' || value === true
}

function isStripeConfiguredInEnv(): boolean {
  const keys = [
    'VITE_STRIPE_LINK_TEAM',
    'VITE_STRIPE_LINK_CLUB',
    'VITE_STRIPE_LINK_TEAM_ANNUAL',
    'VITE_STRIPE_LINK_CLUB_ANNUAL',
  ] as const
  return keys.some((key) => {
    const value = import.meta.env[key]
    return typeof value === 'string' && value.trim().length > 0
  })
}

/** All coach plans go through admin approval + manual payment (no Stripe checkout). */
export function isManualPaymentsEnabled(): boolean {
  const value = import.meta.env.VITE_MANUAL_PAYMENTS
  if (value === 'false' || value === false) return false
  if (value === 'true' || value === true) return true
  // Launch default: cloud without Stripe → manual billing until Stripe is configured
  return isCloudEnabled() && !isStripeConfiguredInEnv()
}

/** Public site URL (landing, PWA install help, legal links). */
export function getAppSiteUrl(): string {
  const value = import.meta.env.VITE_APP_URL
  if (typeof value === 'string' && value.trim()) {
    return value.trim().replace(/\/$/, '')
  }
  return 'https://www.surfstar.app'
}

/** Public contact inbox for support, billing, and legal notices. */
export function getContactEmail(): string {
  const primary = import.meta.env.VITE_CONTACT_EMAIL
  if (typeof primary === 'string' && primary.trim()) return primary.trim()
  const legacy = import.meta.env.VITE_TEAM_ACADEMY_CONTACT_EMAIL
  if (typeof legacy === 'string' && legacy.trim()) return legacy.trim()
  return 'contact@surfstar.app'
}
