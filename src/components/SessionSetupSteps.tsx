import { useI18n } from '../i18n'

type SetupStep = 1 | 2 | 3

type Props = {
  current: SetupStep
  /** Sea analysis only needs type + settings (no athletes). */
  totalSteps?: 2 | 3
}

export function SessionSetupSteps({ current, totalSteps = 3 }: Props) {
  const { t } = useI18n()
  const steps = (totalSteps === 2 ? [1, 2] : [1, 2, 3]) as SetupStep[]

  return (
    <nav className="session-setup-steps" aria-label={t('session.setup.stepsAria')}>
      {steps.map((step) => {
        const state = step < current ? 'done' : step === current ? 'current' : 'upcoming'
        return (
          <span
            key={step}
            className={`session-setup-steps__item session-setup-steps__item--${state}`}
            aria-current={step === current ? 'step' : undefined}
          >
            <span className="session-setup-steps__num">{step}</span>
            <span className="session-setup-steps__label">{t(`session.setup.step${step}`)}</span>
          </span>
        )
      })}
    </nav>
  )
}
