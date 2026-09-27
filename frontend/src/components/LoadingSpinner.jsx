export default function LoadingSpinner({ message }) {
  return (
    <div className="flex items-center gap-space-xs py-0.5" aria-live="polite">
      <span className="flex items-center gap-0.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
      </span>
      {message && (
        <span className="font-mono text-label-code-sm text-on-surface-variant">{message}</span>
      )}
    </div>
  )
}
