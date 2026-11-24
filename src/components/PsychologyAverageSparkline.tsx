type Point = {
  id: string
  averageScore: number | null
  label?: string
}

type Props = {
  title: string
  hint?: string
  /** Newest-first timeline is reversed for chronological left→right. */
  points: Point[]
}

export function PsychologyAverageSparkline({ title, hint, points }: Props) {
  const series = [...points]
    .reverse()
    .map((point) => point.averageScore)
    .filter((value): value is number => value !== null)

  if (series.length < 2) return null

  const width = 320
  const height = 88
  const pad = { l: 8, r: 8, t: 14, b: 14 }
  const plotW = width - pad.l - pad.r
  const plotH = height - pad.t - pad.b
  const min = 0
  const max = 5

  const xs = series.map((_, i) => pad.l + (i / Math.max(series.length - 1, 1)) * plotW)
  const ys = series.map(
    (value) => pad.t + plotH - ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * plotH,
  )

  const path = ys
    .map((y, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  const last = series[series.length - 1]!
  const prev = series[series.length - 2]!
  const dropped = last < prev - 0.2

  return (
    <figure className="psych-sparkline">
      <figcaption className="psych-sparkline__title">{title}</figcaption>
      <svg
        className="psych-sparkline__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
        {[1, 2, 3, 4].map((tick) => {
          const y = pad.t + plotH - ((tick - min) / (max - min)) * plotH
          return (
            <line
              key={tick}
              x1={pad.l}
              x2={width - pad.r}
              y1={y}
              y2={y}
              className="psych-sparkline__grid"
            />
          )
        })}
        <path d={path} className="psych-sparkline__line" fill="none" />
        {ys.map((y, i) => (
          <circle
            key={i}
            cx={xs[i]}
            cy={y}
            r={i === ys.length - 1 ? 3.5 : 2.4}
            className={
              i === ys.length - 1 && dropped
                ? 'psych-sparkline__dot psych-sparkline__dot--watch'
                : 'psych-sparkline__dot'
            }
          />
        ))}
      </svg>
      {hint ? <p className="muted psych-sparkline__hint">{hint}</p> : null}
    </figure>
  )
}
