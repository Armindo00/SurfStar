import type { AdminPlanRequest, AdminRequestFilter } from '../../adminApi'
import { useI18n } from '../../i18n'
import { AdminFilterPills } from './AdminFilterPills'
import { AdminManualPaymentSettings } from './AdminManualPaymentSettings'
import { AdminPaymentRequestCard } from './AdminPaymentRequestCard'

type Props = {
  requests: AdminPlanRequest[]
  filter: AdminRequestFilter
  onFilterChange: (filter: AdminRequestFilter) => void
  onRefresh: () => void
  busyId: string | null
  notesDraft: Record<string, string>
  onNotesChange: (requestId: string, notes: string) => void
  onApprove: (request: AdminPlanRequest) => void
  onReject: (request: AdminPlanRequest) => void
  onConfirmPayment: (request: AdminPlanRequest) => void
  onActivateFree: (request: AdminPlanRequest) => void
  onToast: (message: string) => void
}

export function AdminPaymentsTab({
  requests,
  filter,
  onFilterChange,
  onRefresh,
  busyId,
  notesDraft,
  onNotesChange,
  onApprove,
  onReject,
  onConfirmPayment,
  onActivateFree,
  onToast,
}: Props) {
  const { messages } = useI18n()
  const a = messages.ui.admin as Record<string, string>

  const filterOptions: { value: AdminRequestFilter; label: string }[] = [
    { value: 'pending', label: a.paymentFilterPending },
    { value: 'awaiting_payment', label: a.paymentFilterAwaiting },
    { value: 'activated', label: a.paymentFilterActivated },
    { value: 'rejected', label: a.paymentFilterRejected },
    { value: 'all', label: a.paymentFilterAll },
  ]

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">{a.paymentsIntro}</p>

      <AdminManualPaymentSettings onToast={onToast} />

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills
          label={a.show}
          value={filter}
          options={filterOptions}
          onChange={onFilterChange}
          filterAriaLabel={a.filter}
        />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={onRefresh}>
          {a.refresh}
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="admin-empty">{a.noPaymentRequestsMatch}</p>
      ) : (
        <div className="admin-list">
          {requests.map((request) => (
            <AdminPaymentRequestCard
              key={request.id}
              request={request}
              busy={busyId === request.id}
              notes={notesDraft[request.id] ?? ''}
              onNotesChange={(notes) => onNotesChange(request.id, notes)}
              onApprove={() => onApprove(request)}
              onReject={() => onReject(request)}
              onConfirmPayment={() => onConfirmPayment(request)}
              onActivateFree={() => onActivateFree(request)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
