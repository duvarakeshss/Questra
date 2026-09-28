import { useState } from 'react'

import { Hub, Pencil, Refresh, Search } from './Icons'
import QueryEditor from './QueryEditor'

function scoreClass(score) {
  return score >= 85 ? 'score score-high' : 'score score-mid'
}

function ContextSummary({ context }) {
  if (!context) return null

  const rows = [
    ['Image', context.image_description],
    ['Voice', context.voice_transcript],
    ['Notes', context.text_input],
  ].filter(([, value]) => value)

  if (rows.length === 0) return null

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-low px-4 py-3">
      <p className="text-caption text-on-surface-variant">What we understood</p>
      <dl className="mt-1.5 space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2.5 text-body-sm">
            <dt className="w-12 shrink-0 text-on-surface-variant">{label}</dt>
            <dd className="text-on-surface leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export default function QuerySuggestions({ suggestions, context, onSelect, onRegenerate, onError }) {
  const [editingId, setEditingId] = useState(null)
  const [custom, setCustom] = useState('')

  function submitCustom() {
    const value = custom.trim()
    if (!value) {
      onError?.('Type a query before searching.')
      return
    }
    onError?.(null)
    setCustom('')
    onSelect(value)
  }

  return (
    <div className="space-y-space-md animate-fade-up">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-headline-sm text-on-surface">A few directions</h2>
        <span className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant">
          <Hub className="h-4 w-4 text-primary" />
          {suggestions.length} {suggestions.length === 1 ? 'idea' : 'ideas'} from your input
        </span>
      </div>

      <ContextSummary context={context} />

      {suggestions.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-low p-8 text-center">
          <p className="text-body-md text-on-surface">No queries came back.</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Add a bit more detail or type your own below.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {suggestions.map((suggestion, index) => {
            const score = typeof suggestion.intent_score === 'number' ? Math.round(suggestion.intent_score * 100) : null
            const isTop = index === 0

            return (
              <div
                key={suggestion.id}
                className={`flex flex-col justify-between gap-3 rounded-xl border bg-surface-lowest p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-hover ${
                  isTop ? 'border-primary/50' : 'border-outline-variant hover:border-outline'
                }`}
              >
                {editingId === suggestion.id ? (
                  <QueryEditor
                    initialQuery={suggestion.query}
                    onConfirm={(value) => {
                      setEditingId(null)
                      onSelect(value)
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        {isTop && (
                          <span className="text-caption font-semibold text-primary">Top pick</span>
                        )}
                        {score !== null && <span className={scoreClass(score)}>{score}% match</span>}
                      </div>
                      <p className="text-body-md font-medium leading-relaxed text-on-surface">{suggestion.query}</p>
                      {score !== null && (
                        <div className="progress-bar">
                          <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <button type="button" onClick={() => onSelect(suggestion.query)} className="btn btn-primary py-2">
                        <Search className="h-4 w-4" />
                        Search this
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(suggestion.id)}
                        className="btn-icon"
                        title="Edit query"
                        aria-label="Edit query"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-lowest p-2">
        <input
          value={custom}
          aria-label="Your own search query"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitCustom()
          }}
          placeholder="Or type your own query"
          className="min-w-0 flex-1 bg-transparent px-2 text-[16px] text-on-surface outline-none placeholder:text-on-surface-variant/50 sm:text-body-md"
        />
        <button type="button" onClick={submitCustom} disabled={!custom.trim()} className="btn btn-secondary shrink-0">
          <Search className="h-4 w-4" />
          Search
        </button>
      </div>

      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <Refresh className="h-4 w-4" />
          Try different ideas
        </button>
      )}
    </div>
  )
}
