import { contactKindLabel } from '../../contactKinds'
import type { ContactMessage, ContactMessageStatus } from '../../types'
import { AdminFilterPills } from './AdminFilterPills'
import { formatAdminDate } from './adminUtils'

type ContactFilter = 'new' | 'read' | 'resolved' | 'all'

type Props = {
  messages: ContactMessage[]
  filter: ContactFilter
  onFilterChange: (filter: ContactFilter) => void
  onRefresh: () => void
  busyId: string | null
  onUpdateStatus: (message: ContactMessage, status: ContactMessageStatus) => void
}

const FILTER_OPTIONS: { value: ContactFilter; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'all', label: 'All' },
]

export function AdminContactTab({ messages, filter, onFilterChange, onRefresh, busyId, onUpdateStatus }: Props) {
  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">Contact form submissions from coaches and athletes.</p>

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills label="Status" value={filter} options={FILTER_OPTIONS} onChange={onFilterChange} />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={onRefresh}>
          Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="admin-empty">No contact messages match this filter.</p>
      ) : (
        <div className="admin-list">
          {messages.map((message) => (
            <article key={message.id} className="admin-card admin-card--compact">
              <div className="admin-card__head">
                <div>
                  <h2>{message.subject}</h2>
                  <p className="muted admin-card__subtitle">
                    {message.name} · {message.email}
                    {message.userRole ? ` · ${message.userRole === 'treinador' ? 'Coach' : 'Athlete'}` : ''}
                  </p>
                  <p className="admin-card__summary">
                    {contactKindLabel(message.kind)} · {formatAdminDate(message.createdAt)}
                  </p>
                </div>
                <span className={`admin-badge admin-badge--${message.status}`}>{message.status}</span>
              </div>

              <p className="admin-card__message">{message.message}</p>

              <div className="admin-card__actions admin-card__actions--primary">
                {message.status !== 'read' ? (
                  <button
                    type="button"
                    className="btn btn--secondary btn--small"
                    disabled={busyId === message.id}
                    onClick={() => onUpdateStatus(message, 'read')}
                  >
                    Mark read
                  </button>
                ) : null}
                {message.status !== 'resolved' ? (
                  <button
                    type="button"
                    className="btn btn--gold btn--small"
                    disabled={busyId === message.id}
                    onClick={() => onUpdateStatus(message, 'resolved')}
                  >
                    Resolve
                  </button>
                ) : null}
                {message.status !== 'new' ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={busyId === message.id}
                    onClick={() => onUpdateStatus(message, 'new')}
                  >
                    Reopen
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
