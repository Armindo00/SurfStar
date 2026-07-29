import type { AdminPlanRequest, AdminRequestFilter } from '../../adminApi'
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

const FILTER_OPTIONS: { value: AdminRequestFilter; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'activated', label: 'Activated' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' },
]

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
  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">
        Review new sign-ups, approve requests, and confirm payments to activate coach plans.
      </p>

      <AdminManualPaymentSettings onToast={onToast} />

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills label="Show" value={filter} options={FILTER_OPTIONS} onChange={onFilterChange} />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <p className="admin-empty">No payment requests match this filter.</p>
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
