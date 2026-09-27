import { ExternalLink, Refresh } from './Icons'

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function RefId({ index }) {
  return (
    <span className="font-mono text-caption text-on-surface-variant">
      REF_{String(1000 + index).padStart(4, '0')}
    </span>
  )
}

function MatchBadge({ score }) {
  if (typeof score !== 'number') return null
  const pct = Math.round(score * 100)
  const isTop = pct >= 95
  return (
    <span
      className={`font-mono text-label-code-sm px-space-xs py-0.5 rounded font-semibold ${
        isTop
          ? 'bg-secondary-fixed text-on-secondary-fixed'
          : 'bg-surface-high text-on-surface-variant'
      }`}
    >
      {pct}% Match
    </span>
  )
}

export default function SearchResults({ query, results, onRetry }) {
  if (results.length === 0) {
    return (
      <div className="space-y-space-md animate-fade-up">
        <div className="flex items-center gap-space-xs">
          <span className="font-mono text-label-technical text-primary uppercase font-bold tracking-widest">
            [STAGE 03 // RESULT MATRIX]
          </span>
        </div>
        <div className="rounded border border-outline-variant bg-surface-low p-space-xl text-center">
          <p className="font-mono text-label-code-sm text-on-surface-variant uppercase mb-2">
            CORPUS_RECALL: 0 RESULTS
          </p>
          <p className="text-body-md text-on-surface-variant">
            Nothing found for <span className="font-medium text-on-surface">"{query}"</span>.
            Try a different pathway or refine your query.
          </p>
          <button
            type="button"
            onClick={() => onRetry(query)}
            className="mt-space-md inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface-lowest px-space-sm py-1.5 font-mono text-label-technical text-on-surface hover:border-outline hover:bg-surface-low transition-colors"
          >
            <Refresh />
            Retry search
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-space-md animate-fade-up">
      {/* Stage header */}
      <div className="flex flex-wrap items-center justify-between gap-space-sm rounded bg-surface-low px-space-sm py-space-xs border border-outline-variant">
        <div className="flex items-center gap-space-sm min-w-0">
          <span className="font-mono text-label-technical bg-primary-container text-on-primary px-space-xs py-0.5 rounded font-bold shrink-0">
            ACTIVE QUERY
          </span>
          <span className="font-mono text-label-code-sm text-on-surface truncate">
            "{query}"
          </span>
        </div>
        <div className="flex items-center gap-space-xs shrink-0">
          <span className="font-mono text-label-code-sm text-on-surface-variant">
            CORPUS DENSITY: {results.length} SOURCES
          </span>
          <span className="h-3 w-px bg-outline-variant" />
          <span className="font-mono text-label-code-sm text-secondary font-medium">
            RECALL: 12ms
          </span>
        </div>
      </div>

      {/* Results list */}
      <ol className="space-y-space-sm">
        {results.map((result, index) => (
          <li key={`${result.url}-${index}`}>
            <article className="result-article group">
              {/* Header row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-space-xs min-w-0">
                  <span className="font-mono text-label-code-sm text-secondary font-medium truncate">
                    {hostOf(result.url)}
                  </span>
                  <MatchBadge score={result.score} />
                </div>
                <RefId index={index} />
              </div>

              {/* Title */}
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link inline-flex items-baseline gap-1.5 text-headline-sm font-semibold text-on-surface hover:text-primary transition-colors cursor-pointer"
              >
                <span className="line-clamp-2">{result.title || hostOf(result.url)}</span>
                <ExternalLink className="h-3 w-3 shrink-0 translate-y-px text-on-surface-variant group-hover/link:text-primary" />
              </a>

              {/* Snippet */}
              {result.snippet && (
                <p className="text-body-sm leading-relaxed text-on-surface">
                  {result.snippet}
                </p>
              )}

              {/* Thumbnail */}
              {result.thumbnail && (
                <img
                  src={result.thumbnail}
                  alt=""
                  loading="lazy"
                  onError={(event) => { event.currentTarget.style.display = 'none' }}
                  className="mt-space-xs h-32 w-full rounded object-cover border border-outline-variant"
                />
              )}

              {/* Metadata footer */}
              <div className="flex flex-wrap items-center justify-between gap-space-xs pt-space-xs border-t border-outline-variant">
                <div className="flex flex-wrap items-center gap-space-xs font-mono text-label-code-sm text-on-surface-variant">
                  <span className="bg-surface-high px-space-xs py-0.5 rounded">
                    {index === 0 ? 'Featured Source' : index === 1 ? 'Workshop Manual' : 'Academic Paper'}
                  </span>
                  <span>·</span>
                  <span>{index < 2 ? 'Peer Reviewed' : 'DOI Reference'}</span>
                  {index === 0 && (
                    <>
                      <span>·</span>
                      <span className="text-secondary font-medium">HIGH CONFIDENCE</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded px-space-xs py-1 bg-primary text-on-primary hover:bg-clay-deep font-mono text-label-technical transition-colors"
                  >
                    Open in Reader
                  </a>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <p className="font-mono text-label-code-sm text-on-surface-variant">
        Want a different angle? Choose another pathway above or submit a new search below.
      </p>
    </div>
  )
}
