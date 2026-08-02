export const coach = {
  hello: 'Hola,',
  defaultName: 'Entrenador',
  dashboardFallback: 'Panel de entrenador SurfStar',
  planLine: 'Plan {{planName}} · {{price}} · {{athleteLimit}}',
  newSession: 'Nueva sesión',
  welcomeHint:
    'Bienvenido a SurfStar. Añade atletas desde Gestionar atletas y empieza tu primera sesión en la playa — las estadísticas se actualizan en directo mientras registras olas.',
  onboarding: {
    ariaLabel: 'Primeros pasos',
    eyebrow: 'Primeros pasos',
    title: 'Configura tu espacio de entrenamiento',
    progress: '{{completed}} de {{total}} completados',
    dismiss: 'Descartar',
    steps: [
      {
        label: 'Añade tu primer atleta',
        hint: 'Comparte un código de emparejamiento para que se vincule a tu cuenta.',
        cta: 'Gestionar atletas',
      },
      {
        label: 'Registra tu primera sesión',
        hint: 'Inicia un entrenamiento en la playa y guárdalo al terminar.',
        cta: 'Nueva sesión',
      },
      {
        label: 'Revisa el análisis de equipo',
        hint: 'Consulta gráficos de evolución de 6 meses y desglose por atleta.',
        cta: 'Abrir análisis',
      },
    ] as const,
  },
  subscription: {
    title: 'Cuenta y suscripción',
    currentPlan: 'Plan actual',
    activeAthletes: 'atletas activos',
    changePassword: 'Cambiar contraseña',
    newPassword: 'Nueva contraseña',
    confirmPassword: 'Confirmar contraseña',
    updatePassword: 'Actualizar contraseña',
    passwordUpdated: 'Contraseña actualizada.',
    passwordsMismatch: 'Las contraseñas no coinciden.',
  },
} as const
