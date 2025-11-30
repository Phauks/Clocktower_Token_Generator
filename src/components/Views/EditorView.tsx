import { useState, useRef, useEffect, useCallback } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useScriptData } from '../../hooks/useScriptData'
import { useTokenGenerator } from '../../hooks/useTokenGenerator'
import { useUndoStack } from '../../hooks/useUndoStack'
import { JsonHighlight } from '../ScriptInput/JsonHighlight'
import CONFIG from '../../ts/config.js'

interface EditorViewProps {
  onGenerate?: () => void
}

export function EditorView({ onGenerate }: EditorViewProps) {
  const { jsonInput, setJsonInput, characters, isLoading, error, setError, warnings, setWarnings, scriptMeta, generationProgress } = useTokenContext()
  const { loadScript, loadExampleScriptByName, parseJson, clearScript } = useScriptData()
  const { generateTokens } = useTokenGenerator()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousJsonRef = useRef<string>('')
  const isUndoRedoRef = useRef(false)
  const isExternalChangeRef = useRef(false)

  // Get example scripts from config, strip .json extension for display
  const exampleScripts = CONFIG.EXAMPLE_SCRIPTS.map((filename: string) =>
    filename.replace(/\.json$/, '')
  )

  // Undo/redo stack for JSON input
  const undoStack = useUndoStack(jsonInput)

  // Sync undo stack with context when jsonInput changes externally
  useEffect(() => {
    if (!isUndoRedoRef.current && jsonInput !== undoStack.current) {
      undoStack.set(jsonInput)
    }
  }, [jsonInput, undoStack])

  // Debounced parsing of JSON input when user edits manually
  useEffect(() => {
    if (isExternalChangeRef.current) {
      isExternalChangeRef.current = false
      return
    }

    if (parseTimerRef.current) {
      clearTimeout(parseTimerRef.current)
    }

    parseTimerRef.current = setTimeout(() => {
      parseJson(jsonInput)
    }, 300)

    return () => {
      if (parseTimerRef.current) {
        clearTimeout(parseTimerRef.current)
      }
    }
  }, [jsonInput, parseJson])

  // Auto-generate tokens after debounce
  useEffect(() => {
    if (!autoGenerate || isLoading || !characters.length) {
      return
    }

    if (previousJsonRef.current === jsonInput) {
      return
    }

    previousJsonRef.current = jsonInput

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(async () => {
      await generateTokens()
      if (onGenerate) onGenerate()
    }, 300)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [jsonInput, characters.length, autoGenerate, isLoading, generateTokens, onGenerate])

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setJsonInput(newValue)
    undoStack.push(newValue)
    setError(null)
    setWarnings([])
  }, [setJsonInput, undoStack, setError, setWarnings])

  const handleFileUpload = useCallback(async (file: File) => {
    isExternalChangeRef.current = true
    const text = await file.text()
    await loadScript(text)
    previousJsonRef.current = ''
  }, [loadScript])

  const handleExampleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scriptName = e.target.value
    setSelectedExample(scriptName)
    if (scriptName) {
      isExternalChangeRef.current = true
      await loadExampleScriptByName(scriptName)
      previousJsonRef.current = ''
    }
  }, [loadExampleScriptByName])

  const handleClear = useCallback(() => {
    clearScript()
    setSelectedExample('')
    previousJsonRef.current = ''
    undoStack.clear('')
  }, [clearScript, undoStack])

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      setJsonInput(formatted)
      undoStack.push(formatted)
    } catch {
      setError('Cannot format: Invalid JSON')
    }
  }, [jsonInput, setJsonInput, undoStack, setError])

  const handleUndo = useCallback(() => {
    if (undoStack.canUndo) {
      isUndoRedoRef.current = true
      const previous = undoStack.undo()
      if (previous !== undefined) {
        setJsonInput(previous)
        parseJson(previous)
        previousJsonRef.current = previous
      }
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }, [undoStack, setJsonInput, parseJson])

  const handleRedo = useCallback(() => {
    if (undoStack.canRedo) {
      isUndoRedoRef.current = true
      const next = undoStack.redo()
      if (next !== undefined) {
        setJsonInput(next)
        parseJson(next)
        previousJsonRef.current = next
      }
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }, [undoStack, setJsonInput, parseJson])

  const handleManualGenerate = useCallback(async () => {
    await generateTokens()
    if (onGenerate) onGenerate()
  }, [generateTokens, onGenerate])

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    if (highlightRef.current) {
      highlightRef.current.scrollTop = e.currentTarget.scrollTop
      highlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }, [])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === 'application/json') {
      await handleFileUpload(file)
    }
  }, [handleFileUpload])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleUndo, handleRedo])

  return (
    <div className="editor-view">
      <div className="editor-container">
        {/* Top Action Bar with Generate Button */}
        <div className="editor-action-bar">
          <button
            className="btn-primary btn-generate"
            onClick={handleManualGenerate}
            disabled={isLoading || !characters.length}
          >
            {isLoading ? (
              generationProgress
                ? `⚡ Generating... (${generationProgress.current}/${generationProgress.total})`
                : '⚡ Generating...'
            ) : (
              '⚡ Generate Tokens'
            )}
          </button>
          <button
            className={`btn-toggle ${autoGenerate ? 'active' : ''}`}
            onClick={() => setAutoGenerate(!autoGenerate)}
            title={autoGenerate ? 'Auto-generate is ON' : 'Auto-generate is OFF'}
          >
            {autoGenerate ? '🔄' : '🔄'}
          </button>
          <button
            className="btn-secondary btn-icon-only"
            onClick={handleUndo}
            disabled={!undoStack.canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↩️
          </button>
          <button
            className="btn-secondary btn-icon-only"
            onClick={handleRedo}
            disabled={!undoStack.canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↪️
          </button>
        </div>

        {/* Toolbar */}
        <div className="editor-toolbar">
          <div className="toolbar-left">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <button
              className="btn-secondary btn-icon-only"
              onClick={() => fileInputRef.current?.click()}
              title="Upload JSON file"
            >
              📁
            </button>
            <select
              className="example-select"
              value={selectedExample}
              onChange={handleExampleChange}
            >
              <option value="">Load Example...</option>
              {exampleScripts.map((name: string) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <button
              className="btn-secondary btn-icon-only"
              onClick={handleFormat}
              title="Format JSON"
            >
              🎨
            </button>
            <button
              className="btn-secondary btn-icon-only"
              onClick={handleClear}
              title="Clear editor"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Script Meta Info */}
        {scriptMeta && (
          <div className="script-meta-bar">
            <span className="meta-item">
              <strong>{scriptMeta.name || 'Unnamed Script'}</strong>
              {scriptMeta.author && <span className="meta-author"> by {scriptMeta.author}</span>}
            </span>
            <span className="meta-item meta-count">
              {characters.length} characters
            </span>
          </div>
        )}

        {/* Editor Area */}
        <div
          className={`editor-wrapper ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="json-highlight" ref={highlightRef}>
            <JsonHighlight json={jsonInput} />
          </div>
          <textarea
            ref={textareaRef}
            className="json-editor"
            value={jsonInput}
            onChange={handleTextareaChange}
            onScroll={handleScroll}
            placeholder="Paste your Blood on the Clocktower script JSON here, or drag and drop a .json file..."
            spellCheck={false}
          />
          {isDragging && (
            <div className="drop-overlay">
              <span>Drop JSON file here</span>
            </div>
          )}
        </div>

        {/* Error/Warning Display */}
        {error && (
          <div className="editor-error">
            ⚠️ {error}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="editor-warnings">
            {warnings.map((warning, i) => (
              <div key={i} className="warning-item">⚠️ {warning}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
