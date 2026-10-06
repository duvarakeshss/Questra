import { useEffect, useRef, useState } from 'react'

import { Brand, Close, Lock, Mail } from './Icons'

function Field({ icon, ...props }) {
  return (
    <label
      className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all duration-180"
      style={{
        border: '1px solid var(--border)',
        background: 'rgba(255,255,255,0.04)',
      }}
      onFocusCapture={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,177,106,0.40)'
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,177,106,0.12)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
      }}
      onBlurCapture={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      <span style={{ color: 'var(--muted)' }}>{icon}</span>
      <input
        {...props}
        className="w-full bg-transparent text-[16px] text-ink outline-none sm:text-body"
        style={{ caretColor: 'var(--a1)' }}
      />
    </label>
  )
}

export default function AuthModal({ open, onClose, auth, message, onAuthenticated }) {
  const [mode, setMode] = useState('signup')
  const [step, setStep] = useState('credentials')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setStep('credentials')
    setToken('')
    setError(null)
    setBusy(false)
    const panel = panelRef.current
    const firstField = panel?.querySelector('input')
    ;(firstField || panel)?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  async function submitCredentials(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        await auth.signUp(email.trim(), password)
        setStep('otp')
      } else {
        await auth.signIn(email.trim(), password)
        onAuthenticated?.()
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function submitOtp(event) {
    event.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await auth.verifyOtp(email.trim(), token.trim())
      onAuthenticated?.()
    } catch (err) {
      setError(err?.message || 'That code did not work. Check it and try again.')
    } finally {
      setBusy(false)
    }
  }

  const title = step === 'otp' ? 'Check your email' : mode === 'signup' ? 'Create your account' : 'Welcome back'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(10,10,13,0.70)', backdropFilter: 'blur(8px)' }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="glass-panel animate-pop-in relative w-full max-w-md overflow-hidden focus:outline-none"
        style={{ borderRadius: '1.5rem' }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}
        >
          <span className="flex items-center gap-2">
            <Brand className="h-6 w-6" />
            <span className="text-body-sm font-semibold text-ink">Questra account</span>
          </span>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-icon h-8 w-8">
            <Close />
          </button>
        </div>

        <div className="px-5 py-6">
          <h2 className="font-display text-title text-gold-gradient">{title}</h2>
          <p className="pt-2 text-body-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {step === 'otp'
              ? `We sent a 6-digit code to ${email}. Enter it below to verify your account.`
              : message || 'Sign in to run unlimited searches. Your free queries are always saved first.'}
          </p>

          {!auth.configured && (
            <p
              className="mt-4 rounded-xl px-3.5 py-3 text-body-sm"
              style={{ border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--muted)' }}
            >
              Auth isn&apos;t configured yet. Add <code className="font-mono text-meta" style={{ color: 'var(--a1)' }}>VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-meta" style={{ color: 'var(--a1)' }}>VITE_SUPABASE_ANON_KEY</code> to enable it.
            </p>
          )}

          {error && (
            <p
              className="mt-4 rounded-xl px-3.5 py-3 text-body-sm text-danger-bright"
              style={{ border: '1px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.10)' }}
            >
              {error}
            </p>
          )}

          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} className="mt-5 space-y-2.5">
              <Field
                icon={<Mail />}
                type="email"
                required
                aria-label="Email address"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Field
                icon={<Lock />}
                type="password"
                required
                minLength={6}
                aria-label="Password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder="Password (6+ characters)"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button type="submit" className="btn btn-accent w-full py-3" disabled={busy || !auth.configured}>
                {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
              <p className="pt-1 text-center text-body-sm" style={{ color: 'var(--muted)' }}>
                {mode === 'signup' ? 'Already have an account?' : 'New to Questra?'}{' '}
                <button
                  type="button"
                  className="font-medium hover:underline"
                  style={{ color: 'var(--a1)' }}
                  onClick={() => {
                    setMode(mode === 'signup' ? 'login' : 'signup')
                    setError(null)
                  }}
                >
                  {mode === 'signup' ? 'Sign in' : 'Create one'}
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={submitOtp} className="mt-5 space-y-2.5">
              <label className="block">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  autoFocus
                  aria-label="Verification code"
                  value={token}
                  onChange={(event) => setToken(event.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full rounded-xl py-3 text-center font-mono text-[22px] tracking-[0.5em] text-ink outline-none transition-all duration-180"
                  style={{
                    border: '1px solid var(--border)',
                    background: 'rgba(255,255,255,0.04)',
                    caretColor: 'var(--a1)',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(212,177,106,0.40)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(212,177,106,0.12)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                  }}
                />
              </label>
              <button type="submit" className="btn btn-accent w-full py-3" disabled={busy || token.length < 6}>
                {busy ? 'Verifying…' : 'Verify and continue'}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full py-2.5"
                onClick={() => {
                  setStep('credentials')
                  setError(null)
                }}
              >
                Back
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
