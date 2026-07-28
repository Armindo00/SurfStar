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
