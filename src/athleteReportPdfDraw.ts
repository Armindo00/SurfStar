import type { jsPDF } from 'jspdf'
import type { SideCompareChart, PdfEvolutionCharts } from './athleteReportPdfEvolution'
import type { WaveMatrixCounts } from './sessionStats'

const COLOR_BAR_BG = [226, 232, 240] as const
const COLOR_MUTED = [100, 116, 139] as const
const COLOR_TEXT = [15, 23, 42] as const
const COLOR_FS = [2, 132, 199] as const
const COLOR_BS = [124, 58, 237] as const
const COLOR_TEAL_CELL = [217, 238, 245] as const
const COLOR_MINT_CELL = [228, 243, 234] as const
const COLOR_PRIMARY = [10, 106, 148] as const

export type PdfWaveMatrixLabels = {
  title: string
  subtitle: string
  axisPotential: string
  axisResult: string
  highHighTitle: string
  highHighBlurb: string
  highLowTitle: string
  highLowBlurb: string
  lowHighTitle: string
  lowHighBlurb: string
  lowLowTitle: string
  lowLowBlurb: string
  countLabel: (count: number) => string
}

export type ChartLayout = {
  doc: jsPDF
  margin: number
  contentW: number
  pageH: number
  getY: () => number
  setY: (y: number) => void
  ensureSpace: (h: number) => void
}

export type LineSeries = {
  label: string
  color: [number, number, number]
  values: (number | null)[]
  scale: 'percent' | 'level'
}

function valueToPlotHeight(value: number, scale: 'percent' | 'level', plotH: number): number {
  if (scale === 'percent') {
    return (Math.min(100, Math.max(0, value)) / 100) * plotH
  }
  return (Math.min(4, Math.max(0, value)) / 4) * plotH
}

export function drawLineChart(
  layout: ChartLayout,
  title: string,
  xLabels: string[],
  series: LineSeries[],
  chartH = 38,
) {
  if (xLabels.length === 0 || series.length === 0) return
  const hasData = series.some((s) => s.values.some((v) => v !== null))
  if (!hasData) return

  const legendRows = Math.max(1, Math.ceil(series.length / 2))
  const legendBlockH = legendRows * 5.5 + 6
  layout.ensureSpace(chartH + legendBlockH + 10)
  const { doc, margin, contentW } = layout
  let y = layout.getY()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(title, margin, y)
  y += 4

  const top = y + 2
  const left = margin + 10
  const plotW = contentW - 14
  const plotH = chartH - 10

  doc.setDrawColor(...COLOR_BAR_BG)
  doc.setLineWidth(0.2)
  doc.rect(margin, top, contentW, chartH)
  for (let grid = 0; grid <= 4; grid += 1) {
    const gy = top + chartH - 2 - (grid / 4) * plotH
    doc.line(margin + 1, gy, margin + contentW - 1, gy)
  }

  const n = xLabels.length
  const xAt = (index: number) => left + (index / Math.max(n - 1, 1)) * plotW

  for (const s of series) {
    doc.setDrawColor(...s.color)
    doc.setLineWidth(0.55)
    let prev: { x: number; y: number } | null = null
    s.values.forEach((value, index) => {
      if (value === null) {
        prev = null
        return
      }
      const x = xAt(index)
      const yPoint = top + chartH - 2 - valueToPlotHeight(value, s.scale, plotH)
      if (prev) {
        doc.line(prev.x, prev.y, x, yPoint)
      }
      doc.setFillColor(...s.color)
      doc.circle(x, yPoint, 0.7, 'F')
      prev = { x, y: yPoint }
    })
  }

  doc.setFontSize(5.5)
  doc.setTextColor(...COLOR_MUTED)
  xLabels.forEach((label, index) => {
    const x = xAt(index)
    const short = label.length > 8 ? `${label.slice(0, 7)}…` : label
    doc.text(short, x, top + chartH - 1, { align: 'center', maxWidth: Math.max(plotW / n, 12) })
  })

  const legendLineH = 5.5
  let legendY = top + chartH + 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)

  const legendItems = series.map((s) => ({
    label: s.label,
    color: s.color,
    width: doc.getTextWidth(s.label) + 8,
  }))
  const maxRowWidth = contentW - 4
  let rowStart = 0
  while (rowStart < legendItems.length) {
    let rowEnd = rowStart + 1
    let rowWidth = legendItems[rowStart].width
    while (rowEnd < legendItems.length && rowWidth + legendItems[rowEnd].width + 6 <= maxRowWidth) {
      rowWidth += legendItems[rowEnd].width + 6
      rowEnd += 1
    }
    const rowItems = legendItems.slice(rowStart, rowEnd)
    const totalRowWidth =
      rowItems.reduce((sum, item) => sum + item.width, 0) + Math.max(0, rowItems.length - 1) * 6
    let legendX = margin + (contentW - totalRowWidth) / 2
    for (const item of rowItems) {
      doc.setFillColor(...item.color)
      doc.rect(legendX, legendY + 0.5, 2.5, 2.5, 'F')
      doc.setTextColor(...COLOR_TEXT)
      doc.text(item.label, legendX + 4, legendY + 2.6)
      legendX += item.width + 6
    }
    legendY += legendLineH
    rowStart = rowEnd
  }

  layout.setY(legendY + 6)
}

/** Key evolution themes: potential, success rates, success level vs overall maneuver level. */
export function drawEvolutionSection(
  layout: ChartLayout,
  charts: PdfEvolutionCharts,
  _maneuverLabels: Record<string, string>,
  labels: {
    potential: string
    maneuverSuccess: string
    maneuverLevel: string
    comboSuccess: string
    comboLevel: string
    successVsOverallLevel: string
    successAvgLevel: string
    overallManeuverLevel: string
    successRatesTitle: string
  },
) {
  const { periodLabels } = charts
  const hasPotential = charts.potentialRates.some((v) => v !== null)
  const hasSuccessRates =
    charts.maneuverSuccessRates.some((v) => v !== null) ||
    charts.comboSuccessRates.some((v) => v !== null)
  const hasLevels =
    charts.successAvgLevels.some((v) => v !== null) ||
    charts.overallManeuverAvgLevels.some((v) => v !== null)

  if (!hasPotential && !hasSuccessRates && !hasLevels) {
    layout.setY(layout.getY() + 2)
    return
  }

  if (hasPotential) {
    drawLineChart(layout, labels.potential, periodLabels, [
      {
        label: labels.potential,
        color: [10, 106, 148],
        values: charts.potentialRates,
        scale: 'percent',
      },
    ])
  }

  if (hasSuccessRates) {
    drawLineChart(layout, labels.successRatesTitle, periodLabels, [
      {
        label: labels.maneuverSuccess,
        color: [2, 132, 199],
        values: charts.maneuverSuccessRates,
        scale: 'percent',
      },
      {
        label: labels.comboSuccess,
        color: [15, 118, 110],
        values: charts.comboSuccessRates,
        scale: 'percent',
      },
    ])
  }

  if (hasLevels) {
    drawLineChart(layout, labels.successVsOverallLevel, periodLabels, [
      {
        label: labels.successAvgLevel,
        color: [10, 106, 148],
        values: charts.successAvgLevels,
        scale: 'level',
      },
      {
        label: labels.overallManeuverLevel,
        color: [100, 116, 139],
        values: charts.overallManeuverAvgLevels,
        scale: 'level',
      },
    ])
  }

  layout.setY(layout.getY() + 4)
}

const COLOR_OPEN = [10, 106, 148] as const
const COLOR_CLOSE = [155, 44, 44] as const

/** Dual vertical bars: average best-wave opening vs closing (heat score scale). */
export function drawOpenVsCloseChart(
  layout: ChartLayout,
  title: string,
  openLabel: string,
  closeLabel: string,
  openValue: number | null,
  closeValue: number | null,
  maxScore = 10,
) {
  if (openValue === null && closeValue === null) return

  layout.ensureSpace(48)
  const { doc, margin, contentW } = layout
  let y = layout.getY()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(title, margin, y)
  y += 5

  const barMaxH = 22
  const barW = 14
  const gap = 22
  const pairWidth = barW * 2 + gap
  const startX = margin + (contentW - pairWidth) / 2
  const baseY = y + barMaxH

  const drawBar = (
    x: number,
    value: number | null,
    color: readonly [number, number, number],
    label: string,
  ) => {
    const center = x + barW / 2
    doc.setFillColor(...COLOR_BAR_BG)
    doc.rect(x, baseY - barMaxH, barW, barMaxH, 'F')
    const display = value === null ? '—' : value.toFixed(1)
    if (value !== null && value > 0) {
      const h = (Math.min(maxScore, Math.max(0, value)) / maxScore) * barMaxH
      const [r, g, b] = color
      doc.setFillColor(r, g, b)
      doc.rect(x, baseY - h, barW, Math.max(h, 1.2), 'F')
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_TEXT)
    doc.text(display, center, baseY - barMaxH - 1.5, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(label, center, baseY + 4, { align: 'center', maxWidth: barW + 10 })
  }

  drawBar(startX, openValue, COLOR_OPEN, openLabel)
  drawBar(startX + barW + gap, closeValue, COLOR_CLOSE, closeLabel)
  layout.setY(baseY + 8)
}

export function drawSideCompareChart(
  layout: ChartLayout,
  chart: SideCompareChart,
  labels: { success: string; level: string; frontside: string; backside: string },
) {
  layout.ensureSpace(58)
  const { doc, margin, contentW } = layout
  let y = layout.getY()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(chart.title, margin, y)
  y += 5

  const drawPair = (subtitle: string, fs: number | null, bs: number | null, scale: 'percent' | 'level') => {
    if (fs === null && bs === null) return
    layout.setY(y)
    layout.ensureSpace(28)
    y = layout.getY()

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(subtitle, margin, y)
    y += 3

    const barMaxH = 14
    const barW = 12
    const gap = 10
    const baseY = y + barMaxH
    const pairWidth = barW * 2 + gap
    const startX = margin + (contentW - pairWidth) / 2

    const drawBar = (x: number, value: number | null, color: [number, number, number], label: string) => {
      const barCenterX = x + barW / 2
      doc.setFillColor(...COLOR_BAR_BG)
      doc.rect(x, baseY - barMaxH, barW, barMaxH, 'F')

      const display =
        value === null ? '—' : scale === 'percent' ? `${value}%` : value.toFixed(2)

      if (value !== null && value > 0) {
        const h = valueToPlotHeight(value, scale, barMaxH)
        doc.setFillColor(...color)
        doc.rect(x, baseY - h, barW, h, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(...COLOR_TEXT)
        doc.text(display, barCenterX, baseY - h - 1, { align: 'center' })
      } else {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6.5)
        doc.setTextColor(...COLOR_TEXT)
        doc.text(display, barCenterX, baseY - barMaxH + 4, { align: 'center' })
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(6)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(label, barCenterX, baseY + 4, { align: 'center', maxWidth: barW + 6 })
    }

    drawBar(startX, fs, [...COLOR_FS] as [number, number, number], labels.frontside)
    drawBar(startX + barW + gap, bs, [...COLOR_BS] as [number, number, number], labels.backside)
    y = baseY + 8
    layout.setY(y)
  }

  drawPair(labels.success, chart.frontsideSuccess, chart.backsideSuccess, 'percent')
  drawPair(labels.level, chart.frontsideLevel, chart.backsideLevel, 'level')
  layout.setY(y + 2)
}

export function drawWaveMatrix(
  layout: ChartLayout,
  matrix: WaveMatrixCounts,
  totalWaves: number,
  labels: PdfWaveMatrixLabels,
) {
  layout.ensureSpace(92)
  const { doc, margin, contentW } = layout
  let y = layout.getY()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(labels.title, margin, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(labels.subtitle, margin, y)
  y += 6

  const axisW = 8
  const gridX = margin + axisW
  const gridW = contentW - axisW
  const cellW = gridW / 2
  const cellH = 32
  const gap = 1.2

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...COLOR_PRIMARY)
  const potLines = doc.splitTextToSize(labels.axisPotential, cellH * 2)
  doc.text(potLines, margin + 2, y + cellH, { angle: 90, align: 'center' })

  const pct = (count: number) =>
    totalWaves ? `${Math.round((count / totalWaves) * 100)}%` : '—'

  type Cell = {
    title: string
    blurb: string
    count: number
    fill: readonly [number, number, number] | null
  }

  const rows: Cell[][] = [
    [
      {
        title: labels.highHighTitle,
        blurb: labels.highHighBlurb,
        count: matrix.potentialSurfed,
        fill: COLOR_TEAL_CELL,
      },
      {
        title: labels.highLowTitle,
        blurb: labels.highLowBlurb,
        count: matrix.potentialWasted,
        fill: null,
      },
    ],
    [
      {
        title: labels.lowHighTitle,
        blurb: labels.lowHighBlurb,
        count: matrix.noPotentialSurfed,
        fill: null,
      },
      {
        title: labels.lowLowTitle,
        blurb: labels.lowLowBlurb,
        count: matrix.noPotentialWasted,
        fill: COLOR_MINT_CELL,
      },
    ],
  ]

  rows.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const x = gridX + colIndex * (cellW + gap / 2)
      const cy = y + rowIndex * (cellH + gap)
      if (cell.fill) {
        doc.setFillColor(...cell.fill)
        doc.rect(x, cy, cellW - gap / 2, cellH, 'F')
      }
      doc.setDrawColor(215, 226, 234)
      doc.rect(x, cy, cellW - gap / 2, cellH, 'S')

      const cx = x + (cellW - gap / 2) / 2
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6)
      doc.setTextColor(...COLOR_TEXT)
      const titleLines = doc.splitTextToSize(cell.title.toUpperCase(), cellW - 6)
      doc.text(titleLines, cx, cy + 5, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(...COLOR_MUTED)
      const blurbLines = doc.splitTextToSize(cell.blurb, cellW - 8)
      doc.text(blurbLines.slice(0, 3), cx, cy + 11, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(...COLOR_PRIMARY)
      doc.text(pct(cell.count), cx, cy + 24, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(5.5)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(labels.countLabel(cell.count), cx, cy + 28.5, { align: 'center' })
    })
  })

  y += cellH * 2 + gap + 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(6)
  doc.setTextColor(...COLOR_PRIMARY)
  doc.text(`${labels.axisResult}  →`, gridX + gridW / 2, y, { align: 'center' })
  layout.setY(y + 4)
}
