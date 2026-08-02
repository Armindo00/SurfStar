import type { SupportedLocale } from '../i18n/types'

type Props = {
  locale: SupportedLocale
  className?: string
}

export function LanguageFlag({ locale, className = 'language-flag' }: Props) {
  const common = {
    className,
    width: 24,
    height: 16,
    viewBox: '0 0 24 16',
    role: 'img',
    'aria-hidden': true as const,
  }

  switch (locale) {
    case 'pt':
      return (
        <svg {...common}>
          <rect width="9" height="16" fill="#006600" />
          <rect x="9" width="15" height="16" fill="#DA020E" />
          <circle cx="9" cy="8" r="3.2" fill="#FFD700" stroke="#002776" strokeWidth="0.35" />
          <rect x="7.1" y="7.2" width="3.8" height="1.6" fill="#FFFFFF" />
        </svg>
      )
    case 'fr':
      return (
        <svg {...common}>
          <rect width="8" height="16" fill="#002395" />
          <rect x="8" width="8" height="16" fill="#FFFFFF" />
          <rect x="16" width="8" height="16" fill="#ED2939" />
        </svg>
      )
    case 'es':
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#AA151B" />
          <rect y="4" width="24" height="8" fill="#F1BF00" />
        </svg>
      )
    case 'en':
    default:
      return (
        <svg {...common}>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 L24 16 M24 0 L0 16" stroke="#FFFFFF" strokeWidth="2.4" />
          <path d="M0 0 L24 16 M24 0 L0 16" stroke="#C8102E" strokeWidth="1.2" />
          <path d="M12 0 V16 M0 8 H24" stroke="#FFFFFF" strokeWidth="3.2" />
          <path d="M12 0 V16 M0 8 H24" stroke="#C8102E" strokeWidth="1.6" />
        </svg>
      )
  }
}
