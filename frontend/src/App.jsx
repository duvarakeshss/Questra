import { useEffect, useRef, useState } from 'react'

import AuthModal from './components/AuthModal'
import ChatMessage from './components/ChatMessage'
import Composer from './components/Composer'
import QuotaBadge from './components/QuotaBadge'
import Sidebar from './components/Sidebar'
import { Brand, Menu } from './components/Icons'
import { extractError, generateSuggestions, getMe, isQuotaError, search } from './services/api'
import { useAuth } from './hooks/useAuth'

const STORAGE_KEY = 'questra.conversations.v2'

const EXAMPLES = [
  'A cozy reading nook under $300',
  'Running shoes like this but cheaper',
  'Explain this chart to me in plain words',
]

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function createConversation() {
  return { id: uid(), createdAt: Date.now(), title: 'New search', messages: [] }
}

function titleFor(inputs) {
  const text = inputs.text?.trim().replace(/\s+/g, ' ')
  if (text) return text.length > 46 ? `${text.slice(0, 46)}…` : text
  if (inputs.image) return 'Image search'
  if (inputs.audio) return 'Voice search'
  return 'New search'
}

function loadConversations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch {
    /* ignore unreadable storage */
  }
  return null
}

function persist(conversations) {
  try {
    const settled = conversations.map((conversation) => ({
      ...conversation,
      messages: conversation.messages.filter((message) => message.kind !== 'thinking'),
    }))
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settled, (key, value) => {
        if (key === 'inputs') return undefined
        if (typeof value === 'string' && value.startsWith('blob:')) return undefined
        return value
      }),
    )
  } catch {
    /* ignore storage quota errors */
  }
}

export default function App() {
  const auth = useAuth()
  const [conversations, setConversations] = useState(() => loadConversations() ?? [createConversation()])
  const [activeId, setActiveId] = useState(() => conversations[0].id)
  const [account, setAccount] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMessage, setAuthMessage] = useState(null)
  const gateRef = useRef(null)
  const scrollRef = useRef(null)

  const active = conversations.find((conversation) => conversation.id === activeId) ?? conversations[0]
  const isEmpty = active.messages.length === 0

  useEffect(() => {
    persist(conversations)
  }, [conversations])

  useEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [active.messages.length, busy])

  useEffect(() => {
    let cancelled = false
    getMe()
      .then((data) => {
        if (!cancelled) setAccount(data)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [auth.session])

  function patchActive(updater) {
    setConversations((prev) => prev.map((c) => (c.id === activeId ? updater(c) : c)))
  }

  function replaceMessage(id, next) {
    patchActive((c) => ({ ...c, messages: c.messages.map((m) => (m.id === id ? next : m)) }))
  }

  function appendMessages(extra, title) {
    patchActive((c) => ({
      ...c,
      title: c.messages.length === 0 && title ? title : c.title,
      messages: [...c.messages, ...extra],
    }))
  }

  async function handleSubmit(inputs) {
    if (busy) return
    setError(null)
    setBusy(true)

    const userMessage = {
      id: uid(),
      role: 'user',
      kind: 'input',
      text: inputs.text,
      image: inputs.image ? { name: inputs.image.name, url: URL.createObjectURL(inputs.image) } : null,
      audio: inputs.audio ? { name: inputs.audio.name } : null,
    }
    const pending = {
      id: uid(),
      role: 'assistant',
      kind: 'thinking',
      message: 'Reading your input and drafting query ideas',
    }
    appendMessages([userMessage, pending], titleFor(inputs))

    try {
      const data = await generateSuggestions(inputs)
      if (data.quota) setAccount((prev) => ({ ...(prev ?? {}), authenticated: data.quota.authenticated, quota: data.quota }))
      replaceMessage(pending.id, {
        id: pending.id,
        role: 'assistant',
        kind: 'suggestions',
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        inputs,
      })
    } catch (err) {
      if (isQuotaError(err)) {
        gateRef.current = { id: pending.id, inputs }
        replaceMessage(pending.id, {
          id: pending.id,
          role: 'assistant',
          kind: 'gate',
          message: "You've used your free queries. Create a free account to keep searching.",
        })
        setAuthMessage("You've used your free queries. Create a free account to keep searching.")
        setAuthOpen(true)
      } else {
        replaceMessage(pending.id, {
          id: pending.id,
          role: 'assistant',
          kind: 'error',
          message: extractError(err),
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleSelectQuery(query) {
    if (busy || !query) return
    setError(null)
    setBusy(true)

    const userMessage = { id: uid(), role: 'user', kind: 'text', text: query }
    const pending = { id: uid(), role: 'assistant', kind: 'thinking', message: 'Searching and reranking results' }
    appendMessages([userMessage, pending], query)

    try {
      const data = await search(query)
      replaceMessage(pending.id, {
        id: pending.id,
        role: 'assistant',
        kind: 'results',
        query: data.query || query,
        results: data.results ?? [],
      })
    } catch (err) {
      replaceMessage(pending.id, {
        id: pending.id,
        role: 'assistant',
        kind: 'error',
        message: extractError(err),
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleRegenerate(messageId, inputs) {
    if (busy || !inputs) return
    setError(null)
    setBusy(true)
    replaceMessage(messageId, {
      id: messageId,
      role: 'assistant',
      kind: 'thinking',
      message: 'Drafting fresh query ideas',
    })

    try {
      const data = await generateSuggestions(inputs)
      if (data.quota) setAccount((prev) => ({ ...(prev ?? {}), authenticated: data.quota.authenticated, quota: data.quota }))
      replaceMessage(messageId, {
        id: messageId,
        role: 'assistant',
        kind: 'suggestions',
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        inputs,
      })
    } catch (err) {
      if (isQuotaError(err)) {
        gateRef.current = { id: messageId, inputs }
        replaceMessage(messageId, {
          id: messageId,
          role: 'assistant',
          kind: 'gate',
          message: "You've used your free queries. Create a free account to keep searching.",
        })
        setAuthMessage("You've used your free queries. Create a free account to keep searching.")
        setAuthOpen(true)
      } else {
        replaceMessage(messageId, {
          id: messageId,
          role: 'assistant',
          kind: 'error',
          message: extractError(err),
        })
      }
    } finally {
      setBusy(false)
    }
  }

  async function handleAuthenticated() {
    setAuthOpen(false)
    setAuthMessage(null)
    try {
      setAccount(await getMe())
    } catch {
      /* quota refresh is best-effort */
    }
    const gate = gateRef.current
    gateRef.current = null
    if (gate) handleRegenerate(gate.id, gate.inputs)
  }

  function handleNewSearch() {
    const conversation = createConversation()
    setConversations((prev) => [conversation, ...prev])
    setActiveId(conversation.id)
    setError(null)
    setSidebarOpen(false)
  }

  function handleDeleteConversation(id) {
    const remaining = conversations.filter((conversation) => conversation.id !== id)
    if (remaining.length === 0) {
      const fresh = createConversation()
      setConversations([fresh])
      setActiveId(fresh.id)
    } else {
      setConversations(remaining)
      if (id === activeId) setActiveId(remaining[0].id)
    }
    setError(null)
  }

  function handleSignOut() {
    auth.signOut()
    setAccount(null)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        conversations={conversations.filter((conversation) => conversation.messages.length > 0)}
        activeId={active.id}
        onSelect={(id) => {
          setActiveId(id)
          setError(null)
          setSidebarOpen(false)
        }}
        onNew={handleNewSearch}
        onDelete={handleDeleteConversation}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        account={account}
        onSignIn={() => {
          setAuthMessage(null)
          setAuthOpen(true)
        }}
        onSignOut={handleSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass flex items-center justify-between border-b border-white/10 px-space-md py-2.5">
          <div className="flex items-center gap-space-sm">
            <button type="button" className="btn-icon md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Brand className="h-7 w-7" />
              <span className="font-display text-[15px] font-semibold tracking-tight text-on-surface">Questra</span>
            </div>
            <p className="hidden text-body-sm text-on-surface-variant md:block">
              Describe it in words, show a picture, or say it out loud.
            </p>
          </div>

          <div className="flex items-center gap-space-sm">
            <QuotaBadge
              quota={account?.quota}
              authenticated={Boolean(account?.authenticated)}
              email={account?.email}
              onSignIn={() => {
                setAuthMessage(null)
                setAuthOpen(true)
              }}
              onSignOut={handleSignOut}
            />
            <button type="button" onClick={handleNewSearch} className="btn btn-primary py-2">
              New search
            </button>
          </div>
        </header>

        {isEmpty ? (
          <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-space-md py-10">
            <div className="aurora pointer-events-none absolute inset-x-0 top-0 h-[72%] animate-drift" aria-hidden="true" />
            <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 h-80" aria-hidden="true" />
            <div className="relative w-full max-w-2xl animate-fade-up">
              <div className="pb-space-lg text-center">
                <div className="mx-auto mb-space-md flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-on-primary shadow-glow">
                  <Brand className="h-9 w-9" />
                </div>
                <h1 className="font-display text-display-hero text-on-surface">
                  Find it by describing it
                </h1>
                <p className="mx-auto mt-space-sm max-w-lg text-body-lg text-on-surface-variant">
                  Questra turns a photo, a voice note, or a few loose words into clear search queries you can
                  review and refine before you commit.
                </p>
              </div>

              {error && (
                <p className="pb-space-sm text-center text-body-sm text-error">{error}</p>
              )}

              <Composer onSubmit={handleSubmit} onError={setError} disabled={busy} autoFocus />

              <div className="mt-space-md flex flex-wrap justify-center gap-2">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="chip"
                    disabled={busy}
                    onClick={() => handleSubmit({ text: example })}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl space-y-space-xl px-space-md py-space-xl md:px-space-lg">
                {active.messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onSelectQuery={handleSelectQuery}
                    onRegenerate={handleRegenerate}
                    onError={setError}
                    onSignIn={() => {
                      setAuthMessage(null)
                      setAuthOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="glass border-t border-outline-variant px-space-md py-space-sm">
              <div className="mx-auto w-full max-w-3xl">
                {error && <p className="pb-space-xs text-body-sm text-error">{error}</p>}
                <Composer onSubmit={handleSubmit} onError={setError} disabled={busy} />
                <p className="pt-space-xs text-center text-caption text-on-surface-variant">
                  Review the suggested queries before trusting the results.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        auth={auth}
        message={authMessage}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  )
}
