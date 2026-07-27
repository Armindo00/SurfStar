import { useState, type FormEvent } from 'react'
import { AuthShell } from '../components/AuthShell'
import { ScreenHeader } from '../components/ScreenHeader'
import { CONTACT_KINDS } from '../contactKinds'
import { useApp } from '../AppContext'
import type { ContactMessageKind } from '../types'

type Props = {
  variant: 'public' | 'app'
}

export function ContactView({ variant }: Props) {
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
        Thank you — your message was sent to the SurfStar team. We typically reply within 1–2 business
        days{cloudMode ? '' : ' (saved locally in demo mode)'}.
      </p>
      <button type="button" className="btn btn--primary btn--block" onClick={goBack}>
        Back
      </button>
    </div>
  ) : (
    <form className="auth-form contact-form" onSubmit={(e) => void submit(e)}>
      <label className="field field--pro">
        <span>What is this about?</span>
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
        <span>Your name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
      </label>

      <label className="field field--pro">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </label>

      <label className="field field--pro">
        <span>Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          placeholder="Brief summary"
          maxLength={120}
        />
      </label>

      <label className="field field--pro">
        <span>Message</span>
        <textarea
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          minLength={10}
          maxLength={4000}
          placeholder="Tell us what you need — the more detail, the better we can help."
        />
      </label>

      {error ? <p className="login-error">{error}</p> : null}

      <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={busy}>
        {busy ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )

  if (variant === 'public') {
    return (
      <AuthShell onBack={openLanding} backLabel="Home" showTagline>
        <header className="auth-card__head auth-card__head--compact">
          <h2 className="auth-card__title">Contact SurfStar</h2>
          <p className="muted auth-card__lead">
            Send feedback, report a bug, or ask for help. We read every message.
          </p>
        </header>
        {form}
      </AuthShell>
    )
  }

  return (
    <div className="ss-flow">
      <ScreenHeader title="Contact SurfStar" onBack={goBack} />
      <div className="ss-card contact-page-card">
        <p className="muted">
          Questions, ideas, or issues? Reach the SurfStar team directly — no need to leave the app.
        </p>
        {form}
      </div>
    </div>
  )
}
