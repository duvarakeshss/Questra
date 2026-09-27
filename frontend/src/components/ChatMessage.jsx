import { Alert, Brand, Lock } from './Icons'
import LoadingSpinner from './LoadingSpinner'
import QuerySuggestions from './QuerySuggestions'
import SearchResults from './SearchResults'

function AssistantTurn({ children }) {
  return (
    <div className="flex animate-fade-up gap-space-sm">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-xs">
        <Brand className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-space-sm pt-0.5">{children}</div>
    </div>
  )
}

function UserTurn({ children }) {
  return (
    <div className="flex animate-fade-up justify-end">
      <div className="max-w-[85%] space-y-space-sm rounded-2xl rounded-br-md border border-outline-variant bg-surface-low px-4 py-3 text-body-md leading-relaxed text-on-surface">
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
            className="max-h-52 w-full rounded-lg border border-outline-variant object-cover"
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
        <div className="inline-flex items-center gap-2.5 rounded-full border border-outline-variant bg-surface-lowest px-3.5 py-2 shadow-xs">
          <LoadingSpinner message={null} />
          <span className="text-body-sm text-on-surface-variant">{message.message}</span>
        </div>
      </AssistantTurn>
    )
  }

  if (message.kind === 'error') {
    return (
      <AssistantTurn>
        <div className="flex items-start gap-3 rounded-xl border border-error/25 bg-error-container/40 px-4 py-3">
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
        <div className="flex flex-col gap-space-sm rounded-xl border border-primary/25 bg-primary-fixed/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary">
              <Lock className="h-4 w-4" />
            </span>
            <div>
              <p className="text-body-md font-semibold text-on-surface">{message.message}</p>
              <p className="mt-0.5 text-body-sm text-on-surface-variant">
                It takes a few seconds and stays free.
              </p>
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
