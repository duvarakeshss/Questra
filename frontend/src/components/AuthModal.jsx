import { useEffect, useRef, useState } from 'react'

import { Close, Lock, Mail } from './Icons'

function Field({ icon, ...props }) {
  return (
    <label className="flex items-center gap-2.5 rounded border border-outline bg-surface-lowest px-3.5 py-2.5 transition-colors focus-within:border-ink">
      <span className="text-on-surface-variant">{icon}</span>
      <input
        {...props}
        className="w-full bg-transparent text-[16px] text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:text-body-md"
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
        className="absolute inset-0 cursor-default bg-inverse-surface/30"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative w-full max-w-md overflow-hidden rounded border border-outline bg-surface-lowest shadow-pop focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-6 py-3">
          <span className="eyebrow">Questra account</span>
          <button type="button" onClick={onClose} aria-label="Close" className="btn-icon">
            <Close />
          </button>
        </div>

        <div className="px-6 py-6">
          <h2 className="font-display text-headline-md text-on-surface">{title}</h2>
          <p className="pt-1.5 text-body-sm leading-relaxed text-on-surface-variant">
            {step === 'otp'
              ? `We sent a 6-digit code to ${email}. Enter it below to verify your account.`
              : message || 'Sign in to run unlimited searches. Your free queries are always saved first.'}
          </p>

          {!auth.configured && (
            <p className="mt-space-md rounded border border-outline bg-surface-low px-3 py-2 text-body-sm text-on-surface-variant">
              Auth isn&apos;t configured yet. Add <code className="font-mono text-label-code-sm">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-label-code-sm">VITE_SUPABASE_ANON_KEY</code> to enable it.
            </p>
          )}

          {error && (
            <p className="mt-space-md rounded border-l-2 border-error bg-error-container/50 px-3 py-2 text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          {step === 'credentials' ? (
            <form onSubmit={submitCredentials} className="mt-space-lg space-y-space-sm">
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
              <button type="submit" className="btn btn-primary w-full" disabled={busy || !auth.configured}>
                {busy ? 'Working…' : mode === 'signup' ? 'Create account' : 'Sign in'}
              </button>
              <p className="pt-1 text-center text-body-sm text-on-surface-variant">
                {mode === 'signup' ? 'Already have an account?' : 'New to Questra?'}{' '}
                <button
                  type="button"
                  className="font-medium text-primary hover:underline"
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
            <form onSubmit={submitOtp} className="mt-space-lg space-y-space-sm">
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
                  className="w-full rounded border border-outline bg-surface-lowest py-3 text-center font-mono text-[22px] tracking-[0.5em] text-on-surface outline-none focus:border-ink"
                />
              </label>
              <button type="submit" className="btn btn-primary w-full" disabled={busy || token.length < 6}>
                {busy ? 'Verifying…' : 'Verify and continue'}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full"
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
