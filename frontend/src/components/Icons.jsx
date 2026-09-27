// Questra brand mark — compass-rose precision instrument motif (from Stitch design system)
export function Brand({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect width="120" height="120" rx="28" fill="#18181B" />
      <circle cx="60" cy="60" r="32" stroke="#FAF8F5" strokeWidth="4" strokeDasharray="2 6" />
      <circle cx="60" cy="60" r="18" stroke="#3B82F6" strokeWidth="3.5" />
      <polygon points="60,26 66,48 60,42 54,48" fill="#3B82F6" />
      <polygon points="60,94 66,72 60,78 54,72" fill="#71717A" />
      <polygon points="26,60 48,54 42,60 48,66" fill="#71717A" />
      <polygon points="94,60 72,54 78,60 72,66" fill="#3B82F6" />
      <circle cx="60" cy="60" r="4.5" fill="#FAF8F5" />
      <path d="M74 74 L90 90" stroke="#3B82F6" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

export function BrandSmall({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <circle cx="12" cy="12" r="8" strokeDasharray="1 3" />
        <circle cx="12" cy="12" r="4.5" />
        <polygon points="12,2 13.5,8 12,6.5 10.5,8" fill="currentColor" stroke="none" />
        <polygon points="12,22 13.5,16 12,17.5 10.5,16" fill="currentColor" stroke="none" opacity="0.4" />
        <path d="M16.5 16.5 L20 20" strokeWidth="2" />
      </g>
    </svg>
  )
}

export function Plus({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 4.25v11.5M4.25 10h11.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export function Image({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.75" y="3.75" width="14.5" height="12.5" rx="2.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="7.5" cy="8" r="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.4 13.2l3.6-3.2c.5-.45 1.3-.44 1.8.02L12 12.8m0 0l1.8-1.6c.5-.45 1.3-.44 1.8.02l1.4 1.25M12 12.8l2.6 2.35" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Mic({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7.4" y="2.75" width="5.2" height="9" rx="2.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.75 9.25a5.25 5.25 0 0010.5 0M10 14.5v2.75" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

export function Stop({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" aria-hidden="true">
      <rect x="3.5" y="3.5" width="9" height="9" rx="2" fill="currentColor" />
    </svg>
  )
}

export function ArrowUp({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 15.5V4.8M10 4.8L5.4 9.4M10 4.8l4.6 4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Menu({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 6h13M3.5 10h13M3.5 14h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Close({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5.5 5.5l9 9M14.5 5.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Pencil({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.1 2.4l2.5 2.5-8 8-3.1.6.6-3.1 8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Refresh({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.2 7.2A5.2 5.2 0 104 11.4M13.4 3.4v3.9h-3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ExternalLink({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.5 2.75h3.75V6.5M13.25 2.75L7.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9.75v2.5a1.5 1.5 0 01-1.5 1.5h-6a1.5 1.5 0 01-1.5-1.5v-6a1.5 1.5 0 011.5-1.5h2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

export function Search({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.25" stroke="currentColor" strokeWidth="1.5" />
      <path d="M13 13l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Alert({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10 6.5v4.25M10 13.4v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChevronRight({ className = 'h-3.5 w-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Bolt({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M11 2L4 12h6l-1 6 7-10h-6l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Layers({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2.5L2.5 7l7.5 4.5L17.5 7 10 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M2.5 12l7.5 4.5L17.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Hub({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="4.5" cy="5" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.5" cy="5" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="4.5" cy="15" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.5" cy="15" r="1.75" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 9L6 6.5M12.5 9L14 6.5M7.5 11L6 13.5M12.5 11L14 13.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
