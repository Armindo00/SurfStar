import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AthleteGeneralStats } from './athleteStats'
import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { ComboSessionStatsSnapshot, SessionStatsSnapshot } from './sessionStats'
import type { EvolutionPoint } from './teamAnalyticsStats'
import type { PdfEvolutionCharts, SideCompareChart } from './athleteReportPdfEvolution'
import { drawEvolutionSection, drawSideCompareChart, type ChartLayout } from './athleteReportPdfDraw'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2

const COLOR_TEXT = [15, 23, 42] as const
const COLOR_MUTED = [100, 116, 139] as const
const COLOR_PRIMARY = [2, 132, 199] as const
const COLOR_BAR_BG = [226, 232, 240] as const

export type AthleteReportPdfLabels = {
  sheetEyebrow: string
  period: string
  coach: string
  organization: string
  generated: string
  summary: string
  sessions: string
  wavesLogged: string
  avgLevel: string
  potentialRate: string
  stars: string
  heatWins: string
  coachComments: string
  evolution: string
  successCol: string
  potentialCol: string
  trainingMix: string
  sessionLog: string
  date: string
  mode: string
  spot: string
  summaryCol: string
  performanceOverview: string
  technicalTraining: string
  comboTraining: string
  competition: string
  psychology: string
  chartLegendSuccess: string
  chartLegendPotential: string
  pdfChartPotentialEvolution: string
  pdfChartManeuverSuccessEvolution: string
  pdfChartManeuverLevelEvolution: string
  pdfChartComboSuccessEvolution: string
  pdfChartComboLevelEvolution: string
  pdfTechnicalSideCharts: string
  pdfComboSideCharts: string
  frontside: string
  backside: string
  maneuvers: string
  attempts: string
  page: string
}

export type TrainingMixRow = { label: string; count: number }
export type ManeuverSummaryRow = { label: string; attempts: number; rate: number | null }

export type AthleteReportPdfInput = {
  athleteName: string
  coachName: string
  organizationName?: string | null
  rangeLabel: string
  reportTitle: string
  generatedAt: string
  footerLine: string
  coachComment?: string
  general: AthleteGeneralStats
  evolution: EvolutionPoint[]
  evolutionColumnLabel: string
  evolutionCharts: PdfEvolutionCharts
  maneuverLabels: Record<string, string>
  technicalSideCharts: SideCompareChart[]
  comboSideCharts: SideCompareChart[]
  trainingMix: TrainingMixRow[]
  technical: SessionStatsSnapshot | null
  combo: ComboSessionStatsSnapshot | null
  psychology: AthletePsychologyAnalytics | null | undefined
  maneuverSummaries: ManeuverSummaryRow[]
  sessionRows: { date: string; mode: string; spot: string; summary: string }[]
  labels: AthleteReportPdfLabels
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const response = await fetch('/logo.png')
    if (!response.ok) return null
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

class PdfDoc {
  readonly doc = new jsPDF({ unit: 'mm', format: 'a4' })
  y = MARGIN
  private readonly athleteName: string
  private readonly labels: AthleteReportPdfLabels

  constructor(athleteName: string, labels: AthleteReportPdfLabels) {
    this.athleteName = athleteName
    this.labels = labels
  }

  drawFooter() {
    const page = this.doc.getNumberOfPages()
    this.doc.setPage(page)
    this.doc.setFontSize(8)
    this.doc.setTextColor(...COLOR_MUTED)
    this.doc.text(`SurfStar · ${this.athleteName}`, MARGIN, PAGE_H - 8)
    this.doc.text(`${this.labels.page} ${page}`, PAGE_W - MARGIN, PAGE_H - 8, { align: 'right' })
    this.doc.setTextColor(...COLOR_TEXT)
  }

  ensureSpace(height: number) {
    if (this.y + height > PAGE_H - MARGIN - 10) {
      this.drawFooter()
      this.doc.addPage()
      this.y = MARGIN
    }
  }

  sectionTitle(title: string) {
    this.ensureSpace(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(11)
    this.doc.setTextColor(...COLOR_TEXT)
    this.doc.text(title, MARGIN, this.y)
    this.y += 7
    this.doc.setDrawColor(...COLOR_BAR_BG)
    this.doc.setLineWidth(0.3)
    this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y)
    this.y += 5
  }

  bodyText(text: string, maxWidth = CONTENT_W) {
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(9)
    this.doc.setTextColor(...COLOR_TEXT)
    const lines = this.doc.splitTextToSize(text, maxWidth)
    this.ensureSpace(lines.length * 4.2 + 2)
    this.doc.text(lines, MARGIN, this.y)
    this.y += lines.length * 4.2 + 2
  }

  metaRow(items: { label: string; value: string }[]) {
    const colW = CONTENT_W / Math.min(items.length, 4)
    this.ensureSpace(14)
    this.doc.setFontSize(7)
    this.doc.setTextColor(...COLOR_MUTED)
    items.forEach((item, index) => {
      const x = MARGIN + index * colW
      this.doc.text(item.label.toUpperCase(), x, this.y)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(9)
      this.doc.setTextColor(...COLOR_TEXT)
      const valueLines = this.doc.splitTextToSize(item.value, colW - 2)
      this.doc.text(valueLines, x, this.y + 4)
      this.doc.setFont('helvetica', 'normal')
      this.doc.setTextColor(...COLOR_MUTED)
    })
    this.y += 16
  }

  kpiGrid(
    items: { label: string; value: string }[],
  ) {
    const cols = 3
    const gap = 3
    const cellW = (CONTENT_W - gap * (cols - 1)) / cols
    const cellH = 16
    const rows = Math.ceil(items.length / cols)
    this.ensureSpace(rows * (cellH + gap) + 2)

    items.forEach((item, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)
      const x = MARGIN + col * (cellW + gap)
      const y = this.y + row * (cellH + gap)
      this.doc.setDrawColor(...COLOR_BAR_BG)
      this.doc.setFillColor(248, 250, 252)
      this.doc.roundedRect(x, y, cellW, cellH, 2, 2, 'FD')
      this.doc.setFontSize(7)
      this.doc.setTextColor(...COLOR_MUTED)
      this.doc.text(item.label, x + 3, y + 5)
      this.doc.setFont('helvetica', 'bold')
      this.doc.setFontSize(12)
      this.doc.setTextColor(...COLOR_TEXT)
      this.doc.text(item.value, x + 3, y + 12)
      this.doc.setFont('helvetica', 'normal')
    })
    this.y += rows * (cellH + gap) + 4
  }

  drawHorizontalBars(rows: TrainingMixRow[]) {
    if (rows.length === 0) return
    const max = Math.max(...rows.map((r) => r.count), 1)
    const rowH = 8
    this.ensureSpace(rows.length * (rowH + 2) + 2)

    for (const row of rows) {
      const barMaxW = CONTENT_W - 52
      const barW = (row.count / max) * barMaxW
      this.doc.setFontSize(8)
      this.doc.setTextColor(...COLOR_TEXT)
      this.doc.text(row.label, MARGIN, this.y + 5)
      const barX = MARGIN + 48
      this.doc.setFillColor(...COLOR_BAR_BG)
      this.doc.rect(barX, this.y + 1, barMaxW, 5, 'F')
      this.doc.setFillColor(...COLOR_PRIMARY)
      this.doc.rect(barX, this.y + 1, barW, 5, 'F')
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(String(row.count), barX + barMaxW + 3, this.y + 5)
      this.doc.setFont('helvetica', 'normal')
      this.y += rowH + 2
    }
    this.y += 2
  }

  chartLayout(): ChartLayout {
    return {
      doc: this.doc,
      margin: MARGIN,
      contentW: CONTENT_W,
      pageH: PAGE_H,
      getY: () => this.y,
      setY: (y: number) => {
        this.y = y
      },
      ensureSpace: (h: number) => this.ensureSpace(h),
    }
  }

  finish() {
    this.drawFooter()
    return this.doc.output('blob')
  }
}

function formatRate(value: number | null): string {
  return value === null ? '—' : `${value}%`
}

function formatLevel(value: number | null): string {
  return value === null ? '—' : value.toFixed(2)
}

export async function buildAthleteReportPdfBlob(input: AthleteReportPdfInput): Promise<Blob> {
  const logo = await loadLogoDataUrl()
  const pdf = new PdfDoc(input.athleteName, input.labels)
  const { doc } = pdf
  const L = input.labels
  const g = input.general

  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, pdf.y, 10, 10)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(input.athleteName, MARGIN + (logo ? 12 : 0), pdf.y + 7)
  pdf.y += 12

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(L.sheetEyebrow, MARGIN, pdf.y)
  pdf.y += 5
  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(input.reportTitle, MARGIN, pdf.y)
  pdf.y += 8

  const meta: { label: string; value: string }[] = [
    { label: L.period, value: input.rangeLabel },
    { label: L.coach, value: input.coachName },
    { label: L.generated, value: input.generatedAt },
  ]
  if (input.organizationName) {
    meta.splice(2, 0, { label: L.organization, value: input.organizationName })
  }
  pdf.metaRow(meta.slice(0, 4))

  pdf.sectionTitle(L.summary)
  pdf.kpiGrid([
    { label: L.sessions, value: String(g.totalTrainings) },
    { label: L.wavesLogged, value: String(g.totalWaves) },
    { label: L.avgLevel, value: formatLevel(g.avgOverallManeuverLevel) },
    { label: L.potentialRate, value: formatRate(g.withPotentialRate) },
    { label: L.stars, value: String(g.totalStars) },
    { label: L.heatWins, value: String(g.heatWins) },
  ])

  if (input.coachComment?.trim()) {
    pdf.sectionTitle(L.coachComments)
    pdf.bodyText(input.coachComment.trim())
  }

  if (input.evolutionCharts.periodLabels.length > 0) {
    pdf.sectionTitle(L.evolution)
    drawEvolutionSection(pdf.chartLayout(), input.evolutionCharts, input.maneuverLabels, {
      potential: L.pdfChartPotentialEvolution,
      maneuverSuccess: L.pdfChartManeuverSuccessEvolution,
      maneuverLevel: L.pdfChartManeuverLevelEvolution,
      comboSuccess: L.pdfChartComboSuccessEvolution,
      comboLevel: L.pdfChartComboLevelEvolution,
    })
  }

  if (input.technicalSideCharts.length > 0) {
    pdf.sectionTitle(L.pdfTechnicalSideCharts)
    for (const chart of input.technicalSideCharts) {
      drawSideCompareChart(pdf.chartLayout(), chart, {
        success: L.successCol,
        level: L.avgLevel,
        frontside: L.frontside,
        backside: L.backside,
      })
    }
  }

  if (input.comboSideCharts.length > 0) {
    pdf.sectionTitle(L.pdfComboSideCharts)
    for (const chart of input.comboSideCharts) {
      drawSideCompareChart(pdf.chartLayout(), chart, {
        success: L.successCol,
        level: L.avgLevel,
        frontside: L.frontside,
        backside: L.backside,
      })
    }
  }

  if (input.trainingMix.length > 0) {
    pdf.sectionTitle(L.trainingMix)
    pdf.drawHorizontalBars(input.trainingMix)
  }

  pdf.sectionTitle(L.performanceOverview)

  if (input.technical) {
    pdf.bodyText(
      `${L.technicalTraining}: ${input.technical.overallSuccessRate}% ${L.successCol} · ${input.technical.totalManeuvers} ${L.attempts} · ${L.avgLevel} ${formatLevel(input.technical.averageLevel)}`,
    )
  }
  if (input.combo) {
    pdf.bodyText(
      `${L.comboTraining}: ${input.combo.overallSuccessRate}% ${L.successCol} · ${input.combo.totalAttempts} ${L.attempts} · ${L.avgLevel} ${formatLevel(input.combo.averageLevel)}`,
    )
  }
  if (g.heatParticipations > 0) {
    pdf.bodyText(
      `${L.competition}: ${g.heatParticipations} heats · ${g.heatWins} ${L.heatWins} · ${L.avgLevel} ${g.avgHeatScore?.toFixed(1) ?? '—'}`,
    )
  }
  if (input.psychology && input.psychology.checkIns > 0) {
    pdf.bodyText(
      `${L.psychology}: ${input.psychology.checkIns} check-ins · ${L.avgLevel} ${input.psychology.averageOverall?.toFixed(1) ?? '—'}/5`,
    )
  }

  if (input.sessionRows.length > 0) {
    pdf.ensureSpace(24)
    pdf.sectionTitle(L.sessionLog)
    autoTable(doc, {
      startY: pdf.y,
      margin: { left: MARGIN, right: MARGIN },
      head: [[L.date, L.mode, L.spot, L.summaryCol]],
      body: input.sessionRows.map((row) => [row.date, row.mode, row.spot, row.summary]),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 24 },
        2: { cellWidth: 28 },
        3: { cellWidth: 'auto' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableWidth: CONTENT_W,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didDrawPage: () => pdf.drawFooter(),
    })
    pdf.y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  pdf.ensureSpace(10)
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  const footerLines = doc.splitTextToSize(input.footerLine, CONTENT_W)
  doc.text(footerLines, MARGIN, pdf.y)

  return pdf.finish()
}
