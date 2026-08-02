import { useState, type FormEvent } from 'react'
import { useI18n } from '../i18n'
import { AuthShell } from '../components/AuthShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { CONTACT_KINDS } from '../contactKinds'
import { useApp } from '../AppContext'
import type { ContactMessageKind } from '../types'

type Props = {
  variant: 'public' | 'app'
}

export function ContactView({ variant }: Props) {
  const { t } = useI18n()
  const { auth, cloudMode, submitContactMessage, openLanding, setView } = useApp()

  const [kind, setKind] = useState<ContactMessageKind>('feedback')
  const [name, setName] = useState(auth?.name ?? '')
  const [email, setEmail] = useState(auth?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const goBack = () => {
    if (variant === 'public') {
      openLanding()
      return
    }
    if (auth?.role === 'treinador') setView('coach-home')
    else if (auth?.role === 'atleta') setView('athlete-portal')
    else setView('help')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await submitContactMessage({
        kind,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  const form = sent ? (
    <div className="contact-success">
      <p className="auth-alert auth-alert--success">
        {t('ui.contact.successMessage', {
          demoSuffix: cloudMode ? '' : t('ui.contact.demoSuffix'),
        })}
      </p>
      <button type="button" className="btn btn--primary btn--block" onClick={goBack}>
        {t('common.back')}
      </button>
    </div>
  ) : (
    <form className="auth-form contact-form" onSubmit={(e) => void submit(e)}>
      <label className="field field--pro">
        <span>{t('ui.contact.whatAbout')}</span>
        <select value={kind} onChange={(e) => setKind(e.target.value as ContactMessageKind)}>
          {CONTACT_KINDS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <small className="muted">{CONTACT_KINDS.find((item) => item.id === kind)?.hint}</small>
      </label>

      <label className="field field--pro">
        <span>{t('ui.contact.yourName')}</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      </label>

      <label className="field field--pro">
        <span>{t('ui.contact.email')}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label className="field field--pro">
        <span>{t('ui.contact.subject')}</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder={t('ui.contact.subjectPlaceholder')}
          maxLength={120}
        />
      </label>

      <label className="field field--pro">
        <span>{t('ui.contact.message')}</span>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
          placeholder={t('ui.contact.messagePlaceholder')}
        />
      </label>

      {error ? <p className="login-error">{error}</p> : null}

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy ? t('ui.contact.sending') : t('ui.contact.sendMessage')}
      </button>
    </form>
  )

  if (variant === 'public') {
    return (
      <AuthShell onBack={openLanding} backLabel={t('auth.home')} showTagline>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">{t('ui.contact.title')}</h2>
          <p className="muted auth-card__lead">{t('ui.contact.publicLead')}</p>
        </header>
        {form}
      </AuthShell>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title={t('nav.contactSurfStar')} onBack={goBack} />
      <div className="ss-card contact-page-card">
        <p className="muted">{t('ui.contact.appLead')}</p>
        {form}
      </div>
    </div>
  )
}
