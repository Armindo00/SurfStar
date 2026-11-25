import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { AthleteGeneralStats } from './athleteStats'
import type { AthletePsychologyAnalytics } from './athletePsychologyStats'
import type { AthleteHeatAnalyticsSummary } from './heatAnalyticsStats'
import type { ComboSessionStatsSnapshot, SessionStatsSnapshot } from './sessionStats'
import type { EvolutionPoint } from './teamAnalyticsStats'
import type { PdfEvolutionCharts, SideCompareChart } from './athleteReportPdfEvolution'
import {
  drawEvolutionSection,
  drawOpenVsCloseChart,
  drawSideCompareChart,
  drawWaveMatrix,
  type ChartLayout,
  type PdfWaveMatrixLabels,
} from './athleteReportPdfDraw'
import type { WaveMatrixCounts } from './sessionStats'

const PAGE_W = 210
const PAGE_H = 297
const MARGIN = 14
const CONTENT_W = PAGE_W - MARGIN * 2

const COLOR_TEXT = [15, 23, 42] as const
const COLOR_MUTED = [100, 116, 139] as const
const COLOR_PRIMARY = [10, 106, 148] as const
const COLOR_BAR_BG = [226, 232, 240] as const
const COLOR_SUCCESS = [4, 120, 87] as const
const COLOR_DANGER = [180, 35, 24] as const

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
  psychologyCheckins: string
  psychologyStandouts: string
  psychologyHighest: string
  psychologyNeedsAttention: string
  psychologyAthleteNotes: string
  psychologyCheckInsLabel: string
  psychologyAvgLabel: string
  psychologyResponseLabel: string
  questionAverages: string
  question: string
  average: string
  chartLegendSuccess: string
  chartLegendPotential: string
  pdfChartPotentialEvolution: string
  pdfChartManeuverSuccessEvolution: string
  pdfChartManeuverLevelEvolution: string
  pdfChartComboSuccessEvolution: string
  pdfChartComboLevelEvolution: string
  pdfChartSuccessVsOverallLevel: string
  pdfChartSuccessAvgLevel: string
  pdfChartOverallManeuverLevel: string
  pdfChartSuccessRatesTitle: string
  pdfTechnicalSideCharts: string
  pdfComboSideCharts: string
  frontside: string
  backside: string
  maneuvers: string
  attempts: string
  page: string
  executiveLabel: string
  annexLabel: string
  overallAvgLevel: string
  periodDecision: string
  periodDecisionHint: string
  periodDecisionEmpty: string
  strengthsAttentionTitle: string
  strengths: string
  attention: string
  domainSummaryTitle: string
  domainCol: string
  keyMetricCol: string
  valueCol: string
  readingCol: string
  domainWaves: string
  domainHeat: string
  readingStable: string
  readingGood: string
  readingOk: string
  readingWatch: string
  readingThin: string
  annexTitle: string
  winRate: string
  clutchHeat: string
  earlyTenPoints: string
  technicalSubtitle: string
  competitionHeatsRhythm: string
  openingEarlyRhythm: string
  closingUnderPressure: string
  clutchDelta: string
  bestWaveFirst5Avg: string
  bestWaveLast5Avg: string
  timeToFirstWaveAvg: string
  timeToTwoMajorAvg: string
  openVsCloseTitle: string
  openShort: string
  closeShort: string
  heatLog: string
  heat: string
  total: string
  place: string
  yes: string
  no: string
  winSuffix: string
}

export type TrainingMixRow = { label: string; count: number }
export type ManeuverSummaryRow = { label: string; attempts: number; rate: number | null }
export type ReportCallout = { label: string; value: string }
export type DomainSummaryRow = { domain: string; metric: string; value: string; reading: string }

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
  heatAnalytics?: AthleteHeatAnalyticsSummary | null
  strengths: ReportCallout[]
  attention: ReportCallout[]
  comparisonNotes: string[]
  comparisonTitle: string
  waveMatrix: {
    counts: WaveMatrixCounts
    totalWaves: number
    labels: PdfWaveMatrixLabels
  } | null
  domainRows: DomainSummaryRow[]
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

  /** Force a fresh page so a topic never starts mid-page. */
  startTopicPage() {
    this.drawFooter()
    this.doc.addPage()
    this.y = MARGIN
  }

  /**
   * Start a major report topic on its own page (unless already at the top
   * of an unused page, e.g. right after startTopicPage).
   */
  topicSection(title: string) {
    if (this.y > MARGIN + 1) {
      this.startTopicPage()
    }
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

function drawPsychologyHighlightsSection(
  pdf: PdfDoc,
  psychology: AthletePsychologyAnalytics,
  L: AthleteReportPdfLabels,
) {
  const { doc } = pdf
  pdf.topicSection(L.psychologyCheckins)

  pdf.kpiGrid([
    { label: L.psychologyCheckInsLabel, value: String(psychology.checkIns) },
    {
      label: L.psychologyAvgLabel,
      value: psychology.averageOverall?.toFixed(1) ?? '—',
    },
    {
      label: L.psychologyResponseLabel,
      value: psychology.feedbackRate === null ? '—' : `${psychology.feedbackRate}%`,
    },
  ])

  const ranked = [...psychology.byQuestion].sort((a, b) => b.average - a.average)
  const highest = ranked[0]
  const lowest = ranked[ranked.length - 1]
  if (highest && lowest) {
    pdf.ensureSpace(28)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXT)
    doc.text(L.psychologyStandouts, MARGIN, pdf.y)
    pdf.y += 4

    const gap = 3
    const boxW = (CONTENT_W - gap) / 2
    const boxH = 16
    const boxes = [
      {
        x: MARGIN,
        title: L.psychologyHighest,
        body: `${highest.label} · ${highest.average.toFixed(1)}`,
        accent: COLOR_SUCCESS,
      },
      {
        x: MARGIN + boxW + gap,
        title: L.psychologyNeedsAttention,
        body: `${lowest.label} · ${lowest.average.toFixed(1)}`,
        accent: COLOR_DANGER,
      },
    ] as const

    for (const box of boxes) {
      doc.setDrawColor(...COLOR_BAR_BG)
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(box.x, pdf.y, boxW, boxH, 2, 2, 'FD')
      const [ar, ag, ab] = box.accent
      doc.setFillColor(ar, ag, ab)
      doc.rect(box.x, pdf.y, 1.2, boxH, 'F')
      doc.setFontSize(7)
      doc.setTextColor(...COLOR_MUTED)
      doc.text(box.title, box.x + 4, pdf.y + 5)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...COLOR_TEXT)
      const lines = doc.splitTextToSize(box.body, boxW - 7)
      doc.text(lines, box.x + 4, pdf.y + 10)
      doc.setFont('helvetica', 'normal')
    }
    pdf.y += boxH + 5
  }

  if (psychology.byQuestion.length > 0) {
    pdf.ensureSpace(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXT)
    doc.text(L.questionAverages, MARGIN, pdf.y)
    pdf.y += 3

    autoTable(doc, {
      startY: pdf.y,
      margin: { left: MARGIN, right: MARGIN },
      head: [[L.question, L.average]],
      body: psychology.byQuestion.map((entry) => [entry.label, entry.average.toFixed(1)]),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: CONTENT_W - 22 },
        1: { cellWidth: 22, halign: 'right' },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      tableWidth: CONTENT_W,
      showHead: 'everyPage',
      rowPageBreak: 'avoid',
      didDrawPage: () => pdf.drawFooter(),
    })
    pdf.y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  }

  const notes = psychology.timeline.filter((row) => row.feedback.writtenNote?.trim())
  if (notes.length > 0) {
    pdf.ensureSpace(16)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...COLOR_TEXT)
    doc.text(L.psychologyAthleteNotes, MARGIN, pdf.y)
    pdf.y += 4

    for (const row of notes.slice(0, 8)) {
      const dateLabel = row.feedback.submittedAt.slice(0, 10)
      const note = row.feedback.writtenNote!.trim()
      const score =
        row.averageScore === null ? '' : ` · ${row.averageScore.toFixed(1)}/5`
      pdf.bodyText(`${dateLabel}${score} — ${note}`)
    }
  }
}

function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''))
}

function drawCalloutColumns(
  pdf: PdfDoc,
  leftTitle: string,
  leftItems: ReportCallout[],
  rightTitle: string,
  rightItems: ReportCallout[],
) {
  const { doc } = pdf
  const gap = 3
  const boxW = (CONTENT_W - gap) / 2
  const lineH = 5
  const leftH = 8 + Math.max(leftItems.length, 1) * lineH
  const rightH = 8 + Math.max(rightItems.length, 1) * lineH
  const boxH = Math.max(leftH, rightH, 18)
  pdf.ensureSpace(boxH + 4)

  const columns = [
    { x: MARGIN, title: leftTitle, items: leftItems, accent: COLOR_SUCCESS },
    { x: MARGIN + boxW + gap, title: rightTitle, items: rightItems, accent: COLOR_DANGER },
  ] as const

  for (const col of columns) {
    doc.setDrawColor(...COLOR_BAR_BG)
    doc.setFillColor(255, 255, 255)
    doc.roundedRect(col.x, pdf.y, boxW, boxH, 2, 2, 'FD')
    const [ar, ag, ab] = col.accent
    doc.setFillColor(ar, ag, ab)
    doc.rect(col.x, pdf.y, 1.2, boxH, 'F')
    doc.setFontSize(7)
    doc.setTextColor(...COLOR_MUTED)
    doc.text(col.title, col.x + 4, pdf.y + 5)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...COLOR_TEXT)
    let ty = pdf.y + 11
    if (col.items.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...COLOR_MUTED)
      doc.text('—', col.x + 4, ty)
    } else {
      for (const item of col.items) {
        doc.text(`${item.label}  ${item.value}`, col.x + 4, ty)
        ty += lineH
      }
    }
    doc.setFont('helvetica', 'normal')
  }
  pdf.y += boxH + 5
}

function drawHeatAnnexSection(
  pdf: PdfDoc,
  heat: AthleteHeatAnalyticsSummary,
  L: AthleteReportPdfLabels,
) {
  if (heat.heatsTotal <= 0) return
  const { doc } = pdf
  pdf.topicSection(L.competitionHeatsRhythm)
  pdf.kpiGrid([
    { label: L.heatWins, value: String(heat.rows.filter((r) => r.won).length) },
    { label: L.avgLevel, value: heat.avgHeatScore?.toFixed(1) ?? '—' },
    { label: L.earlyTenPoints, value: formatRate(heat.earlyTenPointsRate) },
    { label: L.clutchDelta, value: heat.clutchDelta === null ? '—' : `${heat.clutchDelta > 0 ? '+' : ''}${heat.clutchDelta.toFixed(1)}` },
    { label: L.timeToFirstWaveAvg, value: heat.avgTimeToFirstWaveMin === null ? '—' : `${heat.avgTimeToFirstWaveMin.toFixed(1)}'` },
    { label: L.timeToTwoMajorAvg, value: heat.avgTimeToTwoMajorMin === null ? '—' : `${heat.avgTimeToTwoMajorMin.toFixed(1)}'` },
  ])

  if (heat.heatsWithTiming > 0) {
    drawOpenVsCloseChart(
      pdf.chartLayout(),
      L.openVsCloseTitle,
      L.openShort,
      L.closeShort,
      heat.avgBestWaveOpening,
      heat.avgBestWaveClosing,
    )
  }

  if (heat.rows.length === 0) return
  pdf.ensureSpace(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT)
  doc.text(L.heatLog, MARGIN, pdf.y)
  pdf.y += 3

  autoTable(doc, {
    startY: pdf.y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[L.heat, L.total, L.place, L.earlyTenPoints, L.clutchDelta]],
    body: heat.rows.slice(0, 12).map((row) => [
      row.heatLabel,
      row.total.toFixed(1),
      `${row.placement}${row.won ? L.winSuffix : ''}`,
      row.hasTimerData ? (row.reachedTenPointsInEarlyWindow ? L.yes : L.no) : '—',
      row.bestWaveClosing === null || row.bestWaveOpening === null
        ? '—'
        : `${(row.bestWaveClosing - row.bestWaveOpening).toFixed(1)}`,
    ]),
    styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableWidth: CONTENT_W,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawPage: () => pdf.drawFooter(),
  })
  pdf.y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
}

export async function buildAthleteReportPdfBlob(input: AthleteReportPdfInput): Promise<Blob> {
  const logo = await loadLogoDataUrl()
  const pdf = new PdfDoc(input.athleteName, input.labels)
  const { doc } = pdf
  const L = input.labels
  const g = input.general

  const headerTop = pdf.y
  const logoSize = 12
  const textX = MARGIN + (logo ? logoSize + 3.5 : 0)
  const textMaxW = PAGE_W - MARGIN - textX

  if (logo) {
    doc.addImage(logo, 'PNG', MARGIN, headerTop, logoSize, logoSize)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...COLOR_TEXT)
  const nameLines = doc.splitTextToSize(input.athleteName, textMaxW)
  const nameLineH = 5.8
  doc.text(nameLines, textX, headerTop + 5.2)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_MUTED)
  const eyebrowY = headerTop + 5.2 + nameLines.length * nameLineH + 0.8
  const eyebrow = `${L.sheetEyebrow} · ${L.executiveLabel}`
  doc.text(doc.splitTextToSize(eyebrow, textMaxW), textX, eyebrowY)

  doc.setFontSize(10)
  doc.setTextColor(...COLOR_TEXT)
  const titleY = eyebrowY + 5.2
  const titleLines = doc.splitTextToSize(input.reportTitle, textMaxW)
  doc.text(titleLines, textX, titleY)

  const textBottom = titleY + Math.max(titleLines.length - 1, 0) * 4.2 + 6
  const logoBottom = logo ? headerTop + logoSize + 5 : headerTop
  pdf.y = Math.max(textBottom, logoBottom)

  const meta: { label: string; value: string }[] = [
    { label: L.period, value: input.rangeLabel },
    { label: L.coach, value: input.coachName },
    { label: L.generated, value: input.generatedAt },
  ]
  if (input.organizationName) {
    meta.splice(2, 0, { label: L.organization, value: input.organizationName })
  }
  pdf.metaRow(meta.slice(0, 4))

  // —— Executive hero ——
  pdf.ensureSpace(28)
  const heroGap = 3
  const heroW = (CONTENT_W - heroGap) / 2
  const heroH = 24
  doc.setDrawColor(...COLOR_BAR_BG)
  doc.setFillColor(247, 251, 254)
  doc.roundedRect(MARGIN, pdf.y, heroW, heroH, 2, 2, 'FD')
  doc.roundedRect(MARGIN + heroW + heroGap, pdf.y, heroW, heroH, 2, 2, 'FD')

  doc.setFontSize(7)
  doc.setTextColor(...COLOR_MUTED)
  doc.text(L.overallAvgLevel, MARGIN + 4, pdf.y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...COLOR_PRIMARY)
  doc.text(formatLevel(g.avgOverallManeuverLevel), MARGIN + 4, pdf.y + 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...COLOR_MUTED)
  const subtitle = interpolate(L.technicalSubtitle, {
    level: formatLevel(g.avgTechnicalManeuverLevel),
    combo: formatLevel(g.avgComboLevel),
    sessions: g.totalTrainings,
  })
  doc.text(doc.splitTextToSize(subtitle, heroW - 8), MARGIN + 4, pdf.y + 19)

  doc.setFontSize(7)
  doc.text(L.periodDecision, MARGIN + heroW + heroGap + 4, pdf.y + 5)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_TEXT)
  const decision = input.coachComment?.trim() || L.periodDecisionEmpty
  doc.text(doc.splitTextToSize(decision, heroW - 8), MARGIN + heroW + heroGap + 4, pdf.y + 12)
  doc.setFont('helvetica', 'normal')
  pdf.y += heroH + 6

  // —— Factual comparison notes (no coaching advice) ——
  if (input.comparisonNotes.length > 0) {
    pdf.sectionTitle(input.comparisonTitle || L.strengthsAttentionTitle)
    for (const note of input.comparisonNotes) {
      pdf.bodyText(`• ${note}`)
    }
  } else if (input.strengths.length > 0 || input.attention.length > 0) {
    pdf.sectionTitle(L.strengthsAttentionTitle)
    drawCalloutColumns(pdf, L.strengths, input.strengths, L.attention, input.attention)
  }

  // —— Domain summary (metrics only — coach interprets) ——
  pdf.sectionTitle(L.domainSummaryTitle)
  autoTable(doc, {
    startY: pdf.y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[L.domainCol, L.keyMetricCol, L.valueCol]],
    body: input.domainRows.map((row) => [row.domain, row.metric, row.value]),
    styles: { fontSize: 8, cellPadding: 2.2, overflow: 'linebreak' },
    headStyles: { fillColor: [226, 232, 240], textColor: [51, 65, 85], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    tableWidth: CONTENT_W,
    showHead: 'everyPage',
    rowPageBreak: 'avoid',
    didDrawPage: () => pdf.drawFooter(),
  })
  pdf.y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  if (input.coachComment?.trim()) {
    pdf.sectionTitle(L.coachComments)
    pdf.bodyText(input.coachComment.trim())
  }

  // —— Annex: wave matrix ——
  if (input.waveMatrix && input.waveMatrix.totalWaves > 0) {
    pdf.startTopicPage()
    drawWaveMatrix(
      pdf.chartLayout(),
      input.waveMatrix.counts,
      input.waveMatrix.totalWaves,
      input.waveMatrix.labels,
    )
  }

  // —— Annex: one topic per page (no mid-page topic starts) ——
  const hasTechnicalTopic = Boolean(input.technical) || input.technicalSideCharts.length > 0
  if (hasTechnicalTopic) {
    pdf.startTopicPage()
    pdf.topicSection(L.pdfTechnicalSideCharts)
    if (input.technical) {
      pdf.bodyText(
        `${L.technicalTraining}: ${input.technical.overallSuccessRate}% ${L.successCol} · ${input.technical.totalManeuvers} ${L.attempts} · ${L.avgLevel} ${formatLevel(input.technical.averageLevel)}`,
      )
    }
    for (const chart of input.technicalSideCharts) {
      drawSideCompareChart(pdf.chartLayout(), chart, {
        success: L.successCol,
        level: L.avgLevel,
        frontside: L.frontside,
        backside: L.backside,
      })
    }
  }

  const hasComboTopic = Boolean(input.combo) || input.comboSideCharts.length > 0
  if (hasComboTopic) {
    pdf.startTopicPage()
    pdf.topicSection(L.pdfComboSideCharts)
    if (input.combo) {
      pdf.bodyText(
        `${L.comboTraining}: ${input.combo.overallSuccessRate}% ${L.successCol} · ${input.combo.totalAttempts} ${L.attempts} · ${L.avgLevel} ${formatLevel(input.combo.averageLevel)}`,
      )
    }
    for (const chart of input.comboSideCharts) {
      drawSideCompareChart(pdf.chartLayout(), chart, {
        success: L.successCol,
        level: L.avgLevel,
        frontside: L.frontside,
        backside: L.backside,
      })
    }
  }

  if (input.heatAnalytics && input.heatAnalytics.heatsTotal > 0) {
    pdf.startTopicPage()
    drawHeatAnnexSection(pdf, input.heatAnalytics, L)
  }

  if (input.psychology && input.psychology.checkIns > 0) {
    pdf.startTopicPage()
    drawPsychologyHighlightsSection(pdf, input.psychology, L)
  }

  if (input.trainingMix.length > 0) {
    pdf.startTopicPage()
    pdf.topicSection(L.trainingMix)
    pdf.drawHorizontalBars(input.trainingMix)
  }

  if (input.sessionRows.length > 0) {
    pdf.startTopicPage()
    pdf.topicSection(L.sessionLog)
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

  if (input.evolutionCharts.periodLabels.length > 0) {
    pdf.startTopicPage()
    pdf.topicSection(L.evolution)
    drawEvolutionSection(pdf.chartLayout(), input.evolutionCharts, input.maneuverLabels, {
      potential: L.pdfChartPotentialEvolution,
      maneuverSuccess: L.pdfChartManeuverSuccessEvolution,
      maneuverLevel: L.pdfChartManeuverLevelEvolution,
      comboSuccess: L.pdfChartComboSuccessEvolution,
      comboLevel: L.pdfChartComboLevelEvolution,
      successVsOverallLevel: L.pdfChartSuccessVsOverallLevel,
      successAvgLevel: L.pdfChartSuccessAvgLevel,
      overallManeuverLevel: L.pdfChartOverallManeuverLevel,
      successRatesTitle: L.pdfChartSuccessRatesTitle,
    })
  }

  pdf.ensureSpace(10)
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_MUTED)
  const footerLines = doc.splitTextToSize(input.footerLine, CONTENT_W)
  doc.text(footerLines, MARGIN, pdf.y)

  return pdf.finish()
}
