import { AppLogo } from '../components/AppLogo'
import { getContactEmail } from '../config'
import { useApp } from '../AppContext'

type Props = {
  page: 'privacy' | 'terms'
}

const PRIVACY = {
  title: 'Privacy Policy',
  updated: 'July 2026',
  sections: [
    {
      heading: 'Who we are',
      body: `SurfStar ("we", "us") provides surf coaching statistics software for coaches and athletes. Contact: ${getContactEmail()}`,
    },
    {
      heading: 'Data we collect',
      body: 'Account data (name, email), training sessions (waves, maneuvers, scores, notes), athlete pairing relationships, subscription status, and optional organization details for Team Academy.',
    },
    {
      heading: 'How we use data',
      body: 'To provide the service: store your sessions, compute statistics, enable coach–athlete pairing, process subscriptions when enabled, and respond to support requests.',
    },
    {
      heading: 'Storage & security',
      body: 'Cloud data is stored in Supabase (EU-capable regions depending on your project). We use industry-standard authentication and row-level security so coaches only access their organization data.',
    },
    {
      heading: 'Sharing',
      body: 'We do not sell personal data. Athletes control what stats are shared with each coach. Payment data is handled by Stripe when billing is enabled.',
    },
    {
      heading: 'Your rights',
      body: 'You may request deletion of your account from Account & subscription (coaches) or the athlete portal. We process requests within 30 days. You may also contact us for access or correction.',
    },
    {
      heading: 'Retention',
      body: 'We retain data while your account is active. You may request deletion after canceling your subscription.',
    },
  ],
}

const TERMS = {
  title: 'Terms of Service',
  updated: 'July 2026',
  sections: [
    {
      heading: 'Service',
      body: 'SurfStar is a subscription software product for surf coaches and athletes. Features depend on your plan (Coach, Coach Premium, Team Academy).',
    },
    {
      heading: 'Accounts',
      body: 'You must provide accurate information. You are responsible for keeping your password secure. Do not misuse the service or attempt to access other users\' data.',
    },
    {
      heading: 'Subscriptions & billing',
      body: 'Paid plans renew monthly or annually until canceled. Team Academy requires approval before activation. Refunds follow applicable consumer law and our billing provider policies.',
    },
    {
      heading: 'Acceptable use',
      body: 'No illegal content, harassment, or attempts to circumvent plan limits. We may suspend accounts that violate these terms.',
    },
    {
      heading: 'Disclaimer',
      body: 'SurfStar is a training aid, not a substitute for water safety judgment. Coaches remain responsible for athlete safety in the ocean.',
    },
    {
      heading: 'Changes',
      body: 'We may update these terms. Continued use after changes constitutes acceptance. Material changes will be communicated via email or in-app notice when possible.',
    },
    {
      heading: 'Contact',
      body: `Questions: ${getContactEmail()}`,
    },
  ],
}

export function LegalPageView({ page }: Props) {
  const { openLanding } = useApp()
  const doc = page === 'privacy' ? PRIVACY : TERMS

  return (
    <div className="auth-page legal-page">
      <div className="auth-card auth-card--wide legal-page__card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          ← Back to home
        </button>
        <AppLogo size="lg" />
        <h1 className="auth-title">{doc.title}</h1>
        <p className="muted legal-page__updated">Last updated: {doc.updated}</p>
        <div className="legal-page__sections">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
