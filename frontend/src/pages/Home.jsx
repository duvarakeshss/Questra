import { useState } from 'react'
import ImageInput from '../components/ImageInput'
import VoiceInput from '../components/VoiceInput'
import TextInput from '../components/TextInput'
import QuerySuggestions from '../components/QuerySuggestions'
import SearchResults from '../components/SearchResults'
import LoadingSpinner from '../components/LoadingSpinner'
import { generateSuggestions, search, extractError } from '../services/api'
import { Brand } from '../components/Icons'

export default function Home() {
  const [stage, setStage] = useState('input') // 'input' | 'suggestions' | 'results'
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [audio, setAudio] = useState(null)
  const [suggestions, setSuggestions] = useState([])
  const [context, setContext] = useState(null)
  const [results, setResults] = useState([])
  const [activeQuery, setActiveQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState(null)

  async function handleGenerate() {
    if (!text.trim() && !image && !audio) {
      setError('Please provide at least one input (text, image, or audio).')
      return
    }
    setError(null)
    setLoading(true)
    setLoadingMsg('Processing multimodal inputs and synthesizing intent pathways...')

    try {
      const data = await generateSuggestions({ text, image, audio })
      setSuggestions(data.suggestions || [])
      setContext(data.context || null)
      setStage('suggestions')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(query) {
    if (!query) return
    setError(null)
    setActiveQuery(query)
    setLoading(true)
    setLoadingMsg(`Retrieving results and semantically reranking for "${query}"...`)

    try {
      const data = await search(query)
      setResults(data.results || [])
      setStage('results')
    } catch (err) {
      setError(extractError(err))
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setText('')
    setImage(null)
    setAudio(null)
    setSuggestions([])
    setContext(null)
    setResults([])
    setActiveQuery('')
    setError(null)
    setStage('input')
  }

  return (
    <div className="min-h-screen bg-surface px-space-md py-8 md:px-space-xl">
      <div className="mx-auto max-w-4xl space-y-space-lg">
        {/* Navigation & Brand Header */}
        <header className="flex items-center justify-between border-b border-outline-variant pb-4">
          <div className="flex items-center gap-space-sm cursor-pointer" onClick={handleReset}>
            <Brand className="h-8 w-8" />
            <span className="font-sans text-title-md font-bold tracking-tight text-on-surface">
              QUESTRA
            </span>
            <span className="rounded bg-surface-high px-2 py-0.5 font-mono text-label-code-sm text-secondary">
              STAGE: {stage.toUpperCase()}
            </span>
          </div>

          {stage !== 'input' && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded bg-surface-low px-space-sm py-1.5 font-mono text-label-technical text-on-surface hover:bg-surface-high transition-colors"
            >
              + New Investigation
            </button>
          )}
        </header>

        {error && (
          <div className="rounded border border-error/20 bg-error/10 p-3 font-mono text-label-code-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message={loadingMsg} />
          </div>
        ) : (
          <>
            {stage === 'input' && (
              <div className="space-y-space-lg">
                <div className="text-center max-w-xl mx-auto space-y-2">
                  <h1 className="text-headline-md font-bold text-on-surface">
                    Multimodal Intent Discovery
                  </h1>
                  <p className="text-body-md text-on-surface-variant">
                    Provide text, upload an image, or speak your inquiry to generate diverse verified search pathways.
                  </p>
                </div>

                <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-card space-y-6">
                  <div>
                    <label className="block font-mono text-label-technical text-on-surface-variant uppercase mb-2">
                      1. Visual Anchor (Optional)
                    </label>
                    <ImageInput image={image} onChange={setImage} onError={setError} />
                  </div>

                  <div>
                    <label className="block font-mono text-label-technical text-on-surface-variant uppercase mb-2">
                      2. Voice Note (Optional)
                    </label>
                    <VoiceInput audio={audio} onChange={setAudio} onError={setError} />
                  </div>

                  <div>
                    <label className="block font-mono text-label-technical text-on-surface-variant uppercase mb-2">
                      3. Query Prompt or Constraints (Optional)
                    </label>
                    <TextInput value={text} onChange={setText} />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="w-full rounded-lg bg-primary py-3 font-mono text-label-technical font-semibold text-on-primary transition-all hover:bg-clay-deep shadow-sm"
                  >
                    Generate Query Pathways →
                  </button>
                </div>
              </div>
            )}

            {stage === 'suggestions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStage('input')}
                    className="font-mono text-label-code-sm text-secondary hover:underline"
                  >
                    ← Back to Input
                  </button>
                </div>

                <QuerySuggestions
                  suggestions={suggestions}
                  context={context}
                  onSelect={handleSearch}
                  onRegenerate={() => handleGenerate()}
                  onError={setError}
                />
              </div>
            )}

            {stage === 'results' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStage('suggestions')}
                    className="font-mono text-label-code-sm text-secondary hover:underline"
                  >
                    ← Back to Query Suggestions
                  </button>
                </div>

                <SearchResults
                  query={activeQuery}
                  results={results}
                  onRetry={handleSearch}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
