import { useEffect, useState, type FormEvent } from 'react'
import {
  adminFetchManualPaymentDetails,
  adminUpdateManualPaymentDetails,
  type ManualPaymentDetails,
} from '../../adminApi'

type Props = {
  onToast: (message: string) => void
}

const EMPTY: ManualPaymentDetails = {
  account_name: 'SurfStar',
  iban: '',
  mbway: '',
  payment_reference_hint: 'Use your registered email as the payment reference.',
}

export function AdminManualPaymentSettings({ onToast }: Props) {
  const [details, setDetails] = useState<ManualPaymentDetails>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void adminFetchManualPaymentDetails().then((result) => {
      if (cancelled) return
      setLoading(false)
      if (result.ok) setDetails(result.details)
      else setError(result.error)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const result = await adminUpdateManualPaymentDetails(details)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setDetails(result.details)
      onToast('Payment details saved. They will appear in coach approval emails.')
    } finally {
      setSaving(false)
    }
  }

  const configured = Boolean(details.iban.trim() || details.mbway.trim())

  return (
    <section className="admin-payment-settings ss-card">
      <button
        type="button"
        className="admin-payment-settings__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>
          <strong>Payment details (IBAN / MB Way)</strong>
          <small className="muted">
            {loading
              ? 'Loading…'
              : configured
                ? 'Configured — included in approval emails'
                : 'Not set — coaches are asked to contact support'}
          </small>
        </span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open ? (
        <form className="admin-payment-settings__form form-pro" onSubmit={(e) => void submit(e)}>
          <p className="muted">
            When you approve a payment request, the coach receives these details by email automatically.
          </p>
          <label className="field field--pro">
            <span>Account name</span>
            <input
              value={details.account_name}
              onChange={(e) => setDetails((prev) => ({ ...prev, account_name: e.target.value }))}
              placeholder="SurfStar"
            />
          </label>
          <label className="field field--pro">
            <span>IBAN</span>
            <input
              value={details.iban}
              onChange={(e) => setDetails((prev) => ({ ...prev, iban: e.target.value }))}
              placeholder="PT50 XXXX XXXX XXXX XXXX XXXX X"
              autoComplete="off"
            />
          </label>
          <label className="field field--pro">
            <span>MB Way (optional)</span>
            <input
              value={details.mbway}
              onChange={(e) => setDetails((prev) => ({ ...prev, mbway: e.target.value }))}
              placeholder="+351 9XX XXX XXX"
              autoComplete="off"
            />
          </label>
          <label className="field field--pro">
            <span>Payment reference note</span>
            <input
              value={details.payment_reference_hint}
              onChange={(e) => setDetails((prev) => ({ ...prev, payment_reference_hint: e.target.value }))}
              placeholder="Use your registered email as the payment reference."
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn--secondary btn--small" disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save payment details'}
          </button>
        </form>
      ) : null}
    </section>
  )
}
