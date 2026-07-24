// Supabase Edge Function — Stripe webhook for SurfStar subscriptions
// Deploy: supabase functions deploy stripe-webhook --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Optional: STRIPE_PAYMENT_LINK_ID_STARTER, STRIPE_PAYMENT_LINK_ID_TEAM, STRIPE_PAYMENT_LINK_ID_CLUB

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!stripeSecret || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing required environment variables for stripe-webhook')
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
const supabase = createClient(supabaseUrl, serviceRoleKey)

function planFromPaymentLinkId(paymentLinkId: string | null | undefined): string | null {
  if (!paymentLinkId) return null
  const map: Record<string, string> = {}
  const starter = Deno.env.get('STRIPE_PAYMENT_LINK_ID_STARTER')
  const team = Deno.env.get('STRIPE_PAYMENT_LINK_ID_TEAM')
  const club = Deno.env.get('STRIPE_PAYMENT_LINK_ID_CLUB')
  if (starter) map[starter] = 'starter'
  if (team) map[team] = 'team'
  if (club) map[club] = 'club'
  return map[paymentLinkId] ?? null
}

function planFromMetadata(metadata: Stripe.Metadata | null | undefined): string | null {
  const plan = metadata?.plan_id ?? metadata?.planId
  if (plan === 'starter' || plan === 'team' || plan === 'club') return plan
  return null
}

async function upsertSubscription(params: {
  coachId: string
  planId: string
  status: string
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
  currentPeriodEnd?: number | null
}) {
  const periodEnd = params.currentPeriodEnd
    ? new Date(params.currentPeriodEnd * 1000).toISOString()
    : null

  const { error } = await supabase.from('coach_subscriptions').upsert(
    {
      coach_id: params.coachId,
      plan_id: params.planId,
      status: params.status,
      stripe_customer_id: params.stripeCustomerId ?? null,
      stripe_subscription_id: params.stripeSubscriptionId ?? null,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'coach_id' },
  )

  if (error) throw error
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const coachId = session.client_reference_id
  if (!coachId) {
    console.error('checkout.session.completed without client_reference_id')
    return
  }

  let planId =
    planFromMetadata(session.metadata) ??
    planFromPaymentLinkId(typeof session.payment_link === 'string' ? session.payment_link : session.payment_link?.id)

  if (!planId && session.subscription) {
    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
    const sub = await stripe.subscriptions.retrieve(subId)
    planId = planFromMetadata(sub.metadata)
  }

  if (!planId) {
    console.error('Could not resolve plan_id for session', session.id)
    return
  }

  let stripeSubscriptionId: string | null = null
  let currentPeriodEnd: number | null = null
  let status = 'active'

  if (session.subscription) {
    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id
    const sub = await stripe.subscriptions.retrieve(subId)
    stripeSubscriptionId = sub.id
    currentPeriodEnd = sub.current_period_end
    status = sub.status === 'trialing' ? 'trialing' : sub.status === 'active' ? 'active' : sub.status
  }

  await upsertSubscription({
    coachId,
    planId,
    status,
    stripeCustomerId: typeof session.customer === 'string' ? session.customer : session.customer?.id,
    stripeSubscriptionId,
    currentPeriodEnd,
  })
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const coachId = sub.metadata?.coach_id ?? sub.metadata?.coachId
  const planId = planFromMetadata(sub.metadata)
  if (!coachId || !planId) {
    console.error('subscription update missing coach_id or plan_id metadata', sub.id)
    return
  }

  const status =
    sub.status === 'active' || sub.status === 'trialing'
      ? sub.status
      : sub.status === 'canceled' || sub.status === 'unpaid'
        ? 'canceled'
        : 'pending'

  await upsertSubscription({
    coachId,
    planId,
    status,
    stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
    stripeSubscriptionId: sub.id,
    currentPeriodEnd: sub.current_period_end,
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing stripe-signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed', err)
    return new Response('Invalid signature', { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      default:
        break
    }
  } catch (err) {
    console.error('Webhook handler error', err)
    return new Response('Webhook handler failed', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
