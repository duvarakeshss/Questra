import { useState } from 'react'
import { Pencil, Refresh, Search, Hub } from './Icons'
import QueryEditor from './QueryEditor'

const PATHWAY_COLORS = [
  { border: 'border-primary', bar: 'bg-primary', badge: 'bg-primary-fixed text-on-primary-fixed', accent: 'text-primary' },
  { border: 'border-secondary', bar: 'bg-secondary', badge: 'bg-surface-high text-on-surface-variant', accent: 'text-secondary' },
  { border: 'border-outline', bar: 'bg-outline', badge: 'bg-surface-high text-on-surface-variant', accent: 'text-outline' },
  { border: 'border-outline-variant', bar: 'bg-outline-variant', badge: 'bg-surface-high text-on-surface-variant', accent: 'text-on-surface-variant' },
]

function ContextSummary({ context }) {
  if (!context) return null

  const rows = [
    ['Image', context.image_description],
    ['Voice', context.voice_transcript],
    ['Notes', context.text_input],
  ].filter(([, value]) => value)

  if (rows.length === 0) return null

  return (
    <div className="rounded border border-outline-variant bg-surface-low px-space-md py-space-sm">
      <p className="font-mono text-label-technical uppercase text-on-surface-variant mb-space-xs">
        Ingestion Summary
      </p>
      <dl className="space-y-1">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-2 text-body-sm">
            <dt className="w-14 shrink-0 font-mono text-label-code-sm text-on-surface-variant uppercase pt-px">
              {label}
            </dt>
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
      {/* Stage header */}
      <div className="flex flex-wrap items-baseline justify-between gap-space-sm">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-space-xs">
            <span className="font-mono text-label-technical text-primary uppercase font-bold tracking-widest">
              [STAGE 02 // INTENT DIVERGENCE MATRIX]
            </span>
          </div>
          <h2 className="text-headline-sm font-semibold text-on-surface tracking-tight">
            Query Intent Expansion
          </h2>
        </div>
        <div className="flex items-center gap-space-xs bg-surface-low px-space-sm py-1 rounded font-mono text-label-code-sm text-on-surface-variant">
          <Hub className="h-3.5 w-3.5 text-secondary" />
          <span>{suggestions.length} divergent pathways mapped</span>
        </div>
      </div>

      <ContextSummary context={context} />

      {suggestions.length === 0 ? (
        <div className="rounded border border-outline-variant bg-surface-low p-space-md text-center">
          <p className="font-mono text-label-code-sm text-on-surface-variant">
            NO_PATHWAYS_SYNTHESIZED
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Add more detail or write a query below.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
          {suggestions.map((suggestion, index) => {
            const theme = PATHWAY_COLORS[index % PATHWAY_COLORS.length]
            const isFirst = index === 0
            const score = typeof suggestion.intent_score === 'number'
              ? Math.round(suggestion.intent_score * 100)
              : null

            return (
              <div
                key={suggestion.id}
                className={`relative flex flex-col justify-between gap-space-md overflow-hidden rounded-lg border-2 bg-surface-lowest p-space-md shadow-card transition-all hover:shadow-card-hover ${
                  isFirst ? `${theme.border}` : 'border-outline-variant hover:border-outline'
                }`}
              >
                {/* Active top stripe */}
                {isFirst && (
                  <div className={`absolute top-0 left-0 right-0 h-0.5 ${theme.bar}`} />
                )}

                <div className="flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className={`font-mono text-label-code-sm uppercase px-space-xs py-0.5 rounded font-bold ${theme.badge}`}>
                      PATH_{String(index + 1).padStart(2, '0')}
                    </span>
                    {score !== null && (
                      <span className={`font-mono text-label-code-sm font-bold ${theme.accent}`}>
                        {score}% ALIGN
                      </span>
                    )}
                  </div>

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
                      <p className="text-body-md leading-relaxed text-on-surface font-medium">
                        {suggestion.query}
                      </p>

                      {/* Confidence bar */}
                      <div className="progress-bar mt-1">
                        <div
                          className={`h-full transition-all ${theme.bar}`}
                          style={{ width: `${score ?? 80}%` }}
                        />
                      </div>
                    </>
                  )}
                </div>

                {editingId !== suggestion.id && (
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onSelect(suggestion.query)}
                      className={`rounded px-space-sm py-1 font-mono text-label-technical text-on-primary transition-colors ${
                        isFirst
                          ? 'bg-primary hover:bg-clay-deep shadow-xs'
                          : 'bg-surface-high hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      Explore Pathway →
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(suggestion.id)}
                      className="btn btn-ghost p-1.5"
                      title="Edit query"
                      aria-label="Edit query"
                    >
                      <Pencil />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Custom query input */}
      <div className="flex items-center gap-2 rounded border border-outline-variant bg-surface-lowest p-2">
        <span className="font-mono text-label-code-sm text-primary font-bold select-none shrink-0 pl-1">
          ir://custom&gt;
        </span>
        <input
          value={custom}
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submitCustom()
          }}
          placeholder="Write a custom query operator"
          className="min-w-0 flex-1 bg-transparent text-body-md text-on-surface outline-none placeholder:text-on-surface-variant/50"
        />
        <button
          type="button"
          onClick={submitCustom}
          disabled={!custom.trim()}
          className="btn btn-primary shrink-0"
        >
          <Search className="h-3.5 w-3.5" />
          Search
        </button>
      </div>

      {onRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="flex items-center gap-1.5 font-mono text-label-code-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Refresh />
          Synthesize different pathways
        </button>
      )}
    </div>
  )
}
