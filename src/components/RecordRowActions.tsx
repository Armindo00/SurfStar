type Props = {
  onEdit: () => void
  onDelete: () => void
  editLabel?: string
  deleteLabel?: string
}

export function RecordRowActions({
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
}: Props) {
  return (
    <span className="record-row-actions">
      <button type="button" className="btn btn--ghost btn--small" onClick={onEdit}>
        {editLabel}
      </button>
      <button type="button" className="btn btn--ghost btn--small record-row-actions__delete" onClick={onDelete}>
        {deleteLabel}
      </button>
    </span>
  )
}
