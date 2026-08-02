export const coach = {
  hello: 'Olá,',
  defaultName: 'Treinador',
  dashboardFallback: 'Painel de treinador SurfStar',
  planLine: 'Plano {{planName}} · {{price}} · {{athleteLimit}}',
  newSession: 'Nova sessão',
  welcomeHint:
    'Bem-vindo ao SurfStar. Adiciona atletas em Gerir atletas e começa a tua primeira sessão na praia — as estatísticas atualizam em tempo real à medida que registas ondas.',
  onboarding: {
    ariaLabel: 'Primeiros passos',
    eyebrow: 'Primeiros passos',
    title: 'Configura o teu espaço de treino',
    progress: '{{completed}} de {{total}} concluídos',
    dismiss: 'Ignorar',
    steps: [
      {
        label: 'Adiciona o teu primeiro atleta',
        hint: 'Partilha um código de emparelhamento para se ligarem à tua conta.',
        cta: 'Gerir atletas',
      },
      {
        label: 'Regista a tua primeira sessão',
        hint: 'Inicia um treino na praia e guarda-o quando terminares.',
        cta: 'Nova sessão',
      },
      {
        label: 'Consulta a análise de equipa',
        hint: 'Vê gráficos de evolução de 6 meses e detalhes por atleta.',
        cta: 'Abrir análise',
      },
    ] as const,
  },
  subscription: {
    title: 'Conta e subscrição',
    currentPlan: 'Plano atual',
    activeAthletes: 'atletas ativos',
    changePassword: 'Alterar palavra-passe',
    newPassword: 'Nova palavra-passe',
    confirmPassword: 'Confirmar palavra-passe',
    updatePassword: 'Atualizar palavra-passe',
    passwordUpdated: 'Palavra-passe atualizada.',
    passwordsMismatch: 'As palavras-passe não coincidem.',
  },
} as const
