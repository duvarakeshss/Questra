import { useRef, useState } from 'react'

const MODE_PLACEHOLDERS = {
  text: 'Describe it in a few words...',
  image: 'Attach a picture to search with...',
  voice: 'Tap the mic and say it out loud...',
}

export default function ComposerBar({
  draft,
  onDraftChange,
  onSubmit,
  disabled,
  status = 'idle',
  recording = false,
  onStartRecording,
  onStopRecording,
  imageInputRef,
  audioInputRef,
  showModes = true,
}) {
  const [mode, setMode] = useState('text')
  const inputRef = useRef(null)

  const text = draft?.text ?? ''
  const hasContent = Boolean(draft?.image || draft?.audio || text.trim())

  function handleSubmit(event) {
    event?.preventDefault()
    if (!hasContent || disabled) return
    onSubmit?.({ image: draft?.image, audio: draft?.audio, text: text.trim() })
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {showModes && (
        <div className="modes glass">
          <button type="button" className={`mode${mode === 'text' ? ' on' : ''}`} onClick={() => setMode('text')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
            </svg>
            Text
          </button>
          <button
            type="button"
            className={`mode${mode === 'image' ? ' on' : ''}`}
            onClick={() => {
              setMode('image')
              imageInputRef?.current?.click()
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="9" cy="10" r="1.6" />
              <path d="m21 16-5-5-8 8" />
            </svg>
            Image
          </button>
          <button
            type="button"
            className={`mode${mode === 'voice' ? ' on' : ''}`}
            onClick={() => {
              setMode('voice')
              onStartRecording?.()
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
            Voice
          </button>
        </div>
      )}

      <form className="search-bar glass" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          value={text}
          onChange={(event) => onDraftChange?.((prev) => ({ ...prev, text: event.target.value }))}
          onKeyDown={handleKeyDown}
          placeholder={MODE_PLACEHOLDERS[mode]}
          disabled={disabled}
          autoComplete="off"
          aria-label="Describe what you are looking for"
        />

        <button
          type="button"
          className="ib"
          aria-label="Attach image"
          onClick={() => imageInputRef?.current?.click()}
          disabled={disabled || recording}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="m21 16-5-5-8 8" />
          </svg>
        </button>

        {recording ? (
          <button
            type="button"
            className="ib"
            aria-label="Stop recording"
            onClick={onStopRecording}
            style={{ background: 'rgba(220,38,38,0.12)', color: '#EF4444' }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="7" y="7" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button type="button" className="ib" aria-label="Voice" onClick={onStartRecording} disabled={disabled}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="3" width="6" height="11" rx="3" />
              <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
            </svg>
          </button>
        )}

        <button type="submit" className="send-btn" aria-label="Search" disabled={!hasContent || disabled}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 19V5m-6 6 6-6 6 6" />
          </svg>
        </button>
      </form>

      <div className="hint">
        {recording ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite' }} />
            Recording…
          </span>
        ) : status === 'reading' ? (
          'Reading your input…'
        ) : status === 'searching' ? (
          'Searching the web…'
        ) : (
          '↵ drafts ideas · ⇧↵ newline'
        )}
      </div>
    </>
  )
}

const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']

const canRecord = () =>
  typeof navigator !== 'undefined' &&
  typeof window !== 'undefined' &&
  window.isSecureContext &&
  typeof MediaRecorder !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia)

function pickAudioMimeType() {
  if (typeof MediaRecorder === 'undefined' || typeof MediaRecorder.isTypeSupported !== 'function') return ''
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

ComposerBar.useComposerRefs = () => {
  const imageInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const [recording, setRecording] = useState(false)
  const [micBlocked, setMicBlocked] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  return {
    imageInputRef,
    audioInputRef,
    recording,
    startRecording: async (onError, onDraftChange) => {
      if (!canRecord() || micBlocked) {
        audioInputRef.current?.click()
        return
      }

      let stream
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (error) {
        setMicBlocked(true)
        onError?.(describeMicError(error))
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
          onDraftChange?.((prev) => ({ ...prev, audio: new File([blob], `recording.${extension}`, { type }) }))
          stream.getTracks().forEach((track) => track.stop())
          setRecording(false)
        }
        recorder.start()
        recorderRef.current = recorder
        setRecording(true)
        onError?.(null)
      } catch (error) {
        stream.getTracks().forEach((track) => track.stop())
        onError?.(`Recording is not supported in this browser (${error?.name || 'unknown error'}). Attach an audio file instead.`)
      }
    },
    stopRecording: () => {
      recorderRef.current?.stop()
    },
  }
}
