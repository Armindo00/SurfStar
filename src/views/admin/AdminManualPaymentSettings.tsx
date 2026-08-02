import { useEffect, useState, type FormEvent } from 'react'
import {
  adminFetchManualPaymentDetails,
  adminUpdateManualPaymentDetails,
  type ManualPaymentDetails,
} from '../../adminApi'
import { useI18n } from '../../i18n'

type Props = {
  onToast: (message: string) => void
}

export function AdminManualPaymentSettings({ onToast }: Props) {
  const { t, messages } = useI18n()
  const a = messages.ui.admin as Record<string, string>

  const [details, setDetails] = useState<ManualPaymentDetails>({
    account_name: 'SurfStar',
    iban: '',
    mbway: '',
    payment_reference_hint: a.paymentReferenceDefault,
  })
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
      onToast(a.paymentDetailsSavedToast)
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
          <strong>{a.manualPaymentTitle}</strong>
          <small className="muted">
            {loading
              ? a.manualPaymentLoading
              : configured
                ? a.manualPaymentConfigured
                : a.manualPaymentNotSet}
          </small>
        </span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>

      {open ? (
        <form className="admin-payment-settings__form form-pro" onSubmit={(e) => void submit(e)}>
          <p className="muted">{a.manualPaymentIntro}</p>
          <label className="field field--pro">
            <span>{a.accountName}</span>
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
            <span>{a.paymentReferenceNote}</span>
            <input
              value={details.payment_reference_hint}
              onChange={(e) => setDetails((prev) => ({ ...prev, payment_reference_hint: e.target.value }))}
              placeholder={a.paymentReferenceDefault}
            />
          </label>
          {error ? <p className="login-error">{error}</p> : null}
          <button type="submit" className="btn btn--secondary btn--small" disabled={saving || loading}>
            {saving ? t('common.saving') : a.savePaymentDetails}
          </button>
        </form>
      ) : null}
    </section>
  )
}
