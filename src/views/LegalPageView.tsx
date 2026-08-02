import { AppLogo } from '../components/AppLogo'
import { LegalFooterLinks } from '../components/LegalFooterLinks'
import { getContactEmail, isManualPaymentsEnabled } from '../config'
import {
  getComplaintsBookUrl,
  getLegalAddress,
  getLegalEntityName,
  getLegalEntitySummary,
  getLegalTaxId,
} from '../legalConfig'
import { useApp } from '../AppContext'
import { useI18n } from '../i18n'
import type { SupportedLocale } from '../i18n/types'
import { getMessages } from '../i18n/messages'

type Props = {
  page: 'privacy' | 'terms'
}

function interpolate(template: string, params: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => params[name] ?? '')
}

function buildPrivacySections(locale: SupportedLocale) {
  const manualBilling = isManualPaymentsEnabled()
  const legal = getMessages(locale).legal.privacy.sections
  const entityName = getLegalEntityName()
  const nif = getLegalTaxId()
  const address = getLegalAddress()
  const contactEmail = getContactEmail()
  const complaintsBookUrl = getComplaintsBookUrl()
  const entitySummary = getLegalEntitySummary()

  const whoWeAre = legal.whoWeAre as { heading: string; body: string; taxIdLine: string; addressLine: string }
  const sharing = legal.sharing as { heading: string; bodyManual: string; bodyStripe: string }

  return [
    {
      heading: whoWeAre.heading,
      body: interpolate(whoWeAre.body, {
        entityName,
        taxIdLine: nif ? interpolate(whoWeAre.taxIdLine, { taxId: nif }) : '',
        addressLine: address ? interpolate(whoWeAre.addressLine, { address }) : '',
        contactEmail,
      }),
    },
    { heading: (legal.dataWeCollect as { heading: string; body: string }).heading, body: (legal.dataWeCollect as { body: string }).body },
    { heading: (legal.howWeUseData as { heading: string; body: string }).heading, body: (legal.howWeUseData as { body: string }).body },
    { heading: (legal.cookies as { heading: string; body: string }).heading, body: (legal.cookies as { body: string }).body },
    { heading: (legal.storageSecurity as { heading: string; body: string }).heading, body: (legal.storageSecurity as { body: string }).body },
    {
      heading: sharing.heading,
      body: manualBilling ? sharing.bodyManual : sharing.bodyStripe,
    },
    { heading: (legal.yourRights as { heading: string; body: string }).heading, body: (legal.yourRights as { body: string }).body },
    { heading: (legal.retention as { heading: string; body: string }).heading, body: (legal.retention as { body: string }).body },
    {
      heading: (legal.complaints as { heading: string; body: string }).heading,
      body: interpolate((legal.complaints as { body: string }).body, { contactEmail, complaintsBookUrl }),
    },
    {
      heading: (legal.contact as { heading: string; body: string }).heading,
      body: interpolate((legal.contact as { body: string }).body, { entitySummary }),
    },
  ]
}

function buildTermsSections(locale: SupportedLocale) {
  const manualBilling = isManualPaymentsEnabled()
  const legal = getMessages(locale).legal.terms.sections
  const entitySummary = getLegalEntitySummary()
  const complaintsBookUrl = getComplaintsBookUrl()

  const subscriptions = legal.subscriptions as { heading: string; bodyManual: string; bodyStripe: string }
  const refunds = legal.refunds as { heading: string; bodyManual: string; bodyStripe: string }
  const contactComplaints = legal.contactComplaints as { heading: string; body: string }

  return [
    { heading: (legal.service as { heading: string; body: string }).heading, body: (legal.service as { body: string }).body },
    { heading: (legal.accounts as { heading: string; body: string }).heading, body: (legal.accounts as { body: string }).body },
    {
      heading: subscriptions.heading,
      body: manualBilling ? subscriptions.bodyManual : subscriptions.bodyStripe,
    },
    {
      heading: refunds.heading,
      body: manualBilling ? refunds.bodyManual : refunds.bodyStripe,
    },
    { heading: (legal.acceptableUse as { heading: string; body: string }).heading, body: (legal.acceptableUse as { body: string }).body },
    { heading: (legal.disclaimer as { heading: string; body: string }).heading, body: (legal.disclaimer as { body: string }).body },
    { heading: (legal.changes as { heading: string; body: string }).heading, body: (legal.changes as { body: string }).body },
    {
      heading: contactComplaints.heading,
      body: interpolate(contactComplaints.body, { entitySummary, complaintsBookUrl }),
    },
  ]
}

export function LegalPageView({ page }: Props) {
  const { openLanding, openPrivacy, openTerms } = useApp()
  const { t, locale, messages } = useI18n()

  const doc =
    page === 'privacy'
      ? {
          title: messages.legal.privacy.title,
          updated: messages.legal.privacy.updated,
          sections: buildPrivacySections(locale),
        }
      : {
          title: messages.legal.terms.title,
          updated: messages.legal.terms.updated,
          sections: buildTermsSections(locale),
        }

  return (
    <div className="auth-page legal-page">
      <div className="auth-card auth-card--wide legal-page__card">
        <button type="button" className="checkout-back" onClick={openLanding}>
          {messages.legal.backToHome}
        </button>
        <AppLogo size="lg" />
        <h1 className="auth-title">{doc.title}</h1>
        <p className="muted legal-page__updated">{t('legal.lastUpdated', { date: doc.updated })}</p>
        <div className="legal-page__sections">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>
        <LegalFooterLinks className="legal-page__footer" onPrivacy={openPrivacy} onTerms={openTerms} layout="stack" />
      </div>
    </div>
  )
}
