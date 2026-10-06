import { Alert } from './Icons'

const EXAMPLES = [
  {
    text: 'A cozy reading nook under $300',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 11l8-7 8 7v9H4z" />
      </svg>
    ),
  },
  {
    text: 'Running shoes like this but cheaper',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 17h13l3-4h2v4M6 17v2m8-2v2" />
      </svg>
    ),
  },
  {
    text: 'Explain this chart in plain words',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
      </svg>
    ),
  },
]

export default function SuggestionsPanel({ status, error, onExample, composer }) {
  return (
    <div className="hero">
      <h1 className="text-gold-gradient">What are we looking&nbsp;for?</h1>

      <p className="lead">
        Describe it in a few words, drop a picture, or say it out loud. Questra turns it into search directions you can shape and run.
      </p>

      {error && (
        <div
          className="animate-rise mx-auto mb-4 flex max-w-xl items-start gap-2.5 rounded-xl p-3.5 text-left"
          style={{ border: '1px solid rgba(220,38,38,0.30)', background: 'rgba(220,38,38,0.10)' }}
          role="alert"
        >
          <Alert className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-body-sm leading-relaxed text-danger-bright">{error}</p>
        </div>
      )}

      {composer}

      {/* Suggestion cards */}
      <div className="sugs">
        {EXAMPLES.map(({ text, icon }) => (
          <div
            key={text}
            className="sug"
            onClick={() => onExample(text)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onExample(text)
            }}
          >
            <div className="gi">{icon}</div>
            <b>{text}</b>
            <div className="go">
              Try this{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline strip */}
      <div className="pipe glass">
        <div className={`step${status === 'reading' ? ' active' : status === 'searching' ? ' done' : ''}`}>
          <div className="n">1</div>
          <div>
            <b>Fetch</b>
            <span>We scan the live web for your query.</span>
          </div>
        </div>
        <div className={`step${status === 'searching' ? ' active' : ''}`}>
          <div className="n">2</div>
          <div>
            <b>Rerank</b>
            <span>Every source is scored by semantic similarity to your intent.</span>
          </div>
        </div>
        <div className="step">
          <div className="n">3</div>
          <div>
            <b>Inspect</b>
            <span>Open the original page — Questra links out, it does not answer for you.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
