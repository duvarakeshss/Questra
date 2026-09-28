import { useState } from 'react'

import { Pencil, Refresh, Search } from './Icons'
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
    <dl className="border-t border-outline-variant">
      <p className="eyebrow pt-space-sm">What we understood</p>
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[4.5rem_1fr] gap-space-md border-b border-outline-variant py-2.5">
          <dt className="font-mono text-label-code-sm uppercase text-on-surface-variant">{label}</dt>
          <dd className="text-body-sm leading-relaxed text-on-surface">{value}</dd>
        </div>
      ))}
    </dl>
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
        <span className="font-mono text-label-code-sm text-on-surface-variant">
          {suggestions.length} {suggestions.length === 1 ? 'idea' : 'ideas'} from your input
        </span>
      </div>

      <ContextSummary context={context} />

      {suggestions.length === 0 ? (
        <div className="border border-outline-variant p-6 text-center">
          <p className="text-body-md text-on-surface">No queries came back.</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">Add a bit more detail or type your own below.</p>
        </div>
      ) : (
        <ol className="border-t border-outline-variant">
          {suggestions.map((suggestion, index) => {
            const score = typeof suggestion.intent_score === 'number' ? Math.round(suggestion.intent_score * 100) : null
            const isTop = index === 0

            return (
              <li key={suggestion.id} className="border-b border-outline-variant">
                {editingId === suggestion.id ? (
                  <div className="py-4">
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
                  <div className="flex items-start gap-space-md py-4">
                    <span
                      className={`font-mono text-label-code-sm tabular-nums ${
                        isTop ? 'text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-body-md font-medium leading-relaxed text-on-surface">{suggestion.query}</p>
                        {score !== null && <span className={scoreClass(score)}>{score}%</span>}
                      </div>
                      {isTop && <p className="mt-1 font-mono text-label-code-sm uppercase text-primary">Top pick</p>}
                      {score !== null && (
                        <div className="progress-bar mt-2">
                          <div className="h-full bg-primary" style={{ width: `${score}%` }} />
                        </div>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <button type="button" onClick={() => onSelect(suggestion.query)} className="btn btn-primary py-2">
                          <Search className="h-4 w-4" />
                          Search this
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(suggestion.id)}
                          className="btn btn-ghost gap-1.5"
                          aria-label="Edit query"
                          title="Edit query"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex items-center gap-2 border border-outline-variant p-2">
        <input
          value={custom}
          aria-label="Your own search query"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitCustom()
          }}
          placeholder="Or type your own query"
          className="min-w-0 flex-1 bg-transparent px-2 text-[16px] text-on-surface outline-none placeholder:text-on-surface-variant/60 sm:text-body-md"
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
          className="inline-flex items-center gap-1.5 font-mono text-label-code-sm text-on-surface-variant transition-colors hover:text-primary"
        >
          <Refresh className="h-4 w-4" />
          Try different ideas
        </button>
      )}
    </div>
  )
}
