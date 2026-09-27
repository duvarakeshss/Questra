import { useEffect, useRef, useState } from 'react'

import { ArrowUp, Close, Image as ImageIcon, Mic, Stop } from './Icons'

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

export default function Composer({ onSubmit, onError, disabled = false, autoFocus = false }) {
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState(null)
  const [audio, setAudio] = useState(null)
  const [recording, setRecording] = useState(false)
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
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`
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
  }

  function acceptAudio(selected) {
    if (!selected) return
    if (selected.size > MAX_AUDIO_MB * 1024 * 1024) {
      onError(`Audio needs to be smaller than ${MAX_AUDIO_MB} MB.`)
      return
    }
    onError(null)
    setAudio(selected)
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
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
      onError(null)
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop())
      onError(
        `Recording is not supported in this browser (${error?.name || 'unknown error'}). Attach an audio file instead.`,
      )
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
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  const hasAttachment = Boolean(image || audio)

  return (
    <div className="glass overflow-hidden rounded-2xl border border-white/10 shadow-composer transition-colors focus-within:border-primary/70">
      {hasAttachment && (
        <div className="flex flex-wrap gap-2 border-b border-outline-variant/70 px-3 pt-3">
          {image && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-low py-1 pl-1 pr-2">
              <img src={imageUrl} alt="" className="h-7 w-7 rounded object-cover" />
              <span className="max-w-[12rem] truncate text-body-sm text-on-surface">{image.name}</span>
              <button type="button" onClick={() => setImage(null)} className="text-on-surface-variant hover:text-error" aria-label="Remove image">
                <Close className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {audio && (
            <div className="inline-flex items-center gap-2 rounded-lg border border-accent/40 bg-accent-soft py-1 pl-2 pr-2">
              <Mic className="h-3.5 w-3.5 text-accent-ink" />
              <span className="max-w-[12rem] truncate text-body-sm text-accent-ink">{audio.name}</span>
              <button type="button" onClick={() => setAudio(null)} className="text-accent-ink/70 hover:text-error" aria-label="Remove audio">
                <Close className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      <textarea
        ref={textareaRef}
        rows={1}
        value={text}
        autoFocus={autoFocus}
        disabled={disabled}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything — attach a picture or say it out loud…"
        className="max-h-[200px] w-full resize-none bg-transparent px-4 pt-3.5 text-body-lg leading-relaxed text-on-surface outline-none placeholder:text-on-surface-variant/50"
      />

      <div className="flex items-center justify-between gap-2 px-3 pb-2.5 pt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={disabled || recording}
            className="btn btn-ghost gap-1.5"
            title="Add image"
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>
          {recording ? (
            <button type="button" onClick={stopRecording} className="btn btn-ghost gap-1.5 text-error" title="Stop recording">
              <Stop className="h-3.5 w-3.5" />
              <span className="h-2 w-2 animate-pulse rounded-full bg-error" />
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="btn btn-ghost gap-1.5"
              title={recordingSupported ? 'Record voice' : 'Attach an audio file'}
              aria-label={recordingSupported ? 'Record voice' : 'Attach an audio file'}
            >
              <Mic className="h-4 w-4" />
              {recordingSupported ? 'Voice' : 'Audio'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasContent && (
            <span className="hidden text-caption text-on-surface-variant sm:inline">Enter to search</span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!hasContent || disabled}
            className="btn btn-primary rounded-full px-3 py-2"
            aria-label="Search"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

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
