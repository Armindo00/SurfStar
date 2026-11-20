import { useI18n } from '../i18n'

type SetupStep = 1 | 2 | 3

type Props = {
  current: SetupStep
}

const STEPS: SetupStep[] = [1, 2, 3]

export function SessionSetupSteps({ current }: Props) {
  const { t } = useI18n()

  return (
    <nav className="session-setup-steps" aria-label={t('session.setup.stepsAria')}>
      {STEPS.map((step) => {
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
