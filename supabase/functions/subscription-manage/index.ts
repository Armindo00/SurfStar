// Supabase Edge Function — coach subscription change / cancel / billing portal
// Deploy: supabase functions deploy subscription-manage
// Secrets: STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
// Optional price IDs for in-app plan switches:
// STRIPE_PRICE_TEAM, STRIPE_PRICE_CLUB, STRIPE_PRICE_TEAM_ANNUAL, STRIPE_PRICE_CLUB_ANNUAL

import Stripe from 'npm:stripe@17.7.0'
import { createClient } from 'npm:@supabase/supabase-js@2.49.1'

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')

if (!stripeSecret || !supabaseUrl || !serviceRoleKey || !supabaseAnonKey) {
  throw new Error('Missing required environment variables for subscription-manage')
}

const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' })
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type PlanId = 'team' | 'club' | 'organization'

type ManageAction = 'portal' | 'cancel' | 'change_plan'

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function priceIdForPlan(planId: PlanId): string | null {
  const map: Record<PlanId, string | undefined> = {
    team: Deno.env.get('STRIPE_PRICE_TEAM'),
    club: Deno.env.get('STRIPE_PRICE_CLUB'),
    organization: Deno.env.get('STRIPE_PRICE_ORGANIZATION'),
  }
  const value = map[planId]
  return value?.trim() ? value.trim() : null
}

async function getCoachSubscription(coachId: string) {
  const { data, error } = await supabaseAdmin
    .from('coach_subscriptions')
    .select('coach_id, plan_id, status, stripe_customer_id, stripe_subscription_id, current_period_end')
    .eq('coach_id', coachId)
    .maybeSingle()

  if (error) throw error
  return data
}

async function authenticateCoach(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return null

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userError } = await supabaseUser.auth.getUser()
  if (userError || !userData.user) return null

  const coachId = userData.user.id
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', coachId)
    .maybeSingle()

  if (profile?.role !== 'treinador') return null
  return coachId
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  try {
    const coachId = await authenticateCoach(req)
    if (!coachId) {
      return json({ ok: false, error: 'Not authenticated as coach.' }, 401)
    }

    const body = (await req.json()) as {
      action?: ManageAction
      plan_id?: PlanId
      return_url?: string
    }

    const action = body.action
    if (!action) {
      return json({ ok: false, error: 'Missing action.' }, 400)
    }

    const row = await getCoachSubscription(coachId)
    if (!row) {
      return json({ ok: false, error: 'No subscription found.' }, 404)
    }

    const returnUrl =
      typeof body.return_url === 'string' && body.return_url.startsWith('http')
        ? body.return_url
        : 'https://www.surfstar.app'

    if (action === 'portal') {
      if (!row.stripe_customer_id) {
        return json({ ok: false, error: 'Complete your first payment before managing billing.' }, 400)
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: row.stripe_customer_id,
        return_url: returnUrl,
      })

      return json({ ok: true, url: session.url })
    }

    if (action === 'cancel') {
      if (!row.stripe_subscription_id) {
        const { error } = await supabaseAdmin
          .from('coach_subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('coach_id', coachId)

        if (error) throw error
        return json({ ok: true, canceled_immediately: true })
      }

      const updated = await stripe.subscriptions.update(row.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      const periodEnd = updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : row.current_period_end

      const { error } = await supabaseAdmin
        .from('coach_subscriptions')
        .update({
          status: updated.status === 'canceled' ? 'canceled' : row.status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('coach_id', coachId)

      if (error) throw error

      return json({
        ok: true,
        cancel_at_period_end: true,
        current_period_end: periodEnd,
      })
    }

    if (action === 'change_plan') {
      const planId = body.plan_id
      if (planId !== 'team' && planId !== 'club' && planId !== 'organization') {
        return json({ ok: false, error: 'Invalid plan.' }, 400)
      }

      if (planId === row.plan_id && row.status === 'active') {
        return json({ ok: true, plan_id: planId, unchanged: true })
      }

      if (!row.stripe_subscription_id) {
        const { error } = await supabaseAdmin
          .from('coach_subscriptions')
          .update({
            plan_id: planId,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('coach_id', coachId)

        if (error) throw error
        return json({ ok: true, plan_id: planId, requires_checkout: true })
      }

      const priceId = priceIdForPlan(planId)
      if (!priceId) {
        if (!row.stripe_customer_id) {
          return json({ ok: false, error: 'Billing is not configured for plan changes.' }, 400)
        }

        const session = await stripe.billingPortal.sessions.create({
          customer: row.stripe_customer_id,
          return_url: returnUrl,
        })

        return json({
          ok: true,
          url: session.url,
          use_portal: true,
          message: 'Use the Stripe portal to change your plan.',
        })
      }

      const stripeSub = await stripe.subscriptions.retrieve(row.stripe_subscription_id)
      const itemId = stripeSub.items.data[0]?.id
      if (!itemId) {
        return json({ ok: false, error: 'Stripe subscription has no items.' }, 400)
      }

      const updated = await stripe.subscriptions.update(row.stripe_subscription_id, {
        items: [{ id: itemId, price: priceId }],
        metadata: {
          ...stripeSub.metadata,
          plan_id: planId,
          coach_id: coachId,
        },
        proration_behavior: 'create_prorations',
      })

      const periodEnd = updated.current_period_end
        ? new Date(updated.current_period_end * 1000).toISOString()
        : row.current_period_end

      const status =
        updated.status === 'active' || updated.status === 'trialing' ? updated.status : 'pending'

      const { error } = await supabaseAdmin
        .from('coach_subscriptions')
        .update({
          plan_id: planId,
          status,
          current_period_end: periodEnd,
          updated_at: new Date().toISOString(),
        })
        .eq('coach_id', coachId)

      if (error) throw error

      return json({
        ok: true,
        plan_id: planId,
        status,
        current_period_end: periodEnd,
      })
    }

    return json({ ok: false, error: 'Unknown action.' }, 400)
  } catch (err) {
    console.error('subscription-manage error', err)
    return json(
      { ok: false, error: err instanceof Error ? err.message : 'Subscription management failed.' },
      500,
    )
  }
})
