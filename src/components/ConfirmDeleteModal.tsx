type Props = {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDeleteModal({ title, message, onConfirm, onCancel }: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="modal sheet sheet--form"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head sheet__head--pro">
          <div>
            <p className="sheet__eyebrow">Delete</p>
            <h2 id="delete-confirm-title">{title}</h2>
          </div>
          <button type="button" className="sheet__close" onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </div>

        <p className="sea-confirm-body">{message}</p>

        <div className="sea-confirm-actions">
          <button type="button" className="btn btn--danger btn--block btn--lg" onClick={onConfirm}>
            Delete
          </button>
          <button type="button" className="btn btn--ghost btn--block" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
