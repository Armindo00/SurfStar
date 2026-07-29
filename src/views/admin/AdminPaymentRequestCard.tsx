import type { AdminPlanRequest } from '../../adminApi'
import {
  formatAdminDate,
  formatBillingAddress,
  planLabel,
  planRequestSummary,
  requestAmount,
  requestPhase,
} from './adminUtils'

type Props = {
  request: AdminPlanRequest
  busy: boolean
  notes: string
  onNotesChange: (notes: string) => void
  onApprove: () => void
  onReject: () => void
  onConfirmPayment: () => void
  onActivateFree: () => void
}

export function AdminPaymentRequestCard({
  request,
  busy,
  notes,
  onNotesChange,
  onApprove,
  onReject,
  onConfirmPayment,
  onActivateFree,
}: Props) {
  const phase = requestPhase(request)
  const isOpen = !request.activated_at && request.status !== 'rejected'
  const billingAddress = formatBillingAddress(request)

  return (
    <article className="admin-card admin-card--compact">
      <div className="admin-card__head">
        <div>
          <h2>{request.organization_name}</h2>
          <p className="muted admin-card__subtitle">
            {request.contact_name} · {request.email}
          </p>
          <p className="admin-card__summary">
            {planRequestSummary(request.plan_id, request.billing_interval)} · {requestAmount(request)} · Submitted{' '}
            {formatAdminDate(request.created_at)}
          </p>
        </div>
        <div className="admin-card__badges">
          <span className={`admin-badge admin-badge--${phase.tone}`}>{phase.label}</span>
        </div>
      </div>

      {request.message ? <p className="admin-card__message">{request.message}</p> : null}
      {request.notes ? <p className="muted admin-card__notes">Notes: {request.notes}</p> : null}

      <details className="admin-details">
        <summary>Billing & request details</summary>
        <dl className="admin-meta admin-meta--compact">
          <div>
            <dt>Plan</dt>
            <dd>{planLabel(request.plan_id)}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>{requestAmount(request)}</dd>
          </div>
          <div>
            <dt>Coaches</dt>
            <dd>{request.coaches_count ?? '—'}</dd>
          </div>
          <div>
            <dt>Account registered</dt>
            <dd>{request.coach_registered ? 'Yes' : 'Not yet'}</dd>
          </div>
          {request.tax_id ? (
            <div>
              <dt>Tax ID / VAT</dt>
              <dd>{request.tax_id}</dd>
            </div>
          ) : null}
          {billingAddress ? (
            <div className="admin-meta__wide">
              <dt>Address</dt>
              <dd>{billingAddress}</dd>
            </div>
          ) : null}
          {request.reviewed_at ? (
            <div>
              <dt>Reviewed</dt>
              <dd>{formatAdminDate(request.reviewed_at)}</dd>
            </div>
          ) : null}
          {request.paid_at ? (
            <div>
              <dt>Paid</dt>
              <dd>{formatAdminDate(request.paid_at)}</dd>
            </div>
          ) : null}
          {request.activated_at ? (
            <div>
              <dt>Activated</dt>
              <dd>{formatAdminDate(request.activated_at)}</dd>
            </div>
          ) : null}
        </dl>
      </details>

      {isOpen ? (
        <>
          <label className="field field--pro admin-card__notes-field">
            <span>Internal notes (optional)</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Payment reference, IBAN sent, etc."
            />
          </label>

          <div className="admin-card__actions admin-card__actions--primary">
            {request.status === 'pending' ? (
              <>
                <button type="button" className="btn btn--gold btn--small" disabled={busy} onClick={onApprove}>
                  Approve & send payment details
                </button>
                <button type="button" className="btn btn--secondary btn--small" disabled={busy} onClick={onReject}>
                  Reject
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--gold btn--small" disabled={busy} onClick={onConfirmPayment}>
                Confirm payment & activate
              </button>
            )}
          </div>

          {request.status === 'pending' || request.payment_status === 'unpaid' ? (
            <details className="admin-details admin-details--secondary">
              <summary>More actions</summary>
              <div className="admin-card__actions admin-card__actions--secondary">
                {request.status === 'pending' ? (
                  <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onConfirmPayment}>
                    Confirm payment & activate
                  </button>
                ) : null}
                <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onActivateFree}>
                  Activate without payment
                </button>
              </div>
            </details>
          ) : null}
        </>
      ) : null}
    </article>
  )
}
