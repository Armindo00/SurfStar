export const help = {
  page: {
    quickStart: 'Início rápido',
    trainingModes: 'Modos de treino',
    trainingModesSub: 'Como funciona cada tipo de sessão e como a executar na praia.',
    athleteGuide: 'Guia do atleta',
    addToHomeScreen: 'Adicionar ao ecrã inicial',
    installOnPhone: 'Instalar no telemóvel',
    contactTitle: 'Contactar SurfStar',
    contactLead:
      'Envia feedback, reporta um bug ou pede ajuda. Lemos todas as mensagens e respondemos normalmente em 1–2 dias úteis.',
    sendMessage: 'Enviar mensagem',
  },
  coachQuickTips: [
    'Configura primeiro spots e condições de mar em Spots e condições — aparecem em cada nova sessão.',
    'Liga atletas via código de emparelhamento em Gerir atletas antes da primeira sessão na praia.',
    'Usa Terminar sessão no menu para guardar tudo em Sessões anteriores e Análise de equipa.',
  ],
  trainingGuides: {
    tecnico: {
      planLabel: 'Todos os planos',
      summary: 'Registo onda a onda para manobras rail, top turn e progressive — com nível, lado e sucesso.',
      steps: [
        'Toca Nova sessão → escolhe Treino técnico, spot e condições de mar.',
        'Seleciona os atletas que treinam e toca Iniciar sessão.',
        'Toca num tile de atleta para abrir a folha de registo da onda atual.',
        'Regista cada manobra (R / T / P), escolhe o nível (1–3 ou ★), frontside ou backside, e sucesso ou falha.',
        'Abre Estatísticas em direto a qualquer momento para ver taxa de sucesso e detalhes atualizados em tempo real.',
      ],
    },
    combos: {
      planLabel: 'Todos os planos',
      summary: 'Acompanha sequências de manobras ligadas (combos) com níveis e taxas de sucesso.',
      steps: [
        'Toca Nova sessão → escolhe Combos, depois spot e condições.',
        'Seleciona atletas e inicia a sessão.',
        'Por cada onda, toca no atleta e regista o nível de combo alcançado (Combo 1–3 ou ★).',
        'Marca sucesso ou falha nessa tentativa de combo.',
        'Revê estatísticas de combo em Estatísticas em direto ou Análise de equipa após a sessão.',
      ],
    },
    heats: {
      planLabel: 'Plano Coach e superiores',
      summary: 'Corre um heat cronometrado — pontua cada atleta onda a onda como num heat de competição.',
      steps: [
        'Toca Nova sessão → escolhe Heats e define a duração (ex.: 15 ou 20 minutos).',
        'Seleciona até quatro atletas para o heat e inicia.',
        'Regista cada onda com pontuações e interferências à medida que acontecem.',
        'Quando o heat termina, revê classificações e totais no ecrã do heat.',
        'Heats concluídos aparecem no histórico de sessões e Análise de equipa.',
      ],
    },
    campeonato: {
      planLabel: 'Plano Coach e superiores',
      summary: 'Competição eliminatória completa — adiciona todos os surfistas, escolhe tamanho do heat (2 ou 4), e o SurfStar constrói todas as rondas até à final.',
      steps: [
        'Toca Nova sessão → Campeonato, define duração do heat e surfistas por heat (2 = avança o 1.º, 4 = avançam os 2 primeiros).',
        'Seleciona todos os atletas do campeonato e toca Iniciar campeonato.',
        'O SurfStar divide a ronda inicial em heats de 3 ou 4 (ex.: quartos de final com 8 surfistas = 2 heats de 4).',
        'Quando uma ronda tem vários heats, toca Iniciar todos os heats — partilham um relógio e pontuas cada heat lado a lado.',
        'Continua pelas meias-finais e final até haver um campeão.',
      ],
    },
    'sea-analysis': {
      planLabel: 'Coach Premium',
      summary: 'Observação oceânica cronometrada de 30 minutos em dois picos — regista tipos de onda e obtém recomendação de pico.',
      steps: [
        'Toca Nova sessão → escolhe Análise de mar, spot e condições (sem atletas necessários).',
        'Inicia a sessão e toca Iniciar temporizador quando começares a observar.',
        'Regista tipos de onda no Pico 1 e Pico 2 à medida que chegam os sets (sets, intermédias, ondas pequenas).',
        'O SurfStar pontua cada pico e mostra qual está a funcionar melhor.',
        'Termina a sessão para guardar a linha temporal e recomendação no histórico.',
      ],
    },
    custom: {
      planLabel: 'Coach Premium',
      summary: 'O teu formato de treino — botões de skill personalizados, níveis, sucesso/falha, temporizador e regras escritas.',
      steps: [
        'Vai a Modelos de treino personalizado e cria um modelo (botões, níveis, temporizador, regras).',
        'Toca Nova sessão → escolhe Treino personalizado e seleciona o teu modelo.',
        'Seleciona atletas e inicia — o registo mostra os teus botões personalizados em vez das manobras integradas.',
        'Toca num botão de skill, escolhe nível e resultado, e regista diretamente ou por onda conforme o modelo.',
        'Se o temporizador estiver ativo, inicia-o na folha de registo quando o exercício começar.',
      ],
    },
  },
  install: {
    title: 'Adicionar SurfStar ao ecrã inicial',
    lead: 'Instala o SurfStar como uma app para acesso com um toque na praia. Funciona em iPhone e Android — sem download da App Store.',
    iphone: {
      title: 'iPhone (Safari)',
      steps: [
        'Abre {{siteHost}} no Safari (o Chrome no iPhone não suporta instalação no ecrã inicial da mesma forma).',
        'Toca no botão Partilhar na parte inferior do ecrã (□ com seta para cima).',
        'Desliza o menu de partilha e toca em Adicionar ao ecrã inicial.',
        'Edita o nome se quiseres, depois toca Adicionar — o ícone SurfStar aparece no ecrã inicial.',
        'Abre o SurfStar a partir desse ícone para experiência em ecrã completo, como uma app.',
      ],
    },
    android: {
      title: 'Android (Chrome)',
      steps: [
        'Abre {{siteHost}} no Google Chrome.',
        'Toca no menu (⋮) no canto superior direito.',
        'Toca Instalar app ou Adicionar ao ecrã inicial (a redação pode variar consoante o telemóvel).',
        'Confirma no aviso — o SurfStar é adicionado ao ecrã inicial e à gaveta de apps.',
        'No Samsung Internet: toca no menu ≡ → Adicionar página a → Ecrã inicial.',
      ],
    },
    note: 'Se já instalaste o SurfStar, podes ignorar esta secção.',
  },
} as const
