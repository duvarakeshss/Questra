import { Brand, Plus, User } from './Icons'

export default function TopBar({ status, quota, authenticated, onNew, onSignIn }) {
  const remaining = quota?.remaining
  const label = authenticated ? 'Unlimited' : typeof remaining === 'number' ? `${remaining} left` : 'Free'

  return (
    <>
      {/* ─── Notch ────────────────── */}
      <div className="notch glass-notch">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="#17120A" strokeWidth="2.4" strokeLinecap="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </div>
        <span className="name">Questra</span>
      </div>

      {/* ─── Top-right cluster ─────── */}
      <div className="cluster">
        <span
          className="glass-pill pill-text"
          style={{ padding: '9px 15px', fontSize: '13px', color: 'var(--muted)' }}
        >
          {label}
        </span>
        <button
          type="button"
          onClick={onNew}
          className="btn btn-accent"
          style={{ padding: '10px 18px', fontSize: '14px', fontWeight: 600 }}
        >
          <Plus className="h-4 w-4" />
          New
        </button>
      </div>
    </>
  )
}
