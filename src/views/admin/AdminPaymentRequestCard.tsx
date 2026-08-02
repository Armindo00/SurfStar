import type { AdminPlanRequest } from '../../adminApi'
import { useI18n } from '../../i18n'
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
  const { messages } = useI18n()
  const a = messages.ui.admin as Record<string, string>

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
            {planRequestSummary(request.plan_id, request.billing_interval)} · {requestAmount(request)} · {a.submitted}{' '}
            {formatAdminDate(request.created_at)}
          </p>
        </div>
        <div className="admin-card__badges">
          <span className={`admin-badge admin-badge--${phase.tone}`}>{phase.label}</span>
        </div>
      </div>

      {request.message ? <p className="admin-card__message">{request.message}</p> : null}
      {request.notes ? (
        <p className="muted admin-card__notes">
          {a.notesPrefix} {request.notes}
        </p>
      ) : null}

      <details className="admin-details">
        <summary>{a.billingRequestDetails}</summary>
        <dl className="admin-meta admin-meta--compact">
          <div>
            <dt>{a.plan}</dt>
            <dd>{planLabel(request.plan_id)}</dd>
          </div>
          <div>
            <dt>{a.amount}</dt>
            <dd>{requestAmount(request)}</dd>
          </div>
          <div>
            <dt>{a.coaches}</dt>
            <dd>{request.coaches_count ?? '—'}</dd>
          </div>
          <div>
            <dt>{a.accountRegistered}</dt>
            <dd>{request.coach_registered ? a.yes : a.notYet}</dd>
          </div>
          {request.tax_id ? (
            <div>
              <dt>{a.taxIdVat}</dt>
              <dd>{request.tax_id}</dd>
            </div>
          ) : null}
          {billingAddress ? (
            <div className="admin-meta__wide">
              <dt>{a.address}</dt>
              <dd>{billingAddress}</dd>
            </div>
          ) : null}
          {request.reviewed_at ? (
            <div>
              <dt>{a.reviewed}</dt>
              <dd>{formatAdminDate(request.reviewed_at)}</dd>
            </div>
          ) : null}
          {request.paid_at ? (
            <div>
              <dt>{a.paid}</dt>
              <dd>{formatAdminDate(request.paid_at)}</dd>
            </div>
          ) : null}
          {request.activated_at ? (
            <div>
              <dt>{a.activated}</dt>
              <dd>{formatAdminDate(request.activated_at)}</dd>
            </div>
          ) : null}
        </dl>
      </details>

      {isOpen ? (
        <>
          <label className="field field--pro admin-card__notes-field">
            <span>{a.internalNotes}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder={a.paymentReferencePlaceholder}
            />
          </label>

          <div className="admin-card__actions admin-card__actions--primary">
            {request.status === 'pending' ? (
              <>
                <button type="button" className="btn btn--gold btn--small" disabled={busy} onClick={onApprove}>
                  {a.approveSendPayment}
                </button>
                <button type="button" className="btn btn--secondary btn--small" disabled={busy} onClick={onReject}>
                  {a.reject}
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--gold btn--small" disabled={busy} onClick={onConfirmPayment}>
                {a.confirmPaymentActivate}
              </button>
            )}
          </div>

          {request.status === 'pending' || request.payment_status === 'unpaid' ? (
            <details className="admin-details admin-details--secondary">
              <summary>{a.moreActions}</summary>
              <div className="admin-card__actions admin-card__actions--secondary">
                {request.status === 'pending' ? (
                  <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onConfirmPayment}>
                    {a.confirmPaymentActivate}
                  </button>
                ) : null}
                <button type="button" className="btn btn--ghost btn--small" disabled={busy} onClick={onActivateFree}>
                  {a.activateWithoutPayment}
                </button>
              </div>
            </details>
          ) : null}
        </>
      ) : null}
    </article>
  )
}
