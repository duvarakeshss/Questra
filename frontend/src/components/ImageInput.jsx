import { useRef } from 'react'
import { Close, Image as ImageIcon } from './Icons'

const MAX_IMAGE_MB = 10
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export default function ImageInput({ image, onChange, onError, disabled = false }) {
  const fileInputRef = useRef(null)

  function handleFile(file) {
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      onError?.('Unsupported image format. Use JPEG, PNG, WEBP, or GIF.')
      return
    }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      onError?.(`Image must be smaller than ${MAX_IMAGE_MB}MB.`)
      return
    }
    onError?.(null)
    onChange?.(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {image ? (
        <div className="relative inline-flex items-center gap-space-sm rounded-lg border border-outline-variant bg-surface-low p-2">
          <img
            src={URL.createObjectURL(image)}
            alt="Upload preview"
            className="h-16 w-16 rounded object-cover border border-outline-variant"
          />
          <div className="flex flex-col min-w-0 pr-6">
            <span className="font-mono text-label-code-sm text-on-surface truncate max-w-[200px]">
              {image.name}
            </span>
            <span className="font-mono text-caption text-on-surface-variant">
              {(image.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange?.(null)}
            disabled={disabled}
            className="absolute top-1 right-1 rounded p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
            aria-label="Remove image"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-outline-variant p-6 text-center transition-colors cursor-pointer hover:border-primary hover:bg-surface-low ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <ImageIcon className="h-8 w-8 text-on-surface-variant mb-2" />
          <p className="font-mono text-label-technical text-on-surface">
            Drag & drop an image, or <span className="text-primary underline">browse</span>
          </p>
          <p className="mt-1 font-mono text-caption text-on-surface-variant">
            JPEG, PNG, WEBP, GIF up to 10MB
          </p>
        </div>
      )}
    </div>
  )
}
