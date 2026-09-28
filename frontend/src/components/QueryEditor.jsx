import { useState } from 'react'

export default function QueryEditor({ initialQuery, onConfirm, onCancel }) {
  const [value, setValue] = useState(initialQuery)

  return (
    <div className="space-y-2.5">
      <label className="eyebrow block" htmlFor="query-editor-input">
        Edit query
      </label>
      <input
        id="query-editor-input"
        value={value}
        autoFocus
        aria-label="Search query"
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && value.trim()) onConfirm(value.trim())
          if (event.key === 'Escape') onCancel()
        }}
        className="field"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => onConfirm(value.trim())} disabled={!value.trim()} className="btn btn-primary">
          Search this
        </button>
        <button type="button" onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  )
}
