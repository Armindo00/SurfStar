export const legal = {
  backToHome: '← Voltar ao início',
  lastUpdated: 'Última atualização: {{date}}',
  privacy: {
    title: 'Política de Privacidade',
    updated: 'Agosto de 2026',
    sections: {
      whoWeAre: {
        heading: 'Quem somos',
        body: '{{entityName}} («nós») fornece software de estatísticas de surf para treinadores e atletas.{{taxIdLine}}{{addressLine}} Contacto: {{contactEmail}}.',
        taxIdLine: ' NIF: {{taxId}}.',
        addressLine: ' Morada registada: {{address}}.',
      },
      dataWeCollect: {
        heading: 'Dados que recolhemos',
        body: 'Dados de conta (nome, email, NIF quando fornecido), sessões de treino (ondas, manobras, pontuações, notas), relações de emparelhamento atleta–treinador, estado de subscrição, morada de faturação para treinadores e detalhes opcionais de organização para Team Academy.',
      },
      howWeUseData: {
        heading: 'Como usamos os dados',
        body: 'Para prestar o serviço: guardar sessões, calcular estatísticas, permitir emparelhamento treinador–atleta, processar subscrições, emitir faturas quando aplicável e responder a pedidos de suporte.',
      },
      cookies: {
        heading: 'Cookies e armazenamento local',
        body: 'Utilizamos cookies essenciais e armazenamento local do browser para te manter autenticado, recordar progresso de sessão na praia e guardar a tua escolha de consentimento de cookies. Não usamos cookies publicitários ou de rastreamento de terceiros. Monitorização opcional de erros (Sentry) pode recolher dados de falhas anonimizados se ativada por nós.',
      },
      storageSecurity: {
        heading: 'Armazenamento e segurança',
        body: 'Os dados na cloud são armazenados no Supabase (regiões compatíveis com UE consoante o teu projeto). Usamos autenticação padrão da indústria e segurança ao nível de linha para que treinadores acedam apenas aos dados da sua organização.',
      },
      sharing: {
        heading: 'Partilha',
        bodyManual: 'Não vendemos dados pessoais. Os atletas controlam que estatísticas partilham com cada treinador. O pagamento é feito por transferência bancária (IBAN / MB Way) para a nossa conta — não guardamos números de cartão.',
        bodyStripe: 'Não vendemos dados pessoais. Os atletas controlam que estatísticas partilham com cada treinador. Pagamentos com cartão são processados pela Stripe quando a faturação online está ativa; não guardamos dados completos de cartão.',
      },
      yourRights: {
        heading: 'Os teus direitos',
        body: 'Podes pedir eliminação da tua conta em Conta e subscrição (treinadores) ou no portal de atleta. Processamos pedidos em 30 dias. Também podes contactar-nos para acesso, retificação ou portabilidade ao abrigo da legislação aplicável de proteção de dados (incluindo RGPD).',
      },
      retention: {
        heading: 'Conservação',
        body: 'Conservamos dados enquanto a tua conta estiver ativa. Após eliminação de conta ou cancelamento de subscrição, eliminamos ou anonimizamos dados pessoais salvo obrigação legal, fiscal ou de faturação.',
      },
      complaints: {
        heading: 'Reclamações',
        body: 'Para reclamações de serviço podes contactar {{contactEmail}}. Em Portugal também podes usar o livro de reclamações eletrónico: {{complaintsBookUrl}}',
      },
      contact: { heading: 'Contacto', body: '{{entitySummary}}' },
    },
  },
  terms: {
    title: 'Termos de Serviço',
    updated: 'Agosto de 2026',
    sections: {
      service: {
        heading: 'Serviço',
        body: 'O SurfStar é um produto de software por subscrição para treinadores e atletas de surf. As funcionalidades dependem do teu plano (Coach, Coach Premium, Team Academy). Os atletas entram gratuitamente; os treinadores subscrevem.',
      },
      accounts: {
        heading: 'Contas',
        body: 'Deves fornecer informação exata, incluindo NIF e morada de faturação ao registares-te como treinador. És responsável por manter a tua palavra-passe segura. Não abuses do serviço nem tentes aceder a dados de outros utilizadores.',
      },
      subscriptions: {
        heading: 'Subscrições e faturação',
        bodyManual: 'Os planos pagos renovam mensal ou anualmente até cancelamento. Após registo submetes um pedido de pagamento; analisamos, enviamos instruções de transferência bancária (IBAN / MB Way) e ativamos a conta após confirmação de pagamento. As faturas são emitidas separadamente para conformidade fiscal. Team Academy requer aprovação antes da ativação. Podes cancelar no fim do período nas definições da conta; o acesso mantém-se até ao fim do período pago.',
        bodyStripe: 'Os planos pagos renovam mensal ou anualmente até cancelamento via portal de faturação. Team Academy requer aprovação antes da ativação. Reembolsos seguem a legislação de consumo aplicável e políticas do prestador de pagamento.',
      },
      refunds: {
        heading: 'Reembolsos',
        bodyManual: 'Se cancelares nos 14 dias após a primeira ativação e não tiveres usado substancialmente o serviço, contacta-nos para análise de reembolso. Após esse período, as taxas não são reembolsáveis salvo exigência legal. Meses parciais não são reembolsados em cancelamento a meio do ciclo.',
        bodyStripe: 'Pedidos de reembolso são tratados conforme legislação de consumo aplicável e políticas de faturação Stripe. Contacta-nos se acreditares que uma cobrança foi feita por erro.',
      },
      acceptableUse: {
        heading: 'Utilização aceitável',
        body: 'Sem conteúdo ilegal, assédio ou tentativas de contornar limites do plano. Podemos suspender contas que violem estes termos.',
      },
      disclaimer: {
        heading: 'Aviso legal',
        body: 'O SurfStar é uma ferramenta de treino, não substituto do julgamento de segurança na água. Os treinadores permanecem responsáveis pela segurança dos atletas no oceano.',
      },
      changes: {
        heading: 'Alterações',
        body: 'Podemos atualizar estes termos. A utilização continuada após alterações constitui aceitação. Alterações materiais serão comunicadas por email ou aviso na app quando possível.',
      },
      contactComplaints: {
        heading: 'Contacto e reclamações',
        body: '{{entitySummary}}. Livro de reclamações eletrónico (Portugal): {{complaintsBookUrl}}',
      },
    },
  },
} as const
