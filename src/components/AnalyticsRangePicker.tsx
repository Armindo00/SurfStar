import { useEffect, useId, useRef, useState } from 'react'
import { useI18n } from '../i18n'
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
  /** Compact secondary toolbar (Option C). */
  variant?: 'chips' | 'toolbar'
}

export function AnalyticsRangePicker({
  range,
  onChange,
  disabled = false,
  variant = 'chips',
}: Props) {
  const { t } = useI18n()
  const isCustom = range.kind === 'custom'
  const defaultDates = defaultCustomDateBounds()
  const customFrom = range.kind === 'custom' ? range.fromDate : defaultDates.fromDate
  const customTo = range.kind === 'custom' ? range.toDate : defaultDates.toDate
  const customTitle = range.kind === 'custom' ? range.title : ''
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const selectPreset = (period: AnalyticsPeriod) => {
    onChange(presetAnalyticsRange(period))
    setMenuOpen(false)
  }

  const openCustom = () => {
    if (range.kind !== 'custom') {
      onChange(defaultCustomAnalyticsRange())
    }
    setMenuOpen(false)
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

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const root = rootRef.current
      if (!root || !(event.target instanceof Node)) return
      if (!root.contains(event.target)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const customFields = isCustom ? (
    <div className="analytics-range-picker__custom">
      <div className="analytics-range-picker__dates">
        <label className="field field--pro">
          <span>{t('analytics.rangePicker.from')}</span>
          <input
            type="date"
            value={customFrom}
            disabled={disabled}
            onChange={(e) => updateCustomDates(e.target.value, customTo)}
          />
        </label>
        <label className="field field--pro">
          <span>{t('analytics.rangePicker.to')}</span>
          <input
            type="date"
            value={customTo}
            disabled={disabled}
            onChange={(e) => updateCustomDates(customFrom, e.target.value)}
          />
        </label>
      </div>
      <label className="field field--pro analytics-range-picker__title">
        <span>{t('analytics.rangePicker.reportTitle')}</span>
        <input
          type="text"
          value={customTitle}
          disabled={disabled}
          placeholder={t('analytics.rangePicker.reportTitlePlaceholder')}
          onChange={(e) => onChange(customAnalyticsRange(customFrom, customTo, e.target.value))}
        />
      </label>
      <p className="muted analytics-range-picker__summary">
        {t('analytics.rangePicker.selected', { label: describeAnalyticsRange(range) })}
      </p>
    </div>
  ) : null

  if (variant === 'toolbar') {
    return (
      <div className="analytics-range-picker analytics-range-picker--toolbar" ref={rootRef}>
        <div className="analytics-range-toolbar">
          <span className="analytics-range-toolbar__label">{t('analytics.timeRange')}</span>
          <div className="analytics-range-toolbar__control">
            <button
              type="button"
              className="analytics-range-toolbar__trigger"
              aria-haspopup="listbox"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              disabled={disabled}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <span>{describeAnalyticsRange(range)}</span>
              <span className="analytics-range-toolbar__caret" aria-hidden="true">
                ▾
              </span>
            </button>
            {menuOpen ? (
              <ul
                id={menuId}
                className="analytics-range-toolbar__menu"
                role="listbox"
                aria-label={t('analytics.timeRange')}
              >
                {ANALYTICS_PERIOD_OPTIONS.map((option) => {
                  const selected =
                    !isCustom && range.kind === 'preset' && range.period === option.id
                  return (
                    <li key={option.id} role="option" aria-selected={selected}>
                      <button
                        type="button"
                        className={
                          selected
                            ? 'analytics-range-toolbar__option analytics-range-toolbar__option--active'
                            : 'analytics-range-toolbar__option'
                        }
                        disabled={disabled}
                        onClick={() => selectPreset(option.id)}
                      >
                        {option.label}
                      </button>
                    </li>
                  )
                })}
                <li role="option" aria-selected={isCustom}>
                  <button
                    type="button"
                    className={
                      isCustom
                        ? 'analytics-range-toolbar__option analytics-range-toolbar__option--active'
                        : 'analytics-range-toolbar__option'
                    }
                    disabled={disabled}
                    onClick={openCustom}
                  >
                    {t('analytics.rangePicker.custom')}
                  </button>
                </li>
              </ul>
            ) : null}
          </div>
        </div>
        {customFields}
      </div>
    )
  }

  return (
    <div className="analytics-range-picker">
      <div
        className="chip-row chip-row--pro analytics-range-picker__presets"
        role="tablist"
        aria-label={t('analytics.timeRange')}
      >
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
          {t('analytics.rangePicker.custom')}
        </button>
      </div>
      {customFields}
    </div>
  )
}
