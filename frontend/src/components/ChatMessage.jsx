import { Alert, Brand } from './Icons'
import QuerySuggestions from './QuerySuggestions'
import SearchResults from './SearchResults'
import LoadingSpinner from './LoadingSpinner'

function AssistantTurn({ children }) {
  return (
    <div className="flex animate-fade-up gap-space-sm">
      {/* Questra brand indicator */}
      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded border border-outline-variant bg-surface-lowest shadow-xs">
        <Brand className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1 space-y-space-sm">{children}</div>
    </div>
  )
}

function UserTurn({ children }) {
  return (
    <div className="flex animate-fade-up justify-end">
      <div className="max-w-[85%] space-y-space-sm rounded-lg rounded-br-sm border border-outline-variant bg-surface-low px-space-md py-space-sm text-body-md leading-relaxed text-on-surface shadow-xs">
        {children}
      </div>
    </div>
  )
}

function ThinkingMessage({ message }) {
  return (
    <div className="flex items-center gap-space-xs">
      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
      <span className="font-mono text-label-code-sm text-on-surface-variant">{message}</span>
    </div>
  )
}

export default function ChatMessage({ message, onSelectQuery, onRegenerate, onError }) {
  if (message.role === 'user') {
    return (
      <UserTurn>
        {message.image?.url && (
          <img
            src={message.image.url}
            alt={message.image.name || 'Attached image'}
            className="max-h-48 w-full rounded border border-outline-variant object-cover"
          />
        )}
        {message.image && !message.image.url && (
          <div className="inline-flex items-center gap-1.5 rounded border border-outline-variant bg-surface-lowest px-space-xs py-1 font-mono text-label-code-sm text-secondary">
            IMG: {message.image.name}
          </div>
        )}
        {message.audio && (
          <div className="inline-flex items-center gap-1.5 rounded border border-secondary-fixed bg-secondary-fixed/30 px-space-xs py-1 font-mono text-label-code-sm text-on-secondary-fixed">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            VOX: {message.audio.name}
          </div>
        )}
        {message.text && <p className="whitespace-pre-wrap">{message.text}</p>}
      </UserTurn>
    )
  }

  if (message.kind === 'thinking') {
    return (
      <AssistantTurn>
        <div className="flex items-center gap-space-xs rounded border border-outline-variant bg-surface-low px-space-sm py-space-xs shadow-xs">
          <LoadingSpinner message={null} />
          <ThinkingMessage message={message.message} />
        </div>
      </AssistantTurn>
    )
  }

  if (message.kind === 'error') {
    return (
      <AssistantTurn>
        <div className="flex items-start gap-space-sm rounded border border-error/30 bg-error-container/20 px-space-md py-space-sm">
          <Alert className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <p className="font-mono text-label-code-sm text-error uppercase mb-1">RETRIEVAL_ERROR</p>
            <p className="text-body-sm leading-relaxed text-on-surface">{message.message}</p>
          </div>
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
