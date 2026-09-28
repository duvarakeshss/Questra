import { Alert, Lock } from './Icons'
import LoadingSpinner from './LoadingSpinner'
import QuerySuggestions from './QuerySuggestions'
import SearchResults from './SearchResults'

function AssistantTurn({ children }) {
  return (
    <section className="animate-fade-up border-t border-outline-variant pt-space-md">
      <p className="eyebrow mb-space-sm">Questra</p>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

function UserTurn({ children }) {
  return (
    <div className="flex animate-fade-up justify-end pt-space-lg">
      <div className="max-w-[85%] space-y-space-sm rounded border border-outline bg-surface-lowest px-4 py-3 text-body-md leading-relaxed text-on-surface">
        <p className="eyebrow">You</p>
        {children}
      </div>
    </div>
  )
}

export default function ChatMessage({ message, onSelectQuery, onRegenerate, onError, onSignIn }) {
  if (message.role === 'user') {
    return (
      <UserTurn>
        {message.image?.url && (
          <img
            src={message.image.url}
            alt={message.image.name || 'Attached image'}
            className="max-h-52 w-full rounded-sm border border-outline object-cover"
          />
        )}
        {message.image && !message.image.url && (
          <div className="chip">Image: {message.image.name}</div>
        )}
        {message.audio && <div className="chip">Voice: {message.audio.name}</div>}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
      </UserTurn>
    )
  }

  if (message.kind === 'thinking') {
    return (
      <AssistantTurn>
        <div className="inline-flex items-center gap-2.5 py-1">
          <LoadingSpinner message={null} />
          <span className="font-mono text-label-code-sm text-on-surface-variant">{message.message}</span>
        </div>
      </AssistantTurn>
    )
  }

  if (message.kind === 'error') {
    return (
      <AssistantTurn>
        <div className="flex items-start gap-3 border-l-2 border-error bg-error-container/50 px-4 py-3">
          <Alert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <p className="text-body-sm font-medium text-on-error-container">Something went wrong</p>
            <p className="mt-0.5 text-body-sm leading-relaxed text-on-surface">{message.message}</p>
          </div>
        </div>
      </AssistantTurn>
    )
  }

  if (message.kind === 'gate') {
    return (
      <AssistantTurn>
        <div className="flex flex-col gap-space-sm border border-primary/40 bg-primary-fixed/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-body-md font-semibold text-on-surface">{message.message}</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">It takes a few seconds and stays free.</p>
            </div>
          </div>
          <button type="button" className="btn btn-primary shrink-0" onClick={onSignIn}>
            Create free account
          </button>
        </div>
      </AssistantTurn>
    )
  }

  if (message.kind === 'suggestions') {
    return (
      <AssistantTurn>
        <QuerySuggestions
          suggestions={message.suggestions}
          context={message.context}
          onSelect={onSelectQuery}
          onRegenerate={message.inputs ? () => onRegenerate(message.id, message.inputs) : undefined}
          onError={onError}
        />
      </AssistantTurn>
    )
  }

  if (message.kind === 'results') {
    return (
      <AssistantTurn>
        <SearchResults query={message.query} results={message.results} onRetry={onSelectQuery} />
      </AssistantTurn>
    )
  }

  return null
}
