type Props = {
  checked: boolean
  onChange: (checked: boolean) => void
  onPrivacy: () => void
  onTerms: () => void
}

export function TermsAcceptanceField({ checked, onChange, onPrivacy, onTerms }: Props) {
  return (
    <label className="auth-terms">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
      />
      <span>
        I agree to the{' '}
        <button
          type="button"
          className="auth-terms__link"
          onClick={(e) => {
            e.preventDefault()
            onTerms()
          }}
        >
          Terms of Service
        </button>{' '}
        and{' '}
        <button
          type="button"
          className="auth-terms__link"
          onClick={(e) => {
            e.preventDefault()
            onPrivacy()
          }}
        >
          Privacy Policy
        </button>
        .
      </span>
    </label>
  )
}
