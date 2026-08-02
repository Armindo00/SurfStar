export const legal = {
  backToHome: '← Volver al inicio',
  lastUpdated: 'Última actualización: {{date}}',
  privacy: {
    title: 'Política de Privacidad',
    updated: 'Agosto de 2026',
    sections: {
      whoWeAre: {
        heading: 'Quiénes somos',
        body: '{{entityName}} («nosotros») proporciona software de estadísticas de surf para entrenadores y atletas.{{taxIdLine}}{{addressLine}} Contacto: {{contactEmail}}.',
        taxIdLine: ' NIF: {{taxId}}.',
        addressLine: ' Dirección registrada: {{address}}.',
      },
      dataWeCollect: {
        heading: 'Datos que recopilamos',
        body: 'Datos de cuenta (nombre, correo, NIF cuando se proporciona), sesiones de entrenamiento (olas, maniobras, puntuaciones, notas), relaciones de emparejamiento atleta–entrenador, estado de suscripción, dirección de facturación para entrenadores y detalles opcionales de organización para Team Academy.',
      },
      howWeUseData: {
        heading: 'Cómo usamos los datos',
        body: 'Para prestar el servicio: almacenar sesiones, calcular estadísticas, permitir emparejamiento entrenador–atleta, procesar suscripciones, emitir facturas cuando aplique y responder a solicitudes de soporte.',
      },
      cookies: {
        heading: 'Cookies y almacenamiento local',
        body: 'Usamos cookies esenciales y almacenamiento local del navegador para mantenerte conectado, recordar el progreso de sesión en la playa y guardar tu elección de consentimiento de cookies. No usamos cookies publicitarias ni de seguimiento de terceros. El monitoreo opcional de errores (Sentry) puede recopilar datos de fallos anonimizados si lo activamos.',
      },
      storageSecurity: {
        heading: 'Almacenamiento y seguridad',
        body: 'Los datos en la nube se almacenan en Supabase (regiones compatibles con UE según tu proyecto). Usamos autenticación estándar y seguridad a nivel de fila para que los entrenadores accedan solo a los datos de su organización.',
      },
      sharing: {
        heading: 'Compartición',
        bodyManual: 'No vendemos datos personales. Los atletas controlan qué estadísticas comparten con cada entrenador. El pago se realiza por transferencia bancaria (IBAN / MB Way) a nuestra cuenta — no almacenamos números de tarjeta.',
        bodyStripe: 'No vendemos datos personales. Los atletas controlan qué estadísticas comparten con cada entrenador. Los pagos con tarjeta los procesa Stripe cuando la facturación online está activa; no almacenamos datos completos de tarjeta.',
      },
      yourRights: {
        heading: 'Tus derechos',
        body: 'Puedes solicitar eliminación de tu cuenta en Cuenta y suscripción (entrenadores) o en el portal de atleta. Procesamos solicitudes en 30 días. También puedes contactarnos para acceso, rectificación o portabilidad según la legislación aplicable (incluido RGPD).',
      },
      retention: {
        heading: 'Conservación',
        body: 'Conservamos datos mientras tu cuenta esté activa. Tras eliminación de cuenta o cancelación de suscripción, eliminamos o anonimizamos datos personales salvo obligación legal, fiscal o de facturación.',
      },
      complaints: {
        heading: 'Reclamaciones',
        body: 'Para reclamaciones de servicio contacta {{contactEmail}}. En Portugal también puedes usar el libro de reclamaciones electrónico: {{complaintsBookUrl}}',
      },
      contact: { heading: 'Contacto', body: '{{entitySummary}}' },
    },
  },
  terms: {
    title: 'Términos de Servicio',
    updated: 'Agosto de 2026',
    sections: {
      service: {
        heading: 'Servicio',
        body: 'SurfStar es un producto de software por suscripción para entrenadores y atletas de surf. Las funciones dependen de tu plan (Coach, Coach Premium, Team Academy). Los atletas se unen gratis; los entrenadores se suscriben.',
      },
      accounts: {
        heading: 'Cuentas',
        body: 'Debes proporcionar información exacta, incluido NIF y dirección de facturación al registrarte como entrenador. Eres responsable de mantener segura tu contraseña. No abuses del servicio ni intentes acceder a datos de otros usuarios.',
      },
      subscriptions: {
        heading: 'Suscripciones y facturación',
        bodyManual: 'Los planes de pago se renuevan mensual o anualmente hasta cancelación. Tras el registro envías una solicitud de pago; la revisamos, enviamos instrucciones de transferencia bancaria (IBAN / MB Way) y activamos tu cuenta tras confirmar el pago. Las facturas se emiten por separado para cumplimiento fiscal. Team Academy requiere aprobación antes de la activación. Puedes cancelar al final del periodo desde ajustes de cuenta; el acceso continúa hasta el fin del periodo pagado.',
        bodyStripe: 'Los planes de pago se renuevan mensual o anualmente hasta cancelación vía portal de facturación. Team Academy requiere aprobación antes de la activación. Los reembolsos siguen la legislación de consumo aplicable y políticas del proveedor de pago.',
      },
      refunds: {
        heading: 'Reembolsos',
        bodyManual: 'Si cancelas en los 14 días tras la primera activación y no has usado sustancialmente el servicio, contáctanos para revisión de reembolso. Tras ese periodo, las tarifas no son reembolsables salvo exigencia legal. Los meses parciales no se reembolsan en cancelación a mitad de ciclo.',
        bodyStripe: 'Las solicitudes de reembolso se gestionan según legislación de consumo aplicable y políticas de facturación Stripe. Contáctanos si crees que un cargo se realizó por error.',
      },
      acceptableUse: {
        heading: 'Uso aceptable',
        body: 'Sin contenido ilegal, acoso ni intentos de eludir límites del plan. Podemos suspender cuentas que violen estos términos.',
      },
      disclaimer: {
        heading: 'Aviso legal',
        body: 'SurfStar es una herramienta de entrenamiento, no sustituto del criterio de seguridad en el agua. Los entrenadores siguen siendo responsables de la seguridad de los atletas en el océano.',
      },
      changes: {
        heading: 'Cambios',
        body: 'Podemos actualizar estos términos. El uso continuado tras cambios constituye aceptación. Los cambios materiales se comunicarán por correo o aviso en la app cuando sea posible.',
      },
      contactComplaints: {
        heading: 'Contacto y reclamaciones',
        body: '{{entitySummary}}. Libro de reclamaciones electrónico (Portugal): {{complaintsBookUrl}}',
      },
    },
  },
} as const
