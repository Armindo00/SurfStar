import type { jsPDF } from 'jspdf'
import type { SideCompareChart, PdfEvolutionCharts } from './athleteReportPdfEvolution'

const COLOR_BAR_BG = [226, 232, 240] as const
const COLOR_MUTED = [100, 116, 139] as const
const COLOR_TEXT = [15, 23, 42] as const
const COLOR_FS = [2, 132, 199] as const
const COLOR_BS = [124, 58, 237] as const

const MANEUVER_LINE_COLORS: Record<string, [number, number, number]> = {
  rail: [2, 132, 199],
  'top-turn': [5, 150, 105],
  progressive: [217, 119, 6],
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

  layout.ensureSpace(chartH + 14)
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
    doc.text(short, x - 3, top + chartH + 1, { maxWidth: plotW / n })
  })

  y = top + chartH + 5
  doc.setFontSize(6)
  let legendX = margin
  for (const s of series) {
    doc.setFillColor(...s.color)
    doc.rect(legendX, y, 2.5, 2.5, 'F')
    doc.setTextColor(...COLOR_TEXT)
    doc.text(s.label, legendX + 3.5, y + 2)
    legendX += doc.getTextWidth(s.label) + 10
    if (legendX > margin + contentW - 20) {
      legendX = margin
      y += 4
    }
  }
  layout.setY(y + 5)
}

export function drawEvolutionSection(
  layout: ChartLayout,
  charts: PdfEvolutionCharts,
  maneuverLabels: Record<string, string>,
  labels: {
    potential: string
    maneuverSuccess: string
    maneuverLevel: string
    comboSuccess: string
    comboLevel: string
  },
) {
  const { periodLabels } = charts

  drawLineChart(layout, labels.potential, periodLabels, [
    {
      label: labels.potential,
      color: [14, 165, 233],
      values: charts.potentialRates,
      scale: 'percent',
    },
  ])

  drawLineChart(
    layout,
    labels.maneuverSuccess,
    periodLabels,
    charts.maneuverSeries
      .filter((s) => s.successRates.some((v) => v !== null))
      .map((s) => ({
        label: maneuverLabels[s.kind] ?? s.kind,
        color: MANEUVER_LINE_COLORS[s.kind] ?? [100, 116, 139],
        values: s.successRates,
        scale: 'percent' as const,
      })),
  )

  drawLineChart(
    layout,
    labels.maneuverLevel,
    periodLabels,
    charts.maneuverSeries
      .filter((s) => s.avgLevels.some((v) => v !== null))
      .map((s) => ({
        label: maneuverLabels[s.kind] ?? s.kind,
        color: MANEUVER_LINE_COLORS[s.kind] ?? [100, 116, 139],
        values: s.avgLevels,
        scale: 'level' as const,
      })),
  )

  if (charts.comboSuccessRates.some((v) => v !== null)) {
    drawLineChart(layout, labels.comboSuccess, periodLabels, [
      {
        label: labels.comboSuccess,
        color: [168, 85, 247],
        values: charts.comboSuccessRates,
        scale: 'percent',
      },
    ])
  }

  if (charts.comboAvgLevels.some((v) => v !== null)) {
    drawLineChart(layout, labels.comboLevel, periodLabels, [
      {
        label: labels.comboLevel,
        color: [168, 85, 247],
        values: charts.comboAvgLevels,
        scale: 'level',
      },
    ])
  }
}

export function drawSideCompareChart(
  layout: ChartLayout,
  chart: SideCompareChart,
  labels: { success: string; level: string; frontside: string; backside: string },
) {
  layout.ensureSpace(32)
  const { doc, margin, contentW } = layout
  let y = layout.getY()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(chart.title, margin, y)
  y += 5

  const drawPair = (subtitle: string, fs: number | null, bs: number | null, scale: 'percent' | 'level') => {
    if (fs === null && bs === null) return
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(subtitle, margin, y)
    y += 3

    const barMaxH = 14
    const barW = 10
    const gap = 8
    const baseY = y + barMaxH
    const centerX = margin + contentW / 2 - barW - gap / 2

    const drawBar = (x: number, value: number | null, color: [number, number, number], label: string) => {
      doc.setFontSize(6)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(label, x - 1, baseY + 3)
      doc.setFillColor(...COLOR_BAR_BG)
      doc.rect(x, baseY - barMaxH, barW, barMaxH, 'F')
      if (value !== null) {
        const h = valueToPlotHeight(value, scale, barMaxH)
        doc.setFillColor(...color)
        doc.rect(x, baseY - h, barW, h, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(6.5)
        doc.setTextColor(...COLOR_TEXT)
        const text = scale === 'percent' ? `${value}%` : value.toFixed(2)
        doc.text(text, x + barW / 2, baseY - h - 1, { align: 'center' })
      }
    }

    drawBar(centerX, fs, [...COLOR_FS] as [number, number, number], labels.frontside)
    drawBar(centerX + barW + gap, bs, [...COLOR_BS] as [number, number, number], labels.backside)
    y = baseY + 6
  }

  drawPair(labels.success, chart.frontsideSuccess, chart.backsideSuccess, 'percent')
  drawPair(labels.level, chart.frontsideLevel, chart.backsideLevel, 'level')
  layout.setY(y + 2)
}
