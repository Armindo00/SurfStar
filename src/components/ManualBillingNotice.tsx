import { useI18n } from '../i18n'

type Props = {
  /** Shown on the post-registration waiting screen */
  variant?: 'waiting' | 'submitted'
  email?: string
}

export function ManualBillingNotice({ variant = 'waiting', email }: Props) {
  const { messages } = useI18n()
  const m = messages.components.manualBillingNotice
  const emailSuffix = email ? ` (${email})` : ''

  return (
    <aside className="checkout-notice" role="note" aria-label={m.ariaLabel}>
      <p className="checkout-notice__title">{m.title}</p>
      <p className="checkout-notice__lead">
        {variant === 'submitted' ? m.leadSubmitted : m.leadWaiting}
      </p>
      <ol className="checkout-notice__steps">
        {m.steps.map((step) => (
          <li key={step}>{step.replace('{{emailSuffix}}', emailSuffix)}</li>
        ))}
      </ol>
      <p className="checkout-notice__footer muted">{m.footer}</p>
    </aside>
  )
}
