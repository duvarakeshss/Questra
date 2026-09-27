import { Brand, Close, Plus } from './Icons'

function groupConversations(conversations) {
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const weekAgo = startOfToday - 6 * 24 * 60 * 60 * 1000

  const groups = [
    { label: 'Today', items: [] },
    { label: 'Last 7 days', items: [] },
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
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Sidebar({ conversations, activeId, onSelect, onNew, open, onClose }) {
  const groups = groupConversations(
    [...conversations].sort((a, b) => b.createdAt - a.createdAt),
  )

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-on-surface/20 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-outline-variant bg-surface-lowest shadow-header transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-space-md py-space-sm border-b border-outline-variant">
          <div className="flex items-center gap-space-sm">
            <Brand className="h-8 w-8 shrink-0" />
            <div className="flex flex-col leading-none gap-0.5">
              <span className="font-sans text-[12px] font-bold tracking-[0.06em] text-on-surface uppercase">
                QUESTRA
              </span>
              <span className="font-mono text-[9px] text-on-surface-variant tracking-[0.04em]">
                LABS / v2.4 IR
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost md:hidden p-1.5"
            onClick={onClose}
            aria-label="Close menu"
          >
            <Close />
          </button>
        </div>

        {/* New investigation button */}
        <div className="px-space-md pb-space-sm pt-space-sm">
          <button
            type="button"
            className="flex w-full items-center gap-space-xs rounded border border-outline-variant bg-primary px-space-sm py-2 font-mono text-label-technical text-on-primary transition-colors hover:bg-clay-deep"
            onClick={onNew}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Investigation</span>
          </button>
        </div>

        {/* Investigations header */}
        <div className="flex items-center justify-between px-space-md pb-space-xs">
          <span className="font-mono text-label-technical uppercase text-on-surface-variant">
            Investigations
          </span>
          {conversations.length > 0 && (
            <span className="font-mono text-label-code-sm bg-surface-container px-space-xs py-0.5 rounded text-on-surface-variant">
              ACTIVE ({conversations.length})
            </span>
          )}
        </div>

        {/* Navigation list */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-space-sm pb-space-md">
          {groups.length === 0 ? (
            <div className="px-space-sm py-6 text-center">
              <p className="font-mono text-label-code-sm text-on-surface-variant">
                No investigations yet.
              </p>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Start a search to begin.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-space-md">
                <p className="px-space-xs pb-1.5 font-mono text-label-code-sm text-on-surface-variant uppercase">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map((conversation, index) => {
                    const isActive = conversation.id === activeId
                    const invId = `INV_${String(4090 - index).padStart(4, '0')}`
                    return (
                      <li key={conversation.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(conversation.id)}
                          title={conversation.title}
                          className={`w-full rounded p-space-sm text-left transition-all ${
                            isActive
                              ? 'bg-surface-high text-on-surface'
                              : 'bg-surface-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono text-label-code-sm font-semibold text-secondary">
                              {invId}
                            </span>
                            <span className="font-mono text-caption text-on-surface-variant">
                              {timeAgo(conversation.createdAt)}
                            </span>
                          </div>
                          <p className="truncate text-body-sm font-medium text-on-surface">
                            {conversation.title}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="font-mono text-label-code-sm bg-surface-highest px-space-xs py-0.5 rounded text-on-surface-variant">
                              {conversation.messages.filter(m => m.kind === 'results').length} Results
                            </span>
                            <span className="font-mono text-label-code-sm bg-surface-highest px-space-xs py-0.5 rounded text-on-surface-variant">
                              {conversation.messages.length} Steps
                            </span>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        {/* Footer — index status */}
        <div className="border-t border-outline-variant px-space-md py-space-sm bg-surface-low">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-mono text-label-technical text-on-surface-variant uppercase">
              Vector Cache
            </span>
            <span className="font-mono text-label-code-sm text-on-surface">82%</span>
          </div>
          <div className="progress-bar">
            <div className="bg-primary h-full w-[82%] transition-all" />
          </div>
          <div className="flex items-center gap-1.5 mt-space-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            <span className="font-mono text-label-code-sm text-on-surface-variant">
              Index Online · 48.2B Docs
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}
