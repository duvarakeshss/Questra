import { useState } from 'react'

import { Alert, ExternalLink, Lock, Pencil, Refresh, Search } from './Icons'
import QueryEditor from './QueryEditor'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function IntentBar({ value }) {
  return (
    <span className="inline-flex items-center gap-2" aria-hidden="true">
      <span className="h-1.5 w-14 overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <span
          className="block h-full rounded-full"
          style={{ width: `${value}%`, background: 'linear-gradient(90deg, var(--a1), var(--a2))' }}
        />
      </span>
      <span className="text-meta tabular-nums" style={{ color: 'var(--a1)' }}>{value}%</span>
    </span>
  )
}

function ContextSummary({ context }) {
  if (!context) return null
  const rows = [
    ['Image', context.image_description],
    ['Voice', context.voice_transcript],
    ['Text', context.text_input],
  ].filter(([, value]) => value)

  if (rows.length === 0) return null

  return (
    <div className="glass-card p-4">
      <p className="label">Understood</p>
      <dl className="mt-2.5 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="grid grid-cols-[3.5rem_1fr] gap-3">
            <dt className="pt-0.5 text-meta font-medium" style={{ color: 'var(--muted)' }}>{label}</dt>
            <dd className="text-body-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-dot-bounce rounded-full"
          style={{ background: 'var(--a1)', animationDelay: `${index * 0.15}s` }}
        />
      ))}
    </span>
  )
}

function SuggestSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      <div className="glass-card flex items-center gap-3 px-4 py-3.5">
        <Typing />
        <span className="text-body-sm" style={{ color: 'var(--muted)' }}>Drafting search directions…</span>
      </div>
      {[0, 1, 2].map((row) => (
        <div key={row} className="glass-card space-y-2.5 p-4">
          <div className="skeleton h-3.5 w-4/5" />
          <div className="skeleton h-3 w-2/5" />
        </div>
      ))}
    </div>
  )
}

function ResultSkeletons() {
  return (
    <div className="space-y-3" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="glass-card space-y-2.5 p-4">
          <div className="skeleton h-3 w-1/3" />
          <div className="skeleton h-3.5 w-4/5" />
          <div className="skeleton h-3 w-full" />
        </div>
      ))}
    </div>
  )
}

function SuggestionList({ suggestions, busy, canRegenerate, onSelect, onRegenerate }) {
  const [editingId, setEditingId] = useState(null)
  const [custom, setCustom] = useState('')

  function submitCustom() {
    const value = custom.trim()
    if (!value) return
    setCustom('')
    onSelect(value)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-body-sm font-semibold text-ink">Search directions</span>
          {suggestions.length > 0 && <span className="chip py-0.5">{suggestions.length}</span>}
        </div>
        {canRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-meta font-medium transition-all duration-150 hover:bg-sunken disabled:opacity-40"
            style={{ color: 'var(--muted)' }}
          >
            <Refresh className="h-3.5 w-3.5" />
            Try again
          </button>
        )}
      </div>

      <ol className="space-y-2.5">
        {suggestions.map((suggestion, index) => {
          const score = typeof suggestion.intent_score === 'number' ? Math.round(suggestion.intent_score * 100) : null
          const isTop = index === 0
          return (
            <li key={suggestion.id}>
              {editingId === suggestion.id ? (
                <div className="glass-card p-4" style={{ borderColor: 'rgba(212,177,106,0.30)' }}>
                  <QueryEditor
                    initialQuery={suggestion.query}
                    onConfirm={(value) => {
                      setEditingId(null)
                      onSelect(value)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <article className="glass-card p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-meta font-semibold tabular-nums"
                      style={
                        isTop
                          ? { background: 'linear-gradient(135deg, var(--a1), var(--a2))', color: 'var(--ink)' }
                          : { border: '1.5px solid var(--border)', color: 'var(--muted)' }
                      }
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-body leading-relaxed text-ink">{suggestion.query}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                        {score !== null && <IntentBar value={score} />}
                        {isTop && <span className="chip chip-accent py-0.5">Top pick</span>}
                        <div className="ml-auto flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(suggestion.id)}
                            className="btn-icon h-8 w-8"
                            aria-label="Edit query"
                            title="Edit query"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelect(suggestion.query)}
                            disabled={busy}
                            className="btn btn-accent px-3.5 py-1.5"
                          >
                            <Search className="h-3.5 w-3.5" />
                            Run
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              )}
            </li>
          )
        })}
      </ol>

      <div className="flex items-center gap-2 pt-1">
        <input
          value={custom}
          aria-label="Your own search query"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitCustom()
          }}
          placeholder="Or type your own query…"
          className="field min-w-0 flex-1 text-[16px] sm:text-body-sm"
        />
        <button type="button" onClick={submitCustom} disabled={!custom.trim() || busy} className="btn btn-soft px-4 py-2.5">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Run</span>
        </button>
      </div>
    </div>
  )
}

function Results({ query, results }) {
  const hasResults = Array.isArray(results) && results.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-body-sm font-semibold text-ink">Sources</span>
        {hasResults && <span className="chip py-0.5">{results.length}</span>}
      </div>
      {query && (
        <p className="text-meta" style={{ color: 'var(--muted)' }}>
          Ranked for <span style={{ color: 'var(--a1)' }}>{query}</span>
        </p>
      )}

      {results.length === 0 ? (
        <div className="glass-card p-5 text-center">
          <p className="text-body-sm" style={{ color: 'var(--muted)' }}>
            Nothing came back for that query. Try another direction above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((result, index) => {
            const pct = typeof result.score === 'number' ? Math.round(result.score * 100) : null
            return (
              <div key={`${result.url}-${index}`} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-meta" style={{ color: 'var(--a1)' }}>{hostOf(result.url)}</span>
                  {pct !== null && <span className="text-meta tabular-nums" style={{ color: 'var(--muted)' }}>{pct}% match</span>}
                </div>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-baseline gap-1.5 text-body-sm font-semibold text-ink no-underline"
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--a1)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text)' }}
                >
                  <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {result.title || hostOf(result.url)}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--muted)' }} />
                </a>
                {result.snippet && (
                  <p
                    className="mt-1.5 text-body-sm leading-relaxed"
                    style={{ color: 'var(--muted)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {result.snippet}
                  </p>
                )}
                {result.thumbnail && (
                  <img
                    src={result.thumbnail}
                    alt=""
                    loading="lazy"
                    onError={(event) => { event.currentTarget.style.display = 'none' }}
                    style={{ marginTop: '10px', maxHeight: '160px', width: '100%', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function Turn({ turn, busy, canRegenerate, onSelectQuery, onRegenerate, onSignIn }) {
  const input = turn.input ?? {}
  const hasUserContent = Boolean(input.text || input.imageName || input.audioName)
  const showSuggestions = turn.loading === 'reading' || turn.suggestions.length > 0
  const showResults = turn.loading === 'searching' || Array.isArray(turn.results)

  return (
    <article className="turn">
      {hasUserContent && (
        <div className="turn-user">
          <div className="turn-bubble">
            {input.imageName && <span className="chip">Image · {input.imageName}</span>}
            {input.audioName && <span className="chip">Voice · {input.audioName}</span>}
            {input.text && <p className="whitespace-pre-wrap">{input.text}</p>}
          </div>
        </div>
      )}

      <div className="turn-assistant">
        {turn.gate && (
          <div className="flex flex-col gap-3 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between" style={{ border: '1px solid rgba(212,177,106,0.30)', background: 'rgba(212,177,106,0.08)' }}>
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--a1)' }} />
              <div>
                <p className="text-body font-medium text-ink">Your free queries are used up</p>
                <p className="mt-0.5 text-body-sm" style={{ color: 'var(--muted)' }}>
                  Create a free account to keep searching — it takes seconds.
                </p>
              </div>
            </div>
            <button type="button" className="btn btn-accent shrink-0 px-4 py-2" onClick={onSignIn}>
              Create account
            </button>
          </div>
        )}

        {turn.error && (
          <div className="flex items-start gap-2.5 rounded-xl p-3.5" style={{ border: '1px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.10)' }}>
            <Alert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-body-sm leading-relaxed text-danger-bright">{turn.error}</p>
          </div>
        )}

        <ContextSummary context={turn.context} />

        {turn.loading === 'reading' && turn.suggestions.length === 0 ? (
          <SuggestSkeletons />
        ) : showSuggestions ? (
          <SuggestionList
            suggestions={turn.suggestions}
            busy={busy}
            canRegenerate={canRegenerate}
            onSelect={(value) => onSelectQuery(turn.id, value)}
            onRegenerate={() => onRegenerate(turn.id)}
          />
        ) : null}

        {turn.loading === 'searching' && !Array.isArray(turn.results) ? <ResultSkeletons /> : null}
        {showResults && Array.isArray(turn.results) ? <Results query={turn.query} results={turn.results} /> : null}
      </div>
    </article>
  )
}
