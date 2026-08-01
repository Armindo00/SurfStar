import {
  customAnalyticsRange,
  defaultCustomAnalyticsRange,
  defaultCustomDateBounds,
  describeAnalyticsRange,
  normalizeCustomDateRange,
  presetAnalyticsRange,
  type AnalyticsRange,
} from '../analyticsRange'
import { ANALYTICS_PERIOD_OPTIONS, type AnalyticsPeriod } from '../teamAnalyticsStats'

type Props = {
  range: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
  disabled?: boolean
}

export function AnalyticsRangePicker({ range, onChange, disabled = false }: Props) {
  const isCustom = range.kind === 'custom'
  const defaultDates = defaultCustomDateBounds()
  const customFrom = range.kind === 'custom' ? range.fromDate : defaultDates.fromDate
  const customTo = range.kind === 'custom' ? range.toDate : defaultDates.toDate
  const customTitle = range.kind === 'custom' ? range.title : ''

  const selectPreset = (period: AnalyticsPeriod) => {
    onChange(presetAnalyticsRange(period))
  }

  const openCustom = () => {
    if (range.kind === 'custom') return
    onChange(defaultCustomAnalyticsRange())
  }

  const updateCustomDates = (fromDate: string, toDate: string) => {
    const normalized = normalizeCustomDateRange(fromDate, toDate)
    onChange(
      customAnalyticsRange(
        normalized.fromDate,
        normalized.toDate,
        range.kind === 'custom' ? range.title : customTitle,
      ),
    )
  }

  return (
    <div className="analytics-range-picker">
      <div className="chip-row chip-row--pro analytics-range-picker__presets" role="tablist" aria-label="Time range">
        {ANALYTICS_PERIOD_OPTIONS.map((option) => (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={!isCustom && range.kind === 'preset' && range.period === option.id}
            className={`chip ${!isCustom && range.kind === 'preset' && range.period === option.id ? 'chip--active' : ''}`}
            disabled={disabled}
            onClick={() => selectPreset(option.id)}
          >
            {option.shortLabel}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={isCustom}
          className={`chip ${isCustom ? 'chip--active' : ''}`}
          disabled={disabled}
          onClick={openCustom}
        >
          Custom
        </button>
      </div>

      {isCustom ? (
        <div className="analytics-range-picker__custom">
          <div className="analytics-range-picker__dates">
            <label className="field field--pro">
              <span>From</span>
              <input
                type="date"
                value={customFrom}
                disabled={disabled}
                onChange={(e) => updateCustomDates(e.target.value, customTo)}
              />
            </label>
            <label className="field field--pro">
              <span>To</span>
              <input
                type="date"
                value={customTo}
                disabled={disabled}
                onChange={(e) => updateCustomDates(customFrom, e.target.value)}
              />
            </label>
          </div>
          <label className="field field--pro analytics-range-picker__title">
            <span>Report title (optional)</span>
            <input
              type="text"
              value={customTitle}
              disabled={disabled}
              placeholder="e.g. Maldives training camp"
              onChange={(e) => onChange(customAnalyticsRange(customFrom, customTo, e.target.value))}
            />
          </label>
          <p className="muted analytics-range-picker__summary">Selected: {describeAnalyticsRange(range)}</p>
        </div>
      ) : null}
    </div>
  )
}
