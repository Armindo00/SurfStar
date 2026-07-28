export function isCloudEnabled(): boolean {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export function isDemoSubscriptionEnabled(): boolean {
  const value = import.meta.env.VITE_DEMO_SUBSCRIPTION
  return value === 'true' || value === true
}

/** All coach plans go through admin approval + manual payment (no Stripe checkout). */
export function isManualPaymentsEnabled(): boolean {
  const value = import.meta.env.VITE_MANUAL_PAYMENTS
  return value === 'true' || value === true
}
