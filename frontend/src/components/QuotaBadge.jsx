import { Sparkle, User } from './Icons'

export default function QuotaBadge({ quota, authenticated, onSignIn }) {
  if (authenticated) {
    return (
      <span className="pill" title="Unlimited searches">
        <Sparkle className="h-3.5 w-3.5 text-accent-ink" />
        Unlimited
      </span>
    )
  }

  const remaining = quota?.remaining
  const label =
    typeof remaining === 'number'
      ? `${remaining} free ${remaining === 1 ? 'query' : 'queries'} left`
      : 'Free preview'

  return (
    <button
      type="button"
      onClick={onSignIn}
      className="chip hover:border-primary hover:text-primary"
      title="Sign in for unlimited searches"
    >
      <User className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  )
}
