import { useI18n } from '../../i18n'

type Option<T extends string> = {
  value: T
  label: string
  count?: number
}

type Props<T extends string> = {
  label?: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  filterAriaLabel?: string
}

export function AdminFilterPills<T extends string>({
  label,
  value,
  options,
  onChange,
  filterAriaLabel,
}: Props<T>) {
  const { messages } = useI18n()
  const filterFallback = messages.ui.admin.filter

  return (
    <div className="admin-filter-pills">
      {label ? <span className="admin-filter-pills__label">{label}</span> : null}
      <div className="admin-filter-pills__row" role="tablist" aria-label={label ?? filterAriaLabel ?? filterFallback}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={value === option.value}
            className={
              value === option.value ? 'admin-filter-pills__btn admin-filter-pills__btn--active' : 'admin-filter-pills__btn'
            }
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count != null && option.count > 0 ? (
              <span className="admin-filter-pills__count">{option.count}</span>
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}
