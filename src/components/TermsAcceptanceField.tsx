import { useI18n } from '../i18n'

type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  onPrivacy: () => void
  onTerms: () => void
}

export function TermsAcceptanceField({ checked, onChange, onPrivacy, onTerms }: Props) {
  const { messages } = useI18n()
  const t = messages.components.termsAcceptance

  return (
    <label className="auth-terms">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span>
        {t.prefix}{' '}
        <button
          type="button"
          className="auth-terms__link"
          onClick={(e) => {
            e.preventDefault()
            onTerms()
          }}
        >
          {t.termsLink}
        </button>{' '}
        {t.and}{' '}
        <button
          type="button"
          className="auth-terms__link"
          onClick={(e) => {
            e.preventDefault()
            onPrivacy()
          }}
        >
          {t.privacyLink}
        </button>
        {t.suffix}
      </span>
    </label>
  )
}
