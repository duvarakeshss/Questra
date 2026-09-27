import { useEffect, useRef, useState } from 'react'
import { Close, Mic, Stop } from './Icons'

const MAX_AUDIO_MB = 25

export default function VoiceInput({ audio, onChange, onError, disabled = false }) {
  const [recording, setRecording] = useState(false)
  const fileInputRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  useEffect(() => {
    return () => {
      recorderRef.current?.stream?.getTracks?.().forEach((t) => t.stop())
    }
  }, [])

  async function startRecording() {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      fileInputRef.current?.click()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const file = new File([blob], 'recording.webm', { type: blob.type })
        onChange?.(file)
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
      }

      recorder.start()
      setRecording(true)
      onError?.(null)
    } catch {
      onError?.('Microphone access was denied or is not supported.')
      fileInputRef.current?.click()
    }
  }

  function stopRecording() {
    if (recorderRef.current && recording) {
      recorderRef.current.stop()
    }
  }

  function handleFile(file) {
    if (!file) return
    if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
      onError?.(`Audio file must be smaller than ${MAX_AUDIO_MB}MB.`)
      return
    }
    onError?.(null)
    onChange?.(file)
  }

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      {audio ? (
        <div className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface-low p-3">
          <div className="flex items-center gap-space-sm min-w-0">
            <Mic className="h-5 w-5 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-mono text-label-code-sm text-on-surface truncate">
                {audio.name || 'Recorded Audio'}
              </span>
              <span className="font-mono text-caption text-on-surface-variant">
                {(audio.size / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <audio src={URL.createObjectURL(audio)} controls className="h-8 max-w-[200px]" />
            <button
              type="button"
              onClick={() => onChange?.(null)}
              disabled={disabled}
              className="rounded p-1 text-on-surface-variant hover:text-on-surface hover:bg-surface-high transition-colors"
              aria-label="Remove audio"
            >
              <Close className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-space-sm">
          {recording ? (
            <button
              type="button"
              onClick={stopRecording}
              className="inline-flex items-center gap-2 rounded bg-error px-space-md py-2 font-mono text-label-technical text-on-error transition-all animate-pulse"
            >
              <Stop className="h-4 w-4" />
              <span>Stop Recording</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={startRecording}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded border border-outline-variant bg-surface-low px-space-md py-2 font-mono text-label-technical text-on-surface hover:bg-surface-high hover:border-outline transition-colors disabled:opacity-50"
            >
              <Mic className="h-4 w-4 text-primary" />
              <span>Record Voice Note</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || recording}
            className="font-mono text-label-code-sm text-secondary hover:underline disabled:opacity-50"
          >
            or upload audio file
          </button>
        </div>
      )}
    </div>
  )
}
