import { getComplaintsBookUrl } from '../legalConfig'

type Props = {
  className?: string
  onPrivacy?: () => void
  onTerms?: () => void
  layout?: 'inline' | 'stack'
}

export function LegalFooterLinks({ className, onPrivacy, onTerms, layout = 'inline' }: Props) {
  const complaintsUrl = getComplaintsBookUrl()

  return (
    <nav
      className={layout === 'stack' ? `legal-footer-links legal-footer-links--stack ${className ?? ''}` : `legal-footer-links ${className ?? ''}`}
      aria-label="Legal"
    >
      {onPrivacy ? (
        <button type="button" className="legal-footer-links__btn" onClick={onPrivacy}>
          Privacy Policy
        </button>
      ) : (
        <a href="/privacy" className="legal-footer-links__btn">
          Privacy Policy
        </a>
      )}
      {onTerms ? (
        <button type="button" className="legal-footer-links__btn" onClick={onTerms}>
          Terms of Service
        </button>
      ) : (
        <a href="/terms" className="legal-footer-links__btn">
          Terms of Service
        </a>
      )}
      <a
        href={complaintsUrl}
        className="legal-footer-links__btn"
        target="_blank"
        rel="noopener noreferrer"
      >
        Livro de reclamações
      </a>
    </nav>
  )
}
