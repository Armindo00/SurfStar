type Props = {
  speed: number
  control: number
  release: number
  title?: string
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="equipment-rating">
      <div className="equipment-rating__head">
        <span>{label}</span>
        <strong>{value}/10</strong>
      </div>
      <div className="equipment-rating__track" role="presentation">
        <div className="equipment-rating__fill" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

export function EquipmentRatingChart({ speed, control, release, title }: Props) {
  return (
    <div className="equipment-rating-chart">
      {title ? <h3 className="equipment-rating-chart__title">{title}</h3> : null}
      <Bar label="Speed" value={speed} />
      <Bar label="Control" value={control} />
      <Bar label="Release" value={release} />
    </div>
  )
}
