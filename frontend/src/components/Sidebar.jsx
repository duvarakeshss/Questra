import { useState } from 'react'

import { Close, Plus, User } from './Icons'

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

export default function Sidebar({
  entries,
  activeId,
  onSelect,
  onDelete,
  onNew,
  account,
  onSignIn,
  onSignOut,
}) {
  const [recentOpen, setRecentOpen] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const sorted = [...entries].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <>
      {/* ─── Dock ─────────────────── */}
      <nav className="dock glass">
        <button
          type="button"
          className="dbtn on"
          data-tip="New search"
          onClick={onNew}
          aria-label="New search"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <button
          type="button"
          className={`dbtn${recentOpen ? ' on' : ''}`}
          data-tip="Recent"
          onClick={() => setRecentOpen(!recentOpen)}
          aria-label="Toggle recent searches"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </button>
        <div className="sep" />
        {account?.authenticated ? (
          <button
            type="button"
            className="dbtn"
            data-tip="Sign out"
            onClick={onSignOut}
            aria-label="Sign out"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            className="dbtn"
            data-tip="Sign in"
            onClick={onSignIn}
            aria-label="Sign in"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
          </button>
        )}
      </nav>

      {/* ─── Recent popover ────────── */}
      <aside className={`recent-popover glass${recentOpen ? ' open' : ''}`}>
        <div className="eyebrow">Recent</div>
        {sorted.length === 0 ? (
          <p style={{ fontSize: '13.5px', lineHeight: 1.5, color: 'var(--muted)', marginTop: '10px' }}>
            No searches yet. Your sessions will collect here.
          </p>
        ) : (
          <ul>
            {sorted.map((entry) => {
              const isConfirming = confirmId === entry.id
              return (
                <li
                  key={entry.id}
                  style={{ position: 'relative' }}
                >
                  {isConfirming ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '9px 10px',
                      }}
                    >
                      <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Delete?</span>
                      <span style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmId(null)
                            onDelete(entry.id)
                          }}
                          style={{
                            background: '#DC2626',
                            color: '#fff',
                            border: 0,
                            borderRadius: '9999px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          style={{
                            background: 'transparent',
                            color: 'var(--muted)',
                            border: 0,
                            padding: '4px 10px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          No
                        </button>
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        onSelect(entry.id)
                        setRecentOpen(false)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        setConfirmId(entry.id)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '9px 10px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        color: entry.id === activeId ? 'var(--a1)' : 'var(--text)',
                        background: entry.id === activeId ? 'rgba(212,177,106,0.08)' : 'transparent',
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onSelect(entry.id)
                          setRecentOpen(false)
                        }
                      }}
                    >
                      <span style={{
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {entry.title}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(156,151,140,0.5)', flexShrink: 0 }}>
                        {timeAgo(entry.createdAt)}
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </aside>

      {/* ─── Click-away overlay ────── */}
      {recentOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 18 }}
          onClick={() => setRecentOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  )
}
