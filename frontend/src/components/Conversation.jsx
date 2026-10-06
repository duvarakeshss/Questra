import { useEffect, useRef } from 'react'

import Turn from './Turn'

export default function Conversation({ turns, busy, canRegenerate, onSelectQuery, onRegenerate, onSignIn, children }) {
  const endRef = useRef(null)
  const lastId = turns[turns.length - 1]?.id

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [lastId])

  return (
    <div className="thread">
      {turns.map((turn) => (
        <Turn
          key={turn.id}
          turn={turn}
          busy={busy}
          canRegenerate={canRegenerate(turn.id)}
          onSelectQuery={onSelectQuery}
          onRegenerate={onRegenerate}
          onSignIn={onSignIn}
        />
      ))}

      <div className="composer-dock">{children}</div>
      <div ref={endRef} />
    </div>
  )
}
