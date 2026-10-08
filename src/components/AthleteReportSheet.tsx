import { useMemo, useState } from 'react'
import { useToast } from './ToastProvider'
import { AthleteReportPreview } from './AthleteReportPreview'
import {
  buildAthleteReportPdfInput,
  buildManeuverSummaries,
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
import type { AthleteHeatAnalyticsSummary } from '../heatAnalyticsStats'
import { formatShortDate, formatShortDateTime } from '../dateFormat'
import { getAppSiteUrl } from '../config'
import { formatAverageLevelValue } from '../sessionStats'
import type { AthletePeriodAnalytics } from '../teamAnalyticsStats'
import { useI18n } from '../i18n'
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
  heatAnalytics: AthleteHeatAnalyticsSummary
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
  psychology,
  onClose,
}: Props) {
  const { t, messages } = useI18n()
  const { showToast } = useToast()
  const r = messages.analytics.analyticsReport
  const [coachComment, setCoachComment] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const shareAvailable = canSharePdfFiles()
  const trimmedComment = coachComment.trim()
  const general = analytics.general
  const generatedAt = formatShortDateTime(new Date())
  const rangeLabel = describeAnalyticsRange(analytics.range)
  const reportTitle = describeAnalyticsRangeLong(analytics.range)
  const evolutionColumn = evolutionColumnLabel(analytics.range)
  const footerLine = t('analytics.analyticsReport.footerGenerated', {
    url: getAppSiteUrl(),
    date: formatShortDate(new Date()),
  })

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
        psychology,
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
      psychology,
      sessionSummaries,
      getSpot,
      evolutionColumn,
      r,
    ],
  )

  const trainingMix = useMemo(() => buildTrainingMixRows(analytics), [analytics])
  const maneuverSummaries = useMemo(() => buildManeuverSummaries(analytics), [analytics])
  const sessionRows = useMemo(
    () => buildSessionRows(sessionSummaries, getSpot),
    [sessionSummaries, getSpot],
  )
  const performanceLines = useMemo(
    () => buildPerformanceLines(general, analytics, psychology, r),
    [general, analytics, psychology, r],
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

  return (
    <div className="athlete-report-backdrop" role="presentation" onClick={onClose}>
      <div
        className="athlete-report-print-root"
        role="dialog"
        aria-modal="true"
        aria-labelledby="athlete-report-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="athlete-report-print-actions no-print">
          <label className="field field--pro athlete-report__comment-field">
            <span>{r.coachCommentsOptional}</span>
            <textarea
              rows={4}
              value={coachComment}
              placeholder={r.coachCommentsPlaceholder}
              onChange={(event) => setCoachComment(event.target.value)}
            />
            <small className="muted">{r.coachCommentsNote}</small>
          </label>
          <div className="athlete-report-print-actions__buttons">
            <button type="button" className="btn btn--ghost btn--small" onClick={onClose} disabled={pdfBusy}>
              {t('common.close')}
            </button>
            <button
              type="button"
              className="btn btn--gold btn--small"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfBusy}
            >
              {pdfBusy ? r.pdfGenerating : r.downloadPdf}
            </button>
            {shareAvailable ? (
              <button
                type="button"
                className="btn btn--secondary btn--small"
                onClick={() => void handleSharePdf()}
                disabled={pdfBusy}
              >
                {r.sharePdf}
              </button>
            ) : null}
          </div>
        </div>

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
          evolution={analytics.evolution}
          evolutionColumnLabel={evolutionColumn}
          trainingMix={trainingMix}
          maneuverSummaries={maneuverSummaries}
          performanceLines={performanceLines}
          sessionRows={sessionRows}
          r={r}
          formatAvgLevel={formatAverageLevelValue}
        />
      </div>
    </div>
  )
}
