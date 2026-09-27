import { useEffect, useRef, useState } from 'react'
import Sidebar from './components/Sidebar'
import Composer from './components/Composer'
import ChatMessage from './components/ChatMessage'
import { Brand, Menu } from './components/Icons'
import { extractError, generateSuggestions, search } from './services/api'

const STORAGE_KEY = 'questra.conversations.v1'

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function createConversation() {
  return { id: uid(), createdAt: Date.now(), title: 'New Investigation', messages: [] }
}

function titleFor(inputs) {
  const text = inputs.text?.trim().replace(/\s+/g, ' ')
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text
  if (inputs.image) return 'CV Vision Search'
  if (inputs.audio) return 'Spectral Vox Search'
  return 'New Investigation'
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

// Session ID generator (short investigation code)
let _sessionSeq = 4091
function getSessionCode() {
  return `INV_${_sessionSeq}_SEARCH`
}

export default function App() {
  const [conversations, setConversations] = useState(() => loadConversations() ?? [createConversation()])
  const [activeId, setActiveId] = useState(() => conversations[0].id)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      message: 'Reading your input and drafting query pathways',
    }
    appendMessages([userMessage, pending], titleFor(inputs))

    try {
      const data = await generateSuggestions(inputs)
      replaceMessage(pending.id, {
        id: pending.id,
        role: 'assistant',
        kind: 'suggestions',
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        inputs,
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

  async function handleSelectQuery(query) {
    if (busy || !query) return
    setError(null)
    setBusy(true)

    const userMessage = { id: uid(), role: 'user', kind: 'text', text: query }
    const pending = {
      id: uid(),
      role: 'assistant',
      kind: 'thinking',
      message: 'Searching corpus and reranking results',
    }
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
      message: 'Synthesizing alternative intent pathways',
    })

    try {
      const data = await generateSuggestions(inputs)
      replaceMessage(messageId, {
        id: messageId,
        role: 'assistant',
        kind: 'suggestions',
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        inputs,
      })
    } catch (err) {
      replaceMessage(messageId, {
        id: messageId,
        role: 'assistant',
        kind: 'error',
        message: extractError(err),
      })
    } finally {
      setBusy(false)
    }
  }

  function handleNewSearch() {
    _sessionSeq += 1
    const conversation = createConversation()
    setConversations((prev) => [conversation, ...prev])
    setActiveId(conversation.id)
    setError(null)
    setSidebarOpen(false)
  }

  function handleSelectConversation(id) {
    setActiveId(id)
    setError(null)
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        conversations={conversations.filter((conversation) => conversation.messages.length > 0)}
        activeId={active.id}
        onSelect={handleSelectConversation}
        onNew={handleNewSearch}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top header bar — visible on all sizes */}
        <header className="flex items-center justify-between border-b border-outline-variant bg-surface-lowest/90 px-space-md py-2.5 shadow-header backdrop-blur-md">
          <div className="flex items-center gap-space-sm">
            {/* Mobile menu toggle */}
            <button
              type="button"
              className="btn btn-ghost p-1.5 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </button>
            {/* Brand — desktop shows it here since sidebar has it, mobile needs it */}
            <div className="flex items-center gap-space-sm md:hidden">
              <Brand className="h-7 w-7 shrink-0" />
              <div className="flex flex-col leading-none">
                <span className="font-sans text-[13px] font-semibold tracking-[-0.01em] text-on-surface uppercase">
                  QUESTRA
                </span>
              </div>
            </div>
            {/* Desktop — session indicator */}
            <div className="hidden md:flex items-center gap-space-xs bg-surface-low px-space-sm py-1 rounded border border-outline-variant">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
              <span className="font-mono text-label-code-sm text-on-surface-variant">
                INDEX KERNEL: BM25+COLBERT_V2
              </span>
            </div>
            <span className="hidden md:inline font-mono text-label-code-sm text-secondary font-medium">
              SESSION: {getSessionCode()}
            </span>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-space-xs">
            <div className="hidden md:flex items-center gap-space-xs bg-surface-low px-space-sm py-1.5 rounded border border-outline-variant">
              <span className="h-2 w-2 rounded-full bg-secondary" />
              <span className="font-mono text-label-technical text-on-surface-variant">
                Index Online · 48.2B Docs
              </span>
            </div>
            <button
              type="button"
              onClick={handleNewSearch}
              className="flex items-center gap-1 rounded bg-primary px-space-sm py-1.5 font-mono text-label-technical text-on-primary transition-all hover:bg-clay-deep"
            >
              <span className="text-[16px] font-light">+</span>
              <span className="hidden sm:inline">New Investigation</span>
            </button>
          </div>
        </header>

        {/* Main content */}
        {isEmpty ? (
          /* ─── Empty state: Multimodal Command Console ─── */
          <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-space-md py-10">
            <div className="w-full max-w-2xl animate-fade-up">
              {/* Console header */}
              <div className="pb-space-lg text-center">
                <div className="mb-space-md flex justify-center">
                  <Brand className="h-14 w-14" />
                </div>
                <div className="flex items-center justify-center gap-space-xs mb-space-sm">
                  <span className="font-mono text-label-technical text-primary uppercase font-bold tracking-widest">
                    [STAGE 01 // MULTIMODAL COMMAND CONSOLE]
                  </span>
                </div>
                <h1 className="text-headline-lg font-semibold tracking-tight text-on-surface">
                  Multimodal Search Console
                </h1>
                <p className="mx-auto mt-space-sm max-w-lg text-body-md leading-relaxed text-on-surface-variant">
                  Advanced retrieval fusing text, computer vision, and acoustic seeds into verified research pathways.
                  Describe it in words, show a picture, or say it out loud.
                </p>

                {/* Real-time status bar */}
                <div className="mt-space-md inline-flex flex-wrap items-center gap-space-sm rounded border border-outline-variant bg-surface-low px-space-sm py-space-xs text-center">
                  <div className="flex items-center gap-1 font-mono text-label-code-sm text-on-surface-variant">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-on-surface font-semibold">18ms</span>
                    <span className="text-outline">LATENCY</span>
                  </div>
                  <span className="text-outline-variant">|</span>
                  <div className="flex items-center gap-1 font-mono text-label-code-sm text-on-surface-variant">
                    <span className="text-on-surface font-semibold">3</span>
                    <span className="text-outline">MODALITIES</span>
                  </div>
                  <span className="text-outline-variant">|</span>
                  <div className="flex items-center gap-1 font-mono text-label-code-sm text-on-surface-variant">
                    <span className="text-secondary font-semibold">48.2B</span>
                    <span className="text-outline">INDEXED</span>
                  </div>
                </div>
              </div>

              {error && (
                <p className="pb-space-sm text-center font-mono text-label-code-sm text-error">
                  {error}
                </p>
              )}

              <Composer onSubmit={handleSubmit} onError={setError} disabled={busy} autoFocus />
            </div>
          </div>
        ) : (
          /* ─── Conversation view ─── */
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
                  />
                ))}
              </div>
            </div>

            {/* Sticky composer footer */}
            <div className="border-t border-outline-variant bg-surface-lowest/90 px-space-md py-space-sm backdrop-blur-md">
              <div className="mx-auto w-full max-w-3xl">
                {error && (
                  <p className="pb-space-xs font-mono text-label-code-sm text-error">{error}</p>
                )}
                <Composer onSubmit={handleSubmit} onError={setError} disabled={busy} />
                <p className="pt-space-xs text-center font-mono text-caption text-on-surface-variant">
                  Questra synthesizes intent pathways before searching. Review queries before trusting results.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
