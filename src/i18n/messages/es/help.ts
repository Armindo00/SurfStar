export const help = {
  page: {
    quickStart: 'Inicio rápido',
    trainingModes: 'Modos de entrenamiento',
    trainingModesSub: 'Cómo funciona cada tipo de sesión y cómo ejecutarla en la playa.',
    athleteGuide: 'Guía del atleta',
    addToHomeScreen: 'Añadir a la pantalla de inicio',
    installOnPhone: 'Instalar en el móvil',
    contactTitle: 'Contactar SurfStar',
    contactLead:
      'Envía feedback, reporta un bug o pide ayuda. Leemos todos los mensajes y respondemos normalmente en 1–2 días hábiles.',
    sendMessage: 'Enviar mensaje',
  },
  coachQuickTips: [
    'Configura primero spots y condiciones de mar en Spots y condiciones — aparecen en cada nueva sesión.',
    'Vincula atletas mediante código de emparejamiento en Gestionar atletas antes de la primera sesión en la playa.',
    'Usa Terminar sesión en el menú para guardar todo en Sesiones anteriores y Análisis de equipo.',
  ],
  trainingGuides: {
    tecnico: {
      planLabel: 'Todos los planes',
      summary: 'Registro ola a ola para maniobras rail, top turn y progressive — con nivel, lado y éxito.',
      steps: [
        'Pulsa Nueva sesión → elige Entrenamiento técnico, spot y condiciones de mar.',
        'Selecciona los atletas que entrenan y pulsa Iniciar sesión.',
        'Pulsa en un tile de atleta para abrir la hoja de registro de la ola actual.',
        'Registra cada maniobra (R / T / P), elige el nivel (1–3 o ★), frontside o backside, y éxito o fallo.',
        'Abre Estadísticas en directo en cualquier momento para ver tasa de éxito y desglose actualizado en tiempo real.',
      ],
    },
    combos: {
      planLabel: 'Todos los planes',
      summary: 'Sigue secuencias de maniobras enlazadas (combos) con niveles y tasas de éxito.',
      steps: [
        'Pulsa Nueva sesión → elige Combos, luego spot y condiciones.',
        'Selecciona atletas e inicia la sesión.',
        'Por cada ola, pulsa el atleta y registra el nivel de combo conseguido (Combo 1–3 o ★).',
        'Marca éxito o fallo en ese intento de combo.',
        'Revisa estadísticas de combo en Estadísticas en directo o Análisis de equipo tras la sesión.',
      ],
    },
    heats: {
      planLabel: 'Plan Coach y superiores',
      summary: 'Corre un heat cronometrado — puntúa cada atleta ola a ola como en un heat de competición.',
      steps: [
        'Pulsa Nueva sesión → elige Heats y define la duración (ej. 15 o 20 minutos).',
        'Selecciona hasta cuatro atletas para el heat e inicia.',
        'Registra cada ola con puntuaciones e interferencias según ocurren.',
        'Al terminar el heat, revisa clasificaciones y totales en la pantalla del heat.',
        'Los heats terminados aparecen en el historial de sesiones y Análisis de equipo.',
      ],
    },
    campeonato: {
      planLabel: 'Plan Coach y superiores',
      summary: 'Competición eliminatoria completa — añade todos los surfistas, elige tamaño de heat (2 o 4), y SurfStar construye todas las rondas hasta la final.',
      steps: [
        'Pulsa Nueva sesión → Campeonato, define duración del heat y surfistas por heat (2 = avanza el 1.º, 4 = avanzan los 2 primeros).',
        'Selecciona todos los atletas del campeonato y pulsa Iniciar campeonato.',
        'SurfStar divide la ronda inicial en heats de 3 o 4 (ej. cuartos con 8 surfistas = 2 heats de 4).',
        'Cuando una ronda tiene varios heats, pulsa Iniciar todos los heats — comparten un reloj y puntúas cada heat lado a lado.',
        'Continúa por semifinales y final hasta coronar un campeón.',
      ],
    },
    'sea-analysis': {
      planLabel: 'Coach Premium',
      summary: 'Observación oceánica cronometrada de 30 minutos en dos picos — registra tipos de ola y obtén recomendación de pico.',
      steps: [
        'Pulsa Nueva sesión → elige Análisis de mar, spot y condiciones (no se requieren atletas).',
        'Inicia la sesión y pulsa Iniciar temporizador cuando empieces a observar.',
        'Registra tipos de ola en Pico 1 y Pico 2 según llegan los sets (sets, intermedias, olas pequeñas).',
        'SurfStar puntúa cada pico y muestra cuál funciona mejor.',
        'Termina la sesión para guardar la línea temporal y recomendación en el historial.',
      ],
    },
    custom: {
      planLabel: 'Coach Premium',
      summary: 'Tu formato de entrenamiento — botones de skill personalizados, niveles, éxito/fallo, temporizador y reglas escritas.',
      steps: [
        'Ve a Plantillas de entrenamiento personalizado y crea una plantilla (botones, niveles, temporizador, reglas).',
        'Pulsa Nueva sesión → elige Entrenamiento personalizado y selecciona tu plantilla.',
        'Selecciona atletas e inicia — el registro muestra tus botones personalizados en lugar de maniobras integradas.',
        'Pulsa un botón de skill, elige nivel y resultado, y registra directamente o por ola según tu plantilla.',
        'Si hay temporizador, inícialo desde la hoja de registro cuando empiece el ejercicio.',
      ],
    },
  },
  install: {
    title: 'Añadir SurfStar a la pantalla de inicio',
    lead: 'Instala SurfStar como una app para acceso con un toque en la playa. Funciona en iPhone y Android — sin descarga de App Store.',
    iphone: {
      title: 'iPhone (Safari)',
      steps: [
        'Abre {{siteHost}} en Safari (Chrome en iPhone no admite instalación en pantalla de inicio igual).',
        'Pulsa el botón Compartir en la parte inferior (□ con flecha hacia arriba).',
        'Desplázate en el menú de compartir y pulsa Añadir a pantalla de inicio.',
        'Edita el nombre si quieres, luego pulsa Añadir — el icono SurfStar aparece en tu pantalla de inicio.',
        'Abre SurfStar desde ese icono para experiencia a pantalla completa, como una app.',
      ],
    },
    android: {
      title: 'Android (Chrome)',
      steps: [
        'Abre {{siteHost}} en Google Chrome.',
        'Pulsa el menú (⋮) en la esquina superior derecha.',
        'Pulsa Instalar app o Añadir a pantalla de inicio (el texto puede variar según el móvil).',
        'Confirma en el aviso — SurfStar se añade a la pantalla de inicio y al cajón de apps.',
        'En Samsung Internet: menú ≡ → Añadir página a → Pantalla de inicio.',
      ],
    },
    note: 'Si ya instalaste SurfStar, puedes ignorar esta sección.',
  },
} as const
