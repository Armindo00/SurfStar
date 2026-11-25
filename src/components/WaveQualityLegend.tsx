import { useI18n } from '../i18n'

type Props = {
  /** Técnico (default) vs combos — muda o texto das fórmulas. */
  variant?: 'tecnico' | 'combos'
  aproveitamentoMade?: number
  aproveitamentoTotal?: number
  valorizacaoMade?: number
  valorizacaoTotal?: number
}

export function WaveQualityLegend({
  variant = 'tecnico',
  aproveitamentoMade,
  aproveitamentoTotal,
  valorizacaoMade,
  valorizacaoTotal,
}: Props) {
  const { t } = useI18n()
  const isCombos = variant === 'combos'

  const aproveitamentoExample =
    aproveitamentoMade != null && aproveitamentoTotal != null && aproveitamentoTotal > 0
      ? t('analytics.topicSheet.aproveitamentoExample', {
          made: aproveitamentoMade,
          total: aproveitamentoTotal,
          rate: Math.round((aproveitamentoMade / aproveitamentoTotal) * 100),
        })
      : null

  const valorizacaoExample =
    valorizacaoMade != null && valorizacaoTotal != null && valorizacaoTotal > 0
      ? t('analytics.topicSheet.valorizacaoExample', {
          made: valorizacaoMade,
          total: valorizacaoTotal,
          rate: Math.round((valorizacaoMade / valorizacaoTotal) * 100),
        })
      : null

  return (
    <div className="wave-quality-legend">
      <p>
        <strong>{t('analytics.topicSheet.aproveitamentoRate')}</strong>
        {' — '}
        {t(
          isCombos
            ? 'analytics.topicSheet.aproveitamentoLegendCombos'
            : 'analytics.topicSheet.aproveitamentoLegend',
        )}
        {aproveitamentoExample ? ` ${aproveitamentoExample}` : ''}
      </p>
      <p>
        <strong>{t('analytics.topicSheet.valorizacaoRate')}</strong>
        {' — '}
        {t(
          isCombos
            ? 'analytics.topicSheet.valorizacaoLegendCombos'
            : 'analytics.topicSheet.valorizacaoLegend',
        )}
        {valorizacaoExample ? ` ${valorizacaoExample}` : ''}
      </p>
    </div>
  )
}
