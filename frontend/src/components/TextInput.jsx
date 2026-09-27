export default function TextInput({
  value,
  onChange,
  placeholder = "Describe what you're looking for...",
  maxLength = 1000,
  disabled = false,
}) {
  return (
    <div className="w-full">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          rows={3}
          className="w-full resize-none rounded-lg border border-outline-variant bg-surface-lowest p-3 font-sans text-body-md text-on-surface placeholder:text-outline focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 transition-colors"
        />
        <div className="absolute bottom-2 right-2 font-mono text-caption text-on-surface-variant pointer-events-none">
          {value?.length || 0} / {maxLength}
        </div>
      </div>
    </div>
  )
}
