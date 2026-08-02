import { contactKindLabel } from '../../contactKinds'
import { useI18n } from '../../i18n'
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

export function AdminContactTab({ messages, filter, onFilterChange, onRefresh, busyId, onUpdateStatus }: Props) {
  const { messages: i18nMessages } = useI18n()
  const a = i18nMessages.ui.admin as Record<string, string>
  const coachRole = i18nMessages.roles.coach
  const athleteRole = i18nMessages.roles.athlete

  const filterOptions: { value: ContactFilter; label: string }[] = [
    { value: 'new', label: a.contactFilterNew },
    { value: 'read', label: a.contactFilterRead },
    { value: 'resolved', label: a.contactFilterResolved },
    { value: 'all', label: a.contactFilterAll },
  ]

  return (
    <div className="admin-panel">
      <p className="admin-panel__intro muted">{a.contactIntro}</p>

      <div className="admin-toolbar admin-toolbar--filters">
        <AdminFilterPills
          label={a.statusFilter}
          value={filter}
          options={filterOptions}
          onChange={onFilterChange}
          filterAriaLabel={a.filter}
        />
        <button type="button" className="btn btn--ghost btn--small admin-toolbar__refresh" onClick={onRefresh}>
          {a.refresh}
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="admin-empty">{a.noContactMessagesMatch}</p>
      ) : (
        <div className="admin-list">
          {messages.map((message) => (
            <article key={message.id} className="admin-card admin-card--compact">
              <div className="admin-card__head">
                <div>
                  <h2>{message.subject}</h2>
                  <p className="muted admin-card__subtitle">
                    {message.name} · {message.email}
                    {message.userRole ? ` · ${message.userRole === 'treinador' ? coachRole : athleteRole}` : ''}
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
                    {a.markRead}
                  </button>
                ) : null}
                {message.status !== 'resolved' ? (
                  <button
                    type="button"
                    className="btn btn--gold btn--small"
                    disabled={busyId === message.id}
                    onClick={() => onUpdateStatus(message, 'resolved')}
                  >
                    {a.resolve}
                  </button>
                ) : null}
                {message.status !== 'new' ? (
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    disabled={busyId === message.id}
                    onClick={() => onUpdateStatus(message, 'new')}
                  >
                    {a.reopen}
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
