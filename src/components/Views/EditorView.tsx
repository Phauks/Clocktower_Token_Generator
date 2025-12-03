import { useState, useRef, useEffect, useCallback } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useScriptData } from '../../hooks/useScriptData'
import { useTokenGenerator } from '../../hooks/useTokenGenerator'
import { useUndoStack } from '../../hooks/useUndoStack'
import { JsonHighlight } from '../ScriptInput/JsonHighlight'
import CONFIG from '../../ts/config.js'
import styles from '../../styles/components/views/Views.module.css'
import scriptStyles from '../../styles/components/scriptInput/ScriptInput.module.css'

interface EditorViewProps {
  onGenerate?: () => void
  onNavigateToCustomize?: () => void
}

export function EditorView({ onGenerate, onNavigateToCustomize }: EditorViewProps) {
  const { jsonInput, setJsonInput, characters, isLoading, error, setError, warnings, setWarnings, scriptMeta } = useTokenContext()
  const { loadScript, loadExampleScriptByName, parseJson, clearScript } = useScriptData()
  const { generateTokens } = useTokenGenerator()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string>('')
  const [showMessages, setShowMessages] = useState(false)
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
    // Push current value to undo stack before clearing
    if (jsonInput.trim()) {
      undoStack.push(jsonInput)
    }
    clearScript()
    setSelectedExample('')
    previousJsonRef.current = ''
  }, [jsonInput, clearScript, undoStack])

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
    <div className={styles.editorView}>
      <div className={styles.editorSplitLayout}>
        {/* Left Panel - Create New Character & Load Scripts */}
        <div className={styles.editorLeftPanel}>
          <div className={styles.leftPanelSection}>
            <h3 className={styles.leftPanelTitle}>Create Custom Character</h3>
            <p className={styles.leftPanelDesc}>
              Design your own custom character token from scratch.
            </p>
            <button
              className={`btn-primary ${styles.btnLeftPanelAction}`}
              onClick={onNavigateToCustomize}
            >
              ✨ Create New Character
            </button>
          </div>

          <div className={styles.leftPanelSection}>
            <h3 className={styles.leftPanelTitle}>Upload Script</h3>
            <p className={styles.leftPanelDesc}>
              Import a script JSON file from your computer.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              style={{ display: 'none' }}
            />
            <button
              className={`btn-secondary ${styles.btnLeftPanelAction}`}
              onClick={() => fileInputRef.current?.click()}
            >
              📁 Upload JSON File
            </button>
          </div>

          <div className={styles.leftPanelSection}>
            <h3 className={styles.leftPanelTitle}>Load Example Script</h3>
            <p className={styles.leftPanelDesc}>
              Try an example script to explore the generator.
            </p>
            <div className={styles.leftPanelRow}>
              <select
                className={styles.leftPanelSelect}
                value={selectedExample}
                onChange={(e) => setSelectedExample(e.target.value)}
              >
                <option value="">Select an example...</option>
                {exampleScripts.map((name: string) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <button
                className={`btn-secondary ${styles.btnLeftPanelSmall}`}
                onClick={() => selectedExample && loadExampleScriptByName(selectedExample)}
                disabled={!selectedExample}
                title="Load selected example"
              >
                Load
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - JSON Editor */}
        <div className={styles.editorRightPanel}>
          <div className={styles.editorContainer}>
            {/* Unified Toolbar */}
            <div className={styles.editorUnifiedToolbar}>
              <div className={styles.toolbarLeft}>
                <button
                  className={`btn-primary ${styles.btnGenerateSmall}`}
                  onClick={handleManualGenerate}
                  disabled={isLoading || !characters.length}
                >
                  {isLoading ? '⚡ Generating...' : '⚡ Generate'}
                </button>
                <button
                  className={`${styles.btnToggleSmall} ${autoGenerate ? styles.active : ''}`}
                  onClick={() => setAutoGenerate(!autoGenerate)}
                  title={autoGenerate ? 'Auto-generate is ON' : 'Auto-generate is OFF'}
                >
                  {autoGenerate ? '🔄 Auto' : '🔄 Auto'}
                </button>
              </div>
              <div className={styles.toolbarRight}>
                <button
                  className={`btn-secondary ${styles.btnIconOnly}`}
                  onClick={handleFormat}
                  title="Format JSON"
                >
                  🎨
                </button>
                <button
                  className={`btn-secondary ${styles.btnIconOnly}`}
                  onClick={handleUndo}
                  disabled={!undoStack.canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  ↩️
                </button>
                <button
                  className={`btn-secondary ${styles.btnIconOnly}`}
                  onClick={handleRedo}
                  disabled={!undoStack.canRedo}
                  title="Redo (Ctrl+Y)"
                >
                  ↪️
                </button>
                <button
                  className={`btn-secondary ${styles.btnIconOnly}`}
                  onClick={handleClear}
                  title="Clear editor"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Script Meta Info */}
            {scriptMeta && (
              <div className={styles.scriptMetaBar}>
                <span className={styles.metaItem}>
                  <strong>{scriptMeta.name || 'Unnamed Script'}</strong>
                  {scriptMeta.author && <span className={styles.metaAuthor}> by {scriptMeta.author}</span>}
                </span>
                <span className={`${styles.metaItem} ${styles.metaCount}`}>
                  {characters.length} characters
                </span>
              </div>
            )}

            {/* Editor Area */}
            <div
              className={`${styles.editorWrapper} ${isDragging ? styles.dragging : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={scriptStyles.jsonHighlight} ref={highlightRef}>
                <JsonHighlight json={jsonInput} />
              </div>
              <textarea
                ref={textareaRef}
                className={scriptStyles.jsonEditor}
                value={jsonInput}
                onChange={handleTextareaChange}
                onScroll={handleScroll}
                placeholder="Paste your Blood on the Clocktower script JSON here, or drag and drop a .json file..."
                spellCheck={false}
              />
              {isDragging && (
                <div className={styles.dropOverlay}>
                  <span>Drop JSON file here</span>
                </div>
              )}
            </div>

            {/* Messages indicator (errors/warnings) - below editor */}
            {(error || warnings.length > 0) && (
              <div className={styles.messagesBar}>
                <button 
                  className={`${styles.messagesToggle} ${error ? styles.hasError : styles.hasWarning}`}
                  onClick={() => setShowMessages(!showMessages)}
                >
                  <span className={styles.messagesIcon}>{error ? '⚠️' : 'ℹ️'}</span>
                  <span className={styles.messagesCount}>
                    {error ? '1 error' : `${warnings.length} warning${warnings.length !== 1 ? 's' : ''}`}
                  </span>
                  <span className={styles.messagesChevron}>{showMessages ? '▲' : '▼'}</span>
                </button>
                {showMessages && (
                  <div className={styles.messagesDropdownUp}>
                    {error && (
                      <div className={styles.messageItem + ' ' + styles.errorItem}>
                        ⚠️ {error}
                      </div>
                    )}
                    {warnings.map((warning, i) => (
                      <div key={i} className={styles.messageItem + ' ' + styles.warningItem}>
                        ℹ️ {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
