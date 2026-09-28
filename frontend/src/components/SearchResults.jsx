import { ExternalLink, Refresh } from './Icons'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function MatchBadge({ score }) {
  if (typeof score !== 'number') return null
  const pct = Math.round(score * 100)
  return <span className={pct >= 80 ? 'score score-high' : 'score score-mid'}>{pct}% match</span>
}

export default function SearchResults({ query, results, onRetry }) {
  if (results.length === 0) {
    return (
      <div className="space-y-space-md animate-fade-up">
        <div className="border border-outline-variant p-6 text-center">
          <p className="text-body-md text-on-surface">No results found.</p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            Nothing came back for &ldquo;{query}&rdquo;. Try another idea or a different wording.
          </p>
          <button type="button" onClick={() => onRetry(query)} className="btn btn-secondary mt-space-md">
            <Refresh className="h-4 w-4" />
            Search again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-space-md animate-fade-up">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-headline-sm text-on-surface">
          Results for <span className="text-primary">&ldquo;{query}&rdquo;</span>
        </h2>
        <span className="font-mono text-label-code-sm text-on-surface-variant">
          {results.length} {results.length === 1 ? 'source' : 'sources'}
        </span>
      </div>

      <ol className="border-t border-outline-variant">
        {results.map((result, index) => (
          <li key={`${result.url}-${index}`} className="border-b border-outline-variant">
            <article className="result-article">
              <div className="grid grid-cols-[2rem_1fr] gap-space-md">
                <span className="pt-0.5 font-mono text-label-code-sm tabular-nums text-on-surface-variant">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-mono text-label-code-sm text-on-surface-variant">{hostOf(result.url)}</span>
                    <MatchBadge score={result.score} />
                  </div>

                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-1 inline-flex items-baseline gap-1.5 text-headline-sm font-semibold text-on-surface transition-colors hover:text-primary"
                  >
                    <span className="line-clamp-2">{result.title || hostOf(result.url)}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 translate-y-px text-on-surface-variant group-hover:text-primary" />
                  </a>

                  {result.snippet && (
                    <p className="mt-1.5 text-body-sm leading-relaxed text-on-surface-variant">{result.snippet}</p>
                  )}

                  {result.thumbnail && (
                    <img
                      src={result.thumbnail}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none'
                      }}
                      className="mt-space-sm max-h-56 w-full rounded-sm border border-outline object-cover"
                    />
                  )}
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <p className="font-mono text-label-code-sm text-on-surface-variant">
        Want a different angle? Pick another idea above, or start a new search.
      </p>
    </div>
  )
}
