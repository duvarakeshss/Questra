import { useEffect, useRef, useState } from 'react'

import Aurora from './components/Aurora'
import AuthModal from './components/AuthModal'
import Composer from './components/ComposerBar'
import Conversation from './components/Conversation'
import Sidebar from './components/Sidebar'
import SuggestionsPanel from './components/SuggestionsPanel'
import TopBar from './components/TopBar'
import { extractError, generateSuggestions, getMe, isQuotaError, isUnauthorized, search } from './services/api'
import { useAuth } from './hooks/useAuth'

const STORAGE_KEY = 'questra.console.v2'
const LEGACY_STORAGE_KEY = 'questra.console.v1'
const GATE_MESSAGE = "You've used your free queries. Create a free account to keep searching."
const EXPIRED_MESSAGE = 'Your session expired. Sign in again to continue.'

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function titleFor(inputs) {
  const text = inputs.text?.trim().replace(/\s+/g, ' ')
  if (text) return text.length > 48 ? `${text.slice(0, 48)}…` : text
  if (inputs.image) return 'Image search'
  if (inputs.audio) return 'Voice search'
  return 'Untitled search'
}

function makeTurn(inputs) {
  return {
    id: uid(),
    createdAt: Date.now(),
    input: {
      text: inputs.text?.trim() || '',
      imageName: inputs.image?.name || null,
      audioName: inputs.audio?.name || null,
    },
    context: null,
    suggestions: [],
    query: null,
    results: null,
    loading: 'reading',
    error: null,
    gate: false,
  }
}

function normalizeTurn(turn) {
  return {
    id: turn.id ?? uid(),
    createdAt: turn.createdAt ?? Date.now(),
    input: turn.input ?? { text: '', imageName: null, audioName: null },
    context: turn.context ?? null,
    suggestions: Array.isArray(turn.suggestions) ? turn.suggestions : [],
    query: turn.query ?? null,
    results: Array.isArray(turn.results) ? turn.results : null,
    loading: null,
    error: turn.error ?? null,
    gate: false,
  }
}

// Migrate a pre-conversation entry (single board) into a one-turn conversation so
// existing local history is preserved rather than discarded.
function normalizeEntry(entry) {
  if (Array.isArray(entry.turns)) {
    return { ...entry, turns: entry.turns.map(normalizeTurn) }
  }
  const hasBoard = entry.suggestions?.length || entry.results || entry.context
  if (!hasBoard) return { ...entry, turns: [] }
  const legacyText = entry.query || (entry.title === 'Image search' || entry.title === 'Voice search' ? '' : entry.title || '')
  return {
    ...entry,
    turns: [
      normalizeTurn({
        createdAt: entry.createdAt,
        input: { text: typeof legacyText === 'string' ? legacyText : '' },
        context: entry.context,
        suggestions: entry.suggestions,
        query: entry.query,
        results: entry.results,
      }),
    ],
  }
}

function loadEntries() {
  for (const key of [STORAGE_KEY, LEGACY_STORAGE_KEY]) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeEntry)
    } catch {
      /* ignore unreadable storage */
    }
  }
  return null
}

function persist(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    /* ignore storage quota errors */
  }
}

export default function App() {
  const auth = useAuth()
  const bootRef = useRef(null)
  if (bootRef.current === null) {
    const stored = loadEntries() ?? []
    bootRef.current = { entries: stored, activeId: stored[0]?.id ?? null }
  }

  const [entries, setEntries] = useState(bootRef.current.entries)
  const [activeId, setActiveId] = useState(bootRef.current.activeId)
  const [draft, setDraft] = useState({ text: '', image: null, audio: null })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [account, setAccount] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMessage, setAuthMessage] = useState(null)

  // Real (non-serializable) inputs per turn so regenerate works with image/audio within a session.
  const inputsByTurnRef = useRef({})
  const pendingRef = useRef(null)
  const composerRefs = Composer.useComposerRefs()

  const busy = status !== 'idle'
  const activeEntry = entries.find((entry) => entry.id === activeId) ?? null
  const turns = activeEntry?.turns ?? []

  useEffect(() => {
    persist(entries)
  }, [entries])

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

  function patchEntry(id, updater) {
    setEntries((prev) => {
      const index = prev.findIndex((entry) => entry.id === id)
      if (index === -1) return prev
      const next = [...prev]
      next[index] = updater(next[index])
      return next
    })
  }

  function patchTurn(entryId, turnId, patch) {
    patchEntry(entryId, (entry) => ({
      ...entry,
      updatedAt: Date.now(),
      turns: entry.turns.map((turn) => (turn.id === turnId ? { ...turn, ...patch } : turn)),
    }))
  }

  function newSession() {
    setActiveId(null)
    setDraft({ text: '', image: null, audio: null })
    setError(null)
  }

  function openEntry(id) {
    if (!entries.some((entry) => entry.id === id)) return
    setActiveId(id)
    setError(null)
  }

  function deleteEntry(id) {
    const remaining = entries.filter((entry) => entry.id !== id)
    setEntries(remaining)
    if (id === activeId) setActiveId(remaining[0]?.id ?? null)
  }

  function handleUnauthorized() {
    auth.signOut()
    setAccount(null)
    setAuthMessage(EXPIRED_MESSAGE)
    setAuthOpen(true)
    setError(EXPIRED_MESSAGE)
  }

  async function runSuggestions(entryId, turnId, inputs) {
    setStatus('reading')
    setError(null)
    patchTurn(entryId, turnId, { loading: 'reading', error: null, gate: false })
    try {
      const data = await generateSuggestions(inputs)
      if (data.quota) {
        setAccount((prev) => ({ ...(prev ?? {}), authenticated: data.quota.authenticated, quota: data.quota }))
      }
      patchTurn(entryId, turnId, {
        suggestions: data.suggestions ?? [],
        context: data.context ?? null,
        loading: null,
      })
    } catch (err) {
      if (isQuotaError(err)) {
        pendingRef.current = { entryId, turnId, inputs }
        patchTurn(entryId, turnId, { loading: null, gate: true })
        setAuthMessage(GATE_MESSAGE)
        setAuthOpen(true)
      } else if (isUnauthorized(err)) {
        patchTurn(entryId, turnId, { loading: null })
        handleUnauthorized()
      } else {
        patchTurn(entryId, turnId, { loading: null, error: extractError(err) })
      }
    } finally {
      setStatus('idle')
    }
  }

  function handleDraft(inputs) {
    if (busy) return
    const text = inputs.text?.trim() || ''
    if (!inputs.image && !inputs.audio && !text) {
      setError('Add a description, image, or voice note before searching.')
      return
    }
    const turn = makeTurn(inputs)
    const entryId = activeId ?? uid()
    inputsByTurnRef.current[turn.id] = inputs

    if (entries.some((entry) => entry.id === entryId)) {
      patchEntry(entryId, (entry) => ({ ...entry, updatedAt: Date.now(), turns: [...entry.turns, turn] }))
    } else {
      setEntries((prev) => [
        ...prev,
        { id: entryId, title: titleFor(inputs), createdAt: Date.now(), updatedAt: Date.now(), turns: [turn] },
      ])
    }

    setActiveId(entryId)
    setDraft({ text: '', image: null, audio: null })
    setError(null)
    runSuggestions(entryId, turn.id, inputs)
  }

  function handleRegenerate(turnId) {
    if (busy || !activeId) return
    const inputs = inputsByTurnRef.current[turnId]
    if (inputs) {
      runSuggestions(activeId, turnId, inputs)
      return
    }
    const turn = turns.find((item) => item.id === turnId)
    if (turn?.input?.text) runSuggestions(activeId, turnId, { text: turn.input.text })
  }

  async function handleSearch(turnId, query) {
    const value = query?.trim()
    if (busy || !value || !activeId) return
    setStatus('searching')
    setError(null)
    patchTurn(activeId, turnId, { loading: 'searching', error: null })
    try {
      const data = await search(value)
      patchTurn(activeId, turnId, { loading: null, query: data.query || value, results: data.results ?? [] })
    } catch (err) {
      if (isUnauthorized(err)) {
        patchTurn(activeId, turnId, { loading: null })
        handleUnauthorized()
      } else {
        patchTurn(activeId, turnId, { loading: null, error: extractError(err) })
      }
    } finally {
      setStatus('idle')
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
    const pending = pendingRef.current
    if (pending) {
      pendingRef.current = null
      runSuggestions(pending.entryId, pending.turnId, pending.inputs)
    }
  }

  const canRegenerate = (turnId) => Boolean(inputsByTurnRef.current[turnId])

  const composerBar = (
    <Composer
      draft={draft}
      onDraftChange={setDraft}
      onSubmit={handleDraft}
      onError={setError}
      disabled={busy}
      status={status}
      recording={composerRefs.recording}
      onStartRecording={() => composerRefs.startRecording(setError, setDraft)}
      onStopRecording={composerRefs.stopRecording}
      imageInputRef={composerRefs.imageInputRef}
      audioInputRef={composerRefs.audioInputRef}
    />
  )

  return (
    <>
      {/* ─── Aurora background ─────── */}
      <Aurora />

      {/* ─── TopBar (Notch + Cluster) ─ */}
      <TopBar
        status={status}
        quota={account?.quota}
        authenticated={Boolean(account?.authenticated)}
        onNew={newSession}
        onSignIn={() => {
          setAuthMessage(null)
          setAuthOpen(true)
        }}
      />

      {/* ─── Sidebar → Dock + Recent ─── */}
      <Sidebar
        entries={entries}
        activeId={activeId}
        onSelect={openEntry}
        onDelete={deleteEntry}
        onNew={newSession}
        account={account}
        onSignIn={() => {
          setAuthMessage(null)
          setAuthOpen(true)
        }}
        onSignOut={() => {
          auth.signOut()
          setAccount(null)
        }}
      />

      {/* ─── Stage: hero when empty, conversation thread otherwise ───── */}
      <main className={`stage${turns.length > 0 ? ' stage-thread' : ''}`}>
        {turns.length === 0 ? (
          <SuggestionsPanel
            status={status}
            error={error}
            onExample={(text) => handleDraft({ text })}
            composer={composerBar}
          />
        ) : (
          <Conversation
            turns={turns}
            busy={busy}
            status={status}
            canRegenerate={canRegenerate}
            onSelectQuery={handleSearch}
            onRegenerate={handleRegenerate}
            onSignIn={() => {
              setAuthMessage(null)
              setAuthOpen(true)
            }}
          >
            {composerBar}
          </Conversation>
        )}
      </main>

      {/* ─── Auth modal ───────────────── */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        auth={auth}
        message={authMessage}
        onAuthenticated={handleAuthenticated}
      />

      {/* ─── Hidden file inputs ────────── */}
      <input
        ref={composerRefs.imageInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          const MAX_IMAGE_MB = 10
          if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            setError('That image format is not supported. Use JPEG, PNG, WEBP, or GIF.')
            return
          }
          if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            setError(`Images need to be smaller than ${MAX_IMAGE_MB} MB.`)
            return
          }
          setError(null)
          setDraft((prev) => ({ ...prev, image: file }))
          event.target.value = ''
        }}
      />
      <input
        ref={composerRefs.audioInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          const MAX_AUDIO_MB = 25
          if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
            setError(`Audio needs to be smaller than ${MAX_AUDIO_MB} MB.`)
            return
          }
          setError(null)
          setDraft((prev) => ({ ...prev, audio: file }))
          event.target.value = ''
        }}
      />
    </>
  )
}
