import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Close, Image as ImageIcon, Mic, Stop, Layers } from './Icons'

const MAX_IMAGE_MB = 10
const MAX_AUDIO_MB = 25
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/ogg;codecs=opus',
  'audio/mp4',
]

const canRecord = () =>
  typeof navigator !== 'undefined' &&
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof MediaRecorder !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia)

function pickAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') {
    return ''
  }
  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function describeMicError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'Microphone access is blocked. Allow it for this site (browser and OS settings) or attach an audio file.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'No microphone was found. Attach an audio file instead.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Your microphone is busy in another app. Close it or attach an audio file.'
    case 'OverconstrainedError':
      return 'No microphone matched the requested settings. Attach an audio file instead.'
    case 'NotSupportedError':
      return 'Audio recording is not supported in this browser. Attach an audio file instead.'
    default:
      return `We could not reach your microphone (${error?.name || 'unknown error'}). Attach an audio file instead.`
  }
}

const MODALITIES = [
  { id: 'text', label: 'Text Lexical', icon: 'T' },
  { id: 'vision', label: 'CV Vision', icon: '◈' },
  { id: 'vox', label: 'Spectral Vox', icon: '∿' },
]

export default function Composer({ onSubmit, onError, disabled = false, autoFocus = false }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [audio, setAudio] = useState(null)
  const [recording, setRecording] = useState(false)
  const [activeModalities, setActiveModalities] = useState(new Set(['text']))
  const [micBlocked, setMicBlocked] = useState(false)

  const textareaRef = useRef(null)
  const imageInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  const hasContent = Boolean(image || audio || text.trim())
  const recordingSupported = canRecord() && !micBlocked

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, 192)}px`
  }, [text])

  useEffect(() => {
    if (!image) {
      setImageUrl(null)
      return undefined
    }
    const url = URL.createObjectURL(image)
    setImageUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks?.().forEach((track) => track.stop())
    }
  }, [])

  function acceptImage(selected) {
    if (!selected) return
    if (!ALLOWED_IMAGE_TYPES.includes(selected.type)) {
      onError('That image format is not supported. Use JPEG, PNG, WEBP, or GIF.')
      return
    }
    if (selected.size > MAX_IMAGE_MB * 1024 * 1024) {
      onError(`Images need to be smaller than ${MAX_IMAGE_MB} MB.`)
      return
    }
    onError(null)
    setImage(selected)
    setActiveModalities(prev => new Set([...prev, 'vision']))
  }

  function acceptAudio(selected) {
    if (!selected) return
    if (selected.size > MAX_AUDIO_MB * 1024 * 1024) {
      onError(`Audio needs to be smaller than ${MAX_AUDIO_MB} MB.`)
      return
    }
    onError(null)
    setAudio(selected)
    setActiveModalities(prev => new Set([...prev, 'vox']))
  }

  async function startRecording() {
    if (!canRecord() || micBlocked) {
      audioInputRef.current?.click()
      return
    }

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      setMicBlocked(true)
      onError(describeMicError(error))
      return
    }

    try {
      const mimeType = pickAudioMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const extension = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm'
        setAudio(new File([blob], `recording.${extension}`, { type }))
        stream.getTracks().forEach((track) => track.stop())
        setRecording(false)
        setActiveModalities(prev => new Set([...prev, 'vox']))
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      onError(null)
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop())
      onError(`Recording is not supported in this browser (${error?.name || 'unknown error'}). Attach an audio file instead.`)
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  function submit() {
    if (!hasContent || disabled) return
    onSubmit({ image, audio, text: text.trim() })
    setText('')
    setImage(null)
    setAudio(null)
    setActiveModalities(new Set(['text']))
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const hasAttachment = Boolean(image || audio)

  return (
    <div className="w-full bg-surface-lowest rounded-lg shadow-composer border border-outline-variant overflow-hidden transition-all focus-within:border-primary focus-within:shadow-card-hover">
      {/* Modalities strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant bg-surface-low/60 px-space-sm py-1.5">
        <div className="flex items-center gap-1">
          <span className="font-mono text-label-technical text-on-surface-variant uppercase mr-1 flex items-center gap-1">
            <Layers className="h-3 w-3 text-primary" />
            Ingestion:
          </span>
          {MODALITIES.map(({ id, label }) => {
            const isActive = activeModalities.has(id)
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveModalities(prev => {
                    const next = new Set(prev)
                    if (next.has(id) && id !== 'text') next.delete(id)
                    else next.add(id)
                    return next
                  })
                }}
                className={`inline-flex items-center gap-1 px-space-xs py-0.5 rounded font-mono text-label-code-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-high hover:text-on-surface'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-space-xs">
          <span className="font-mono text-label-code-sm text-on-surface-variant uppercase">Engine:</span>
          <div className="flex items-center p-0.5 bg-surface-container rounded">
            <span className="px-space-xs py-0.5 bg-surface-lowest text-primary font-mono text-label-code-sm font-bold rounded shadow-xs">
              ColBERT v2 Hybrid
            </span>
          </div>
        </div>
      </div>

      {/* Attachment tray */}
      {hasAttachment && (
        <div className="flex flex-wrap gap-2 px-space-sm pt-space-sm pb-1 border-b border-outline-variant/60">
          {image && (
            <div className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded bg-surface-lowest border border-outline-variant shadow-xs">
              <img src={imageUrl} alt="" className="w-6 h-6 rounded object-cover" />
              <span className="font-mono text-label-code-sm font-semibold text-primary max-w-[12rem] truncate">
                IMG: {image.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setImage(null)
                  setActiveModalities(prev => { const n = new Set(prev); n.delete('vision'); return n })
                }}
                className="text-on-surface-variant hover:text-error transition-colors"
                aria-label="Remove image"
              >
                <Close className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {audio && (
            <div className="inline-flex items-center gap-1.5 px-space-xs py-1 rounded bg-secondary-fixed/70 border border-secondary-fixed text-on-secondary-fixed">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-ping" />
              <Mic className="h-3.5 w-3.5 text-secondary" />
              <span className="font-mono text-label-code-sm font-medium max-w-[12rem] truncate">
                VOX: {audio.name}
              </span>
              <button
                type="button"
                onClick={() => {
                  setAudio(null)
                  setActiveModalities(prev => { const n = new Set(prev); n.delete('vox'); return n })
                }}
                className="text-on-secondary-fixed hover:text-error transition-colors"
                aria-label="Remove audio"
              >
                <Close className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Query editor */}
      <div className="px-space-sm pt-space-sm pb-1 bg-surface-lowest">
        <div className="flex items-start gap-space-xs">
          <span className="font-mono text-label-code-sm text-primary font-bold select-none pt-1.5 shrink-0">
            ir://query&gt;
          </span>
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            autoFocus={autoFocus}
            disabled={disabled}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your search — type a query, attach an image, or record voice input…"
            className="max-h-48 w-full resize-none bg-transparent text-body-lg leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/50"
          />
        </div>
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 px-space-sm py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || recording}
            className="btn btn-technical gap-1"
            title="Add image"
            aria-label="Add image"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            + Image
          </button>
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="btn btn-technical gap-1 text-primary"
              title="Stop recording"
            >
              <Stop className="h-3.5 w-3.5" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="btn btn-technical gap-1"
              title={recordingSupported ? 'Record voice' : 'Attach an audio file'}
              aria-label={recordingSupported ? 'Record voice' : 'Attach an audio file'}
            >
              <Mic className="h-3.5 w-3.5" />
              {recordingSupported ? 'Vox' : 'Audio'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-space-sm">
          <span className="hidden font-mono text-label-code-sm text-on-surface-variant md:inline">
            PRESS ⌘↵ TO SYNTHESIZE
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!hasContent || disabled}
            className="flex items-center gap-1.5 rounded bg-primary px-space-sm py-1.5 font-mono text-label-technical text-on-primary shadow-xs transition-all hover:bg-clay-deep active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Submit search"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Synthesize Intent
          </button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          acceptImage(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(event) => {
          acceptAudio(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
