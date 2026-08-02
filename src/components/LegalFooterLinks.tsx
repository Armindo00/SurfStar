import { getComplaintsBookUrl } from '../legalConfig'
import { useI18n } from '../i18n'

type Props = {
  className?: string
  onPrivacy?: () => void
  onTerms?: () => void
  layout?: 'inline' | 'stack'
}

export function LegalFooterLinks({ className, onPrivacy, onTerms, layout = 'inline' }: Props) {
  const { messages } = useI18n()
  const l = messages.components.legalFooter
  const complaintsUrl = getComplaintsBookUrl()

  return (
    <nav
      className={layout === 'stack' ? `legal-footer-links legal-footer-links--stack ${className ?? ''}` : `legal-footer-links ${className ?? ''}`}
      aria-label={l.ariaLabel}
    >
      {onPrivacy ? (
        <button type="button" className="legal-footer-links__btn" onClick={onPrivacy}>
          {l.privacyPolicy}
        </button>
      ) : (
        <a href="/privacy" className="legal-footer-links__btn">
          {l.privacyPolicy}
        </a>
      )}
      {onTerms ? (
        <button type="button" className="legal-footer-links__btn" onClick={onTerms}>
          {l.termsOfService}
        </button>
      ) : (
        <a href="/terms" className="legal-footer-links__btn">
          {l.termsOfService}
        </a>
      )}
      <a
        href={complaintsUrl}
        className="legal-footer-links__btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        {l.complaintsBook}
      </a>
    </nav>
  )
}
