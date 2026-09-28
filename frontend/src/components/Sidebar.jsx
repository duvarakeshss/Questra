import { useState } from 'react'

import { Brand, Close, LogOut, Plus, Trash, User } from './Icons'

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

function meta(conversation) {
  const count = conversation.messages.length
  return `${timeAgo(conversation.createdAt)} · ${count} ${count === 1 ? 'message' : 'messages'}`
}

function hasResults(conversation) {
  return conversation.messages.some((message) => message.kind === 'results')
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  open,
  onClose,
  account,
  onSignIn,
  onSignOut,
}) {
  const [confirmId, setConfirmId] = useState(null)
  const groups = groupConversations([...conversations].sort((a, b) => b.createdAt - a.createdAt))

  function requestDelete(conversation) {
    if (hasResults(conversation) && confirmId !== conversation.id) {
      setConfirmId(conversation.id)
      return
    }
    setConfirmId(null)
    onDelete(conversation.id)
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-inverse-surface/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`glass fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-outline-variant transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
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
                    const isConfirming = confirmId === conversation.id
                    return (
                      <li key={conversation.id} className="group relative">
                        <button
                          type="button"
                          onClick={() => onSelect(conversation.id)}
                          title={conversation.title}
                          className={`w-full rounded-lg px-3 py-2 pr-10 text-left transition-colors ${
                            isActive
                              ? 'bg-primary/12 text-on-surface'
                              : 'text-on-surface-variant hover:bg-black/[0.04] hover:text-on-surface'
                          }`}
                        >
                          <p className="truncate text-body-sm font-medium">{conversation.title}</p>
                          <p className="mt-0.5 truncate text-caption text-on-surface-variant/80">
                            {meta(conversation)}
                          </p>
                        </button>

                        {onDelete && !isConfirming && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              requestDelete(conversation)
                            }}
                            className="absolute right-1.5 top-1.5 rounded-md p-1.5 text-on-surface-variant opacity-0 transition-opacity hover:bg-black/[0.06] hover:text-error focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label={`Delete search: ${conversation.title}`}
                            title="Delete search"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {isConfirming && (
                          <div className="absolute inset-0 z-10 flex items-center justify-between gap-2 rounded-lg bg-surface-container/95 px-3 backdrop-blur-sm">
                            <span className="text-body-sm text-on-surface">Delete this search?</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmId(null)
                                  onDelete(conversation.id)
                                }}
                                className="rounded-md bg-error px-2 py-1 text-caption font-semibold text-on-error"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="rounded-md px-2 py-1 text-caption text-on-surface-variant hover:bg-black/[0.06] hover:text-on-surface"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
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
