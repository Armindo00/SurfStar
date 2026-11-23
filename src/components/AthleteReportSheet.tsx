import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useToast } from './ToastProvider'
import { AthleteReportPreview } from './AthleteReportPreview'
import {
  buildAthleteReportPdfInput,
  buildPerformanceLines,
  buildSessionRows,
  buildTrainingMixRows,
} from '../athleteReportPdfModel'
import {
  describeAnalyticsRange,
  describeAnalyticsRangeLong,
  evolutionColumnLabel,
} from '../analyticsRange'
import type { AthletePsychologyAnalytics } from '../athletePsychologyStats'
import type { AthleteSessionSummary } from '../athleteStats'
import { formatShortDate, formatShortDateTime } from '../dateFormat'
import { getAppSiteUrl } from '../config'
import { formatAverageLevelValue } from '../sessionStats'
import type { AthletePeriodAnalytics } from '../teamAnalyticsStats'
import { useI18n } from '../i18n'
import { psychologyQuestionLabelKey } from '../psychologySurvey'
import type { SurfSpot } from '../types'
import {
  athleteReportPdfFilename,
  downloadPdfBlob,
  generateAthleteReportPdfBlob,
  canSharePdfFiles,
  sharePdfBlob,
} from '../exportAthleteReportPdf'

type Props = {
  athleteName: string
  coachName: string
  organizationName?: string | null
  analytics: AthletePeriodAnalytics
  sessionSummaries: AthleteSessionSummary[]
  getSpot: (id: string) => SurfSpot | undefined
  athleteId: string
  psychology?: AthletePsychologyAnalytics | null
  onClose: () => void
}

export function AthleteReportSheet({
  athleteName,
  coachName,
  organizationName,
  analytics,
  sessionSummaries,
  getSpot,
  athleteId,
  psychology,
  onClose,
}: Props) {
  const { t, messages } = useI18n()
  const { showToast } = useToast()
  const r = messages.analytics.analyticsReport
  const [coachComment, setCoachComment] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [generatedAt] = useState(() => formatShortDateTime(new Date()))
  const [generatedDateLabel] = useState(() => formatShortDate(new Date()))
  const shareAvailable = canSharePdfFiles()
  const trimmedComment = coachComment.trim()
  const general = analytics.general
  const rangeLabel = describeAnalyticsRange(analytics.range)
  const reportTitle = describeAnalyticsRangeLong(analytics.range)
  const evolutionColumn = evolutionColumnLabel(analytics.range)
  const footerLine = t('analytics.analyticsReport.footerGenerated', {
    url: getAppSiteUrl(),
    date: generatedDateLabel,
  })

  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollY = window.scrollY
    const { overflow, position, top, width, left, right } = document.body.style
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = overflow
      document.body.style.position = position
      document.body.style.top = top
      document.body.style.left = left
      document.body.style.right = right
      document.body.style.width = width
      window.scrollTo(0, scrollY)
    }
  }, [])

  // Nested overflow-x regions (if any remain) eat vertical wheel — forward to the sheet body.
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return
      const target = event.target
      if (!(target instanceof Element)) return
      if (!root.contains(target)) return
      if (target === root || target.classList.contains('athlete-report-sheet__body')) return

      let node: Element | null = target
      while (node && node !== root) {
        const style = window.getComputedStyle(node)
        const oy = style.overflowY
        const canScrollY =
          (oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight + 1
        if (canScrollY) return
        node = node.parentElement
      }

      root.scrollTop += event.deltaY
      event.preventDefault()
    }

    root.addEventListener('wheel', onWheel, { passive: false, capture: true })
    return () => root.removeEventListener('wheel', onWheel, true)
  }, [])

  const localizedPsychology = useMemo(() => {
    if (!psychology) return null
    return {
      ...psychology,
      byQuestion: psychology.byQuestion.map((entry) => ({
        ...entry,
        label: t(psychologyQuestionLabelKey(entry.key)),
      })),
    }
  }, [psychology, t])

  const pdfPayload = useMemo(
    () =>
      buildAthleteReportPdfInput({
        athleteName,
        coachName,
        organizationName,
        rangeLabel,
        reportTitle,
        generatedAt,
        footerLine,
        coachComment: trimmedComment || undefined,
        analytics,
        athleteId,
        psychology: localizedPsychology,
        sessionSummaries,
        getSpot,
        evolutionColumnLabel: evolutionColumn,
        labels: r,
      }),
    [
      athleteName,
      coachName,
      organizationName,
      rangeLabel,
      reportTitle,
      generatedAt,
      footerLine,
      trimmedComment,
      analytics,
      athleteId,
      localizedPsychology,
      sessionSummaries,
      getSpot,
      evolutionColumn,
      r,
    ],
  )

  const trainingMix = useMemo(() => buildTrainingMixRows(analytics), [analytics])
  const sessionRows = useMemo(
    () => buildSessionRows(sessionSummaries, getSpot),
    [sessionSummaries, getSpot],
  )
  const performanceLines = useMemo(
    () => buildPerformanceLines(general, analytics, r),
    [general, analytics, r],
  )

  const pdfFilename = athleteReportPdfFilename(athleteName)
  const pdfShareTitle = `${athleteName} — ${reportTitle}`

  async function buildPdfBlob() {
    setPdfBusy(true)
    try {
      return await generateAthleteReportPdfBlob(pdfPayload)
    } catch {
      showToast(r.pdfExportFailed, 'error')
      return null
    } finally {
      setPdfBusy(false)
    }
  }

  async function handleDownloadPdf() {
    const blob = await buildPdfBlob()
    if (blob) downloadPdfBlob(blob, pdfFilename)
  }

  async function handleSharePdf() {
    if (!shareAvailable) {
      showToast(r.pdfShareUnavailable, 'info')
      return
    }
    const blob = await buildPdfBlob()
    if (!blob) return
    try {
      const result = await sharePdfBlob(blob, pdfFilename, pdfShareTitle)
      if (result === 'unavailable') showToast(r.pdfShareUnavailable, 'info')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast(r.pdfExportFailed, 'error')
    }
  }

  return createPortal(
    <div className="athlete-report-backdrop" role="presentation" onClick={onClose}>
      <div
        className="athlete-report-print-root athlete-report-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="athlete-report-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="athlete-report-sheet__header">
          <button
            type="button"
            className="btn btn--ghost btn--small athlete-report-sheet__close"
            onClick={onClose}
            disabled={pdfBusy}
          >
            {t('common.close')}
          </button>
          <div className="athlete-report-sheet__heading">
            <p className="athlete-report-sheet__eyebrow">{t('analytics.pdfReport')}</p>
            <h2 id="athlete-report-sheet-title">{athleteName}</h2>
            <p className="athlete-report-sheet__subtitle muted">{reportTitle}</p>
          </div>
        </header>

        <div className="athlete-report-sheet__body" ref={bodyRef}>
          <details className="athlete-report-sheet__comments">
            <summary>{r.coachCommentsOptional}</summary>
            <label className="field field--pro athlete-report__comment-field">
              <textarea
                rows={3}
                value={coachComment}
                placeholder={r.coachCommentsPlaceholder}
                onChange={(event) => setCoachComment(event.target.value)}
              />
              <small className="muted">{r.coachCommentsNote}</small>
            </label>
          </details>

          <p className="athlete-report-sheet__preview-label">{r.previewLabel}</p>
          <AthleteReportPreview
            athleteName={athleteName}
            coachName={coachName}
            organizationName={organizationName}
            rangeLabel={rangeLabel}
            reportTitle={reportTitle}
            generatedAt={generatedAt}
            footerLine={footerLine}
            coachComment={trimmedComment || undefined}
            general={general}
            evolutionCharts={pdfPayload.evolutionCharts}
            maneuverLabels={pdfPayload.maneuverLabels}
            technicalSideCharts={pdfPayload.technicalSideCharts}
            comboSideCharts={pdfPayload.comboSideCharts}
            trainingMix={trainingMix}
            performanceLines={performanceLines}
            sessionRows={sessionRows}
            r={r}
            formatAvgLevel={formatAverageLevelValue}
          />
        </div>

        <footer className="athlete-report-sheet__footer">
          <button
            type="button"
            className="btn btn--gold btn--block"
            onClick={() => void handleDownloadPdf()}
            disabled={pdfBusy}
          >
            {pdfBusy ? r.pdfGenerating : r.downloadPdf}
          </button>
          {shareAvailable ? (
            <button
              type="button"
              className="btn btn--secondary btn--block"
              onClick={() => void handleSharePdf()}
              disabled={pdfBusy}
            >
              {r.sharePdf}
            </button>
          ) : null}
        </footer>
      </div>
    </div>,
    document.body,
  )
}
