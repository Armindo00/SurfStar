import { useEffect, useState } from 'react'
import { formatPlanPrice, getPlan, getStripePaymentLink, SUBSCRIPTION_PLANS, type PlanId } from '../plans'
import { AppLogo } from '../components/AppLogo'
import { useApp } from '../AppContext'
import {
  buildStripeCheckoutUrl,
  isDemoSubscriptionEnabled,
  isSubscriptionActive,
} from '../subscriptionApi'

export function CheckoutView() {
  const {
    auth,
    selectedPlanId,
    selectPlan,
    startCheckout,
    activateDemoSubscription,
    refreshSubscription,
    subscription,
    openLanding,
    logout,
    cloudMode,
  } = useApp()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [awaitingPayment, setAwaitingPayment] = useState(false)

  const planId = selectedPlanId ?? subscription?.planId ?? 'team'
  const plan = getPlan(planId)
  const stripeLink = getStripePaymentLink(planId)
  const demoEnabled = isDemoSubscriptionEnabled()
  const isPending = subscription?.status === 'pending'
  const isActive = isSubscriptionActive(subscription)

  useEffect(() => {
    if (!awaitingPayment && !isPending) return
    if (isActive) return

    const timer = window.setInterval(() => {
      void refreshSubscription()
    }, 4000)

    return () => window.clearInterval(timer)
  }, [awaitingPayment, isPending, isActive, refreshSubscription])

  const handlePay = async () => {
    setError('')
    setBusy(true)
    try {
      if (!stripeLink) {
        if (demoEnabled) {
          const result = await activateDemoSubscription()
          if (!result.ok) setError(result.error)
          return
        }
        setError('Pagamento Stripe não configurado. Contacta o suporte.')
        return
      }

      const checkoutResult = await startCheckout()
      if (!checkoutResult.ok) {
        setError(checkoutResult.error)
        return
      }

      const url = buildStripeCheckoutUrl(
        stripeLink,
        auth?.role === 'treinador' ? auth.coachId : '',
        auth?.email ?? '',
        planId,
      )
      window.open(url, '_blank', 'noopener,noreferrer')
      setAwaitingPayment(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar o checkout.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="checkout-page">
      <div className="checkout-card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Voltar
        </button>

        <div className="checkout-brand">
          <AppLogo size="lg" />
          <div>
            <h1>Ativar subscrição</h1>
            <p className="muted">Olá {auth?.name ?? 'treinador'} — confirma o teu pack para entrar.</p>
          </div>
        </div>

        <div className="checkout-summary">
          <div>
            <span className="checkout-summary__label">Pack escolhido</span>
            <strong>{plan.name}</strong>
            <p className="muted">{plan.tagline}</p>
          </div>
          <div className="checkout-summary__price">
            <strong>{formatPlanPrice(plan)}</strong>
            <span>/ mês</span>
          </div>
        </div>

        <label className="field field--login">
          <span>Alterar pack</span>
          <select
            value={planId}
            onChange={(e) => selectPlan(e.target.value as PlanId, { goToLogin: false })}
          >
            {SUBSCRIPTION_PLANS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} — {formatPlanPrice(item)}/mês
              </option>
            ))}
          </select>
        </label>

        <ul className="checkout-features">
          {plan.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>

        {error ? <p className="login-error">{error}</p> : null}

        {isPending || awaitingPayment ? (
          <div className="checkout-pending">
            <p className="checkout-pending__title">A aguardar confirmação de pagamento…</p>
            <p className="muted">
              Completa o pagamento na janela Stripe. A conta activa-se automaticamente em segundos.
            </p>
            <button type="button" className="btn btn--secondary btn--block" onClick={() => void refreshSubscription()} disabled={busy}>
              Verificar agora
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn--gold btn--block btn--lg" onClick={() => void handlePay()} disabled={busy}>
            {busy ? 'A processar…' : stripeLink ? 'Pagar com Stripe' : demoEnabled ? `Activar ${plan.name} (demo)` : 'Pagamento indisponível'}
          </button>
        )}

        {demoEnabled && cloudMode && stripeLink ? (
          <button
            type="button"
            className="btn btn--ghost btn--block"
            disabled={busy}
            onClick={() => void activateDemoSubscription().then((r) => !r.ok && setError(r.error))}
          >
            Activar em modo demo (dev)
          </button>
        ) : null}

        <p className="checkout-note muted">
          {cloudMode
            ? 'Pagamento seguro via Stripe. Cancela quando quiseres no portal de billing.'
            : 'Modo local: a subscrição fica guardada neste dispositivo.'}
        </p>

        <button type="button" className="btn btn--ghost btn--block" onClick={logout}>
          Terminar sessão
        </button>
      </div>
    </div>
  )
}
