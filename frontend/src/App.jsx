import { useEffect, useRef, useState } from 'react'

import AuthModal from './components/AuthModal'
import ChatMessage from './components/ChatMessage'
import Composer from './components/Composer'
import QuotaBadge from './components/QuotaBadge'
import Sidebar from './components/Sidebar'
import { Brand, Menu } from './components/Icons'
import { extractError, generateSuggestions, getMe, isQuotaError, isUnauthorized, search } from './services/api'
import { useAuth } from './hooks/useAuth'

const STORAGE_KEY = 'questra.conversations.v2'
const GATE_MESSAGE = "You've used your free queries. Create a free account to keep searching."
const EXPIRED_MESSAGE = 'Your session expired. Sign in again to continue.'

const EXAMPLES = [
  'A cozy reading nook under $300',
  'Running shoes like this but cheaper',
  'Explain this chart to me in plain words',
]

const READS = [
  ['Image', 'Objects, setting, and style in a photo'],
  ['Voice', 'What you said, transcribed cleanly'],
  ['Notes', 'The intent behind your few words'],
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

  function handleSessionExpired(messageId) {
    auth.signOut()
    setAccount(null)
    setAuthMessage(EXPIRED_MESSAGE)
    setAuthOpen(true)
    if (messageId) {
      replaceMessage(messageId, {
        id: messageId,
        role: 'assistant',
        kind: 'error',
        message: EXPIRED_MESSAGE,
      })
    }
  }

  function handleGenerationError(messageId, inputs, err) {
    if (isQuotaError(err)) {
      gateRef.current = { id: messageId, inputs }
      replaceMessage(messageId, { id: messageId, role: 'assistant', kind: 'gate', message: GATE_MESSAGE })
      setAuthMessage(GATE_MESSAGE)
      setAuthOpen(true)
      return
    }
    if (isUnauthorized(err)) {
      handleSessionExpired(messageId)
      return
    }
    replaceMessage(messageId, {
      id: messageId,
      role: 'assistant',
      kind: 'error',
      message: extractError(err),
    })
  }

  async function runGeneration(messageId, inputs) {
    try {
      const data = await generateSuggestions(inputs)
      if (data.quota) {
        setAccount((prev) => ({ ...(prev ?? {}), authenticated: data.quota.authenticated, quota: data.quota }))
      }
      replaceMessage(messageId, {
        id: messageId,
        role: 'assistant',
        kind: 'suggestions',
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        inputs,
      })
    } catch (err) {
      handleGenerationError(messageId, inputs, err)
    } finally {
      setBusy(false)
    }
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
    await runGeneration(pending.id, inputs)
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
      if (isUnauthorized(err)) {
        handleSessionExpired(pending.id)
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

    await runGeneration(messageId, inputs)
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
        <header className="flex items-center justify-between gap-space-md border-b border-outline-variant px-space-md py-2.5">
          <div className="flex min-w-0 items-center gap-space-sm">
            <button type="button" className="btn-icon md:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu />
            </button>
            <div className="flex items-center gap-2 md:hidden">
              <Brand className="h-6 w-6" />
              <span className="wordmark">Questra</span>
            </div>
            <p className="eyebrow hidden truncate md:block">Describe it · photograph it · say it</p>
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
            <button type="button" onClick={handleNewSearch} className="btn btn-primary whitespace-nowrap py-2">
              New search
            </button>
          </div>
        </header>

        {isEmpty ? (
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto grid w-full max-w-6xl gap-space-xl px-space-md py-12 md:grid-cols-12 md:px-space-lg">
              <div className="md:col-span-7 md:pr-space-lg">
                <p className="eyebrow">Multimodal query discovery</p>
                <h1 className="mt-space-sm font-display text-display-hero text-on-surface">
                  Find it by describing it
                </h1>
                <p className="mt-space-md max-w-xl text-body-lg text-on-surface-variant">
                  Questra turns a photo, a voice note, or a few loose words into clear search queries you can
                  review and refine, or send straight to results.
                </p>

                {error && <p className="mt-space-md text-body-sm text-error">{error}</p>}

                <div className="mt-space-lg">
                  <Composer onSubmit={handleSubmit} onSearch={handleSelectQuery} onError={setError} disabled={busy} autoFocus />
                </div>

                <div className="mt-space-xl">
                  <p className="eyebrow">Try one</p>
                  <ol className="mt-space-sm border-t border-outline-variant">
                    {EXAMPLES.map((example, index) => (
                      <li key={example} className="border-b border-outline-variant">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleSubmit({ text: example })}
                          className="group flex w-full items-baseline gap-space-md py-3 text-left"
                        >
                          <span className="font-mono text-label-code-sm text-on-surface-variant">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="flex-1 text-body-md text-on-surface transition-colors group-hover:text-primary">
                            {example}
                          </span>
                          <span className="font-mono text-label-code-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                            Use
                          </span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <aside className="md:col-span-5">
                <div className="border-t border-outline-variant pt-space-md">
                  <p className="eyebrow">What it reads</p>
                  <dl className="mt-space-sm">
                    {READS.map(([label, value]) => (
                      <div
                        key={label}
                        className="grid grid-cols-[4.5rem_1fr] gap-space-md border-b border-outline-variant py-3"
                      >
                        <dt className="font-mono text-label-code-sm uppercase text-on-surface-variant">{label}</dt>
                        <dd className="text-body-sm text-on-surface">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-space-md text-body-sm leading-relaxed text-on-surface-variant">
                    All three are fused into scored, diverse query ideas before a single search runs.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-3xl px-space-md py-space-lg md:px-space-lg">
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

            <div className="border-t border-outline-variant px-space-md py-space-sm">
              <div className="mx-auto w-full max-w-3xl">
                {error && <p className="pb-space-xs text-body-sm text-error">{error}</p>}
                <Composer onSubmit={handleSubmit} onSearch={handleSelectQuery} onError={setError} disabled={busy} />
                <p className="pt-space-xs text-center font-mono text-caption text-on-surface-variant">
                  Enter drafts query ideas · Search now runs your words directly
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
