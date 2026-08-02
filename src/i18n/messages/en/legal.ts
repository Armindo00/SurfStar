export const legal = {
  backToHome: '← Back to home',
  lastUpdated: 'Last updated: {{date}}',
  privacy: {
    title: 'Privacy Policy',
    updated: 'August 2026',
    sections: {
      whoWeAre: {
        heading: 'Who we are',
        body: '{{entityName}} ("we", "us") provides surf coaching statistics software for coaches and athletes.{{taxIdLine}}{{addressLine}} Contact: {{contactEmail}}.',
        taxIdLine: ' Tax ID: {{taxId}}.',
        addressLine: ' Registered address: {{address}}.',
      },
      dataWeCollect: {
        heading: 'Data we collect',
        body: 'Account data (name, email, tax ID when provided), training sessions (waves, maneuvers, scores, notes), athlete pairing relationships, subscription status, billing address for coaches, and optional organization details for Team Academy.',
      },
      howWeUseData: {
        heading: 'How we use data',
        body: 'To provide the service: store your sessions, compute statistics, enable coach–athlete pairing, process subscriptions, issue invoices where applicable, and respond to support requests.',
      },
      cookies: {
        heading: 'Cookies & local storage',
        body: 'We use essential cookies and browser local storage to keep you signed in, remember session progress on the beach, and store your cookie consent choice. We do not use advertising or third-party tracking cookies. Optional error monitoring (Sentry) may collect anonymised crash data if enabled by us.',
      },
      storageSecurity: {
        heading: 'Storage & security',
        body: 'Cloud data is stored in Supabase (EU-capable regions depending on your project). We use industry-standard authentication and row-level security so coaches only access their organization data.',
      },
      sharing: {
        heading: 'Sharing',
        bodyManual:
          'We do not sell personal data. Athletes control what stats are shared with each coach. Payment is handled by bank transfer (IBAN / MB Way) to our business account — we do not store card numbers.',
        bodyStripe:
          'We do not sell personal data. Athletes control what stats are shared with each coach. Card payments are processed by Stripe when online billing is enabled; we do not store full card details.',
      },
      yourRights: {
        heading: 'Your rights',
        body: 'You may request deletion of your account from Account & subscription (coaches) or the athlete portal. We process requests within 30 days. You may also contact us for access, correction, or portability under applicable data protection law (including GDPR).',
      },
      retention: {
        heading: 'Retention',
        body: 'We retain data while your account is active. After account deletion or subscription cancellation, we delete or anonymise personal data unless we must keep it for legal, tax, or billing obligations.',
      },
      complaints: {
        heading: 'Complaints',
        body: 'For service complaints you may contact {{contactEmail}}. In Portugal you may also use the electronic complaints book: {{complaintsBookUrl}}',
      },
      contact: {
        heading: 'Contact',
        body: '{{entitySummary}}',
      },
    },
  },
  terms: {
    title: 'Terms of Service',
    updated: 'August 2026',
    sections: {
      service: {
        heading: 'Service',
        body: 'SurfStar is a subscription software product for surf coaches and athletes. Features depend on your plan (Coach, Coach Premium, Team Academy). Athletes join free; coaches subscribe.',
      },
      accounts: {
        heading: 'Accounts',
        body: "You must provide accurate information, including tax ID and billing address when registering as a coach. You are responsible for keeping your password secure. Do not misuse the service or attempt to access other users' data.",
      },
      subscriptions: {
        heading: 'Subscriptions & billing',
        bodyManual:
          'Paid plans renew monthly or annually until canceled. After registration you submit a payment request; we review it, send bank transfer instructions (IBAN / MB Way), and activate your account once payment is confirmed. Invoices are issued separately for tax compliance. Team Academy requires approval before activation. You may cancel at period end from your account settings; access continues until the paid period ends.',
        bodyStripe:
          'Paid plans renew monthly or annually until canceled via the billing portal. Team Academy requires approval before activation. Refunds follow applicable consumer law and our payment provider policies.',
      },
      refunds: {
        heading: 'Refunds',
        bodyManual:
          'If you cancel within 14 days of first activation and have not substantially used the service, contact us for a refund review. After that period, fees are non-refundable except where required by law. Partial months are not refunded on mid-cycle cancellation.',
        bodyStripe:
          'Refund requests are handled according to applicable consumer law and Stripe billing policies. Contact us if you believe a charge was made in error.',
      },
      acceptableUse: {
        heading: 'Acceptable use',
        body: 'No illegal content, harassment, or attempts to circumvent plan limits. We may suspend accounts that violate these terms.',
      },
      disclaimer: {
        heading: 'Disclaimer',
        body: 'SurfStar is a training aid, not a substitute for water safety judgment. Coaches remain responsible for athlete safety in the ocean.',
      },
      changes: {
        heading: 'Changes',
        body: 'We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email or in-app notice when possible.',
      },
      contactComplaints: {
        heading: 'Contact & complaints',
        body: '{{entitySummary}}. Electronic complaints book (Portugal): {{complaintsBookUrl}}',
      },
    },
  },
} as const
