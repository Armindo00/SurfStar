type Props = {
  title: string
  openLabel: string
  closeLabel: string
  openValue: number | null
  closeValue: number | null
  hint?: string
  /** Heat wave scores are typically 0–10. */
  maxScore?: number
}

export function OpenVsCloseChart({
  title,
  openLabel,
  closeLabel,
  openValue,
  closeValue,
  hint,
  maxScore = 10,
}: Props) {
  if (openValue === null && closeValue === null) return null

  const width = 280
  const height = 120
  const pad = { t: 28, b: 28, l: 36, r: 36 }
  const plotH = height - pad.t - pad.b
  const barW = 36
  const gap = 64
  const startX = (width - (barW * 2 + gap)) / 2
  const baseY = pad.t + plotH

  const toH = (value: number | null) => {
    if (value === null || value <= 0) return 0
    return Math.min(plotH, (Math.min(maxScore, value) / maxScore) * plotH)
  }

  const fmt = (value: number | null) => (value === null ? '—' : value.toFixed(1))

  const bars = [
    {
      key: 'open',
      label: openLabel,
      value: openValue,
      x: startX,
      color: '#0a6a94',
    },
    {
      key: 'close',
      label: closeLabel,
      value: closeValue,
      x: startX + barW + gap,
      color: '#9b2c2c',
    },
  ] as const

  return (
    <figure className="open-vs-close-chart">
      <figcaption className="open-vs-close-chart__title">{title}</figcaption>
      <svg
        className="open-vs-close-chart__svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={title}
      >
        <line
          x1={pad.l - 8}
          y1={baseY}
          x2={width - pad.r + 8}
          y2={baseY}
          className="open-vs-close-chart__baseline"
        />
        {bars.map((bar) => {
          const h = toH(bar.value)
          return (
            <g key={bar.key}>
              <text
                x={bar.x + barW / 2}
                y={pad.t - 10}
                textAnchor="middle"
                className="open-vs-close-chart__value"
              >
                {fmt(bar.value)}
              </text>
              <rect
                x={bar.x}
                y={baseY - Math.max(h, 2)}
                width={barW}
                height={Math.max(h, 2)}
                rx={5}
                fill={bar.color}
                opacity={bar.value === null ? 0.25 : 1}
              />
              <text
                x={bar.x + barW / 2}
                y={baseY + 16}
                textAnchor="middle"
                className="open-vs-close-chart__label"
              >
                {bar.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hint ? <p className="muted open-vs-close-chart__hint">{hint}</p> : null}
    </figure>
  )
}
