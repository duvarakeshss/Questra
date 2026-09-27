import { Brand, Close, LogOut, Plus, User } from './Icons'

function groupConversations(conversations) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekAgo = startOfToday - 6 * 24 * 60 * 60 * 1000

  const groups = [
    { label: 'Today', items: [] },
    { label: 'Previous 7 days', items: [] },
    { label: 'Earlier', items: [] },
  ]

  for (const conversation of conversations) {
    if (conversation.createdAt >= startOfToday) groups[0].items.push(conversation)
    else if (conversation.createdAt >= weekAgo) groups[1].items.push(conversation)
    else groups[2].items.push(conversation)
  }

  return groups.filter((group) => group.items.length > 0)
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  open,
  onClose,
  account,
  onSignIn,
  onSignOut,
}) {
  const groups = groupConversations([...conversations].sort((a, b) => b.createdAt - a.createdAt))

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-inverse-surface/30 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-lowest transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-space-md py-space-md">
          <div className="flex items-center gap-2.5">
            <Brand className="h-8 w-8" />
            <span className="wordmark">Questra</span>
          </div>
          <button type="button" className="btn-icon md:hidden" onClick={onClose} aria-label="Close menu">
            <Close />
          </button>
        </div>

        <div className="px-space-sm pb-space-sm">
          <button type="button" className="btn btn-primary w-full" onClick={onNew}>
            <Plus className="h-4 w-4" />
            New search
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-space-sm pb-space-md">
          {groups.length === 0 ? (
            <div className="px-space-sm py-6 text-center">
              <p className="text-body-sm text-on-surface-variant">No searches yet.</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant/70">Your history will appear here.</p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-space-md">
                <p className="px-2 pb-1.5 text-caption text-on-surface-variant/80">{group.label}</p>
                <ul className="space-y-1">
                  {group.items.map((conversation) => {
                    const isActive = conversation.id === activeId
                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(conversation.id)}
                          title={conversation.title}
                          className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                            isActive
                              ? 'bg-surface-high text-on-surface'
                              : 'text-on-surface-variant hover:bg-surface-low hover:text-on-surface'
                          }`}
                        >
                          <p className="truncate text-body-sm font-medium">{conversation.title}</p>
                          <p className="mt-0.5 text-caption text-on-surface-variant/80">
                            {timeAgo(conversation.createdAt)} · {conversation.messages.length} messages
                          </p>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-outline-variant p-space-sm">
          {account?.authenticated ? (
            <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-body-sm font-semibold text-on-primary">
                {(account.email || 'you').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body-sm font-medium text-on-surface">{account.email}</p>
                <p className="text-caption text-on-surface-variant">Unlimited searches</p>
              </div>
              <button type="button" className="btn-icon" onClick={onSignOut} aria-label="Sign out" title="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-secondary w-full" onClick={onSignIn}>
              <User className="h-4 w-4" />
              Sign in
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
