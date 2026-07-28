type Props = {
  /** Shown on the post-registration waiting screen */
  variant?: 'waiting' | 'submitted'
  email?: string
}

export function ManualBillingNotice({ variant = 'waiting', email }: Props) {
  return (
    <aside className="checkout-notice" role="note" aria-label="Manual billing instructions">
      <p className="checkout-notice__title">Important — please read</p>
      <p className="checkout-notice__lead">
        {variant === 'submitted'
          ? 'Your request was received. Your account will stay locked until an administrator completes the steps below.'
          : 'Your coach account is created, but you cannot use SurfStar yet. Follow these steps:'}
      </p>
      <ol className="checkout-notice__steps">
        <li>Wait for our team to review your request (usually within 2 business days).</li>
        <li>
          Check your inbox{email ? ` (${email})` : ''} — we will send payment details by email (IBAN / bank transfer
          or MB Way).
        </li>
        <li>Pay your subscription using exactly the details in that email.</li>
        <li>
          <strong>Wait for the administrator to confirm your payment and activate your account.</strong> This is
          required — paying alone does not unlock access immediately.
        </li>
        <li>Return to this page (or sign in again). Access opens automatically once activation is complete.</li>
      </ol>
      <p className="checkout-notice__footer muted">
        Do not create a second account. If you have already paid, keep this page open or sign in later — activation
        can take up to one business day after payment is confirmed.
      </p>
    </aside>
  )
}
