import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useProjectContext } from '../../contexts/ProjectContext'
import { useScriptData } from '../../hooks/useScriptData'
import { useTokenGenerator } from '../../hooks/useTokenGenerator'
import { useUndoStack } from '../../hooks/useUndoStack'
import { ViewLayout } from '../Layout/ViewLayout'
import { Button } from '../Shared/Button'
import { JsonHighlight } from '../ScriptInput/JsonHighlight'
import { sortScriptJsonBySAO, isScriptJsonSortedBySAO, condenseScript, hasCondensableReferences, logger, analyzeReminderText, normalizeReminderText } from '../../ts/utils/index.js'
import CONFIG from '../../ts/config.js'
import styles from '../../styles/components/views/Views.module.css'
import layoutStyles from '../../styles/components/layout/ViewLayout.module.css'
import scriptStyles from '../../styles/components/scriptInput/ScriptInput.module.css'

interface EditorViewProps {
  onGenerate?: () => void
  onNavigateToCustomize?: () => void
  onNavigateToProjects?: () => void
  onCreateProject?: () => void
}

export function EditorView({ onGenerate, onNavigateToCustomize, onNavigateToProjects, onCreateProject }: EditorViewProps) {
  const { jsonInput, setJsonInput, characters, isLoading, error, setError, warnings, setWarnings, scriptMeta, officialData } = useTokenContext()
  const { currentProject } = useProjectContext()
  const { loadScript, loadExampleScriptByName, parseJson, clearScript, addMetaToScript, hasUnderscoresInIds, removeUnderscoresFromIds, updateScript } = useScriptData()
  const { generateTokens } = useTokenGenerator()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [selectedExample, setSelectedExample] = useState<string>('')
  const [showAllMessages, setShowAllMessages] = useState(false)
  const [forceRegenerate, setForceRegenerate] = useState(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousJsonRef = useRef<string>('')
  const previousProjectIdRef = useRef<string | null>(null)
  const isUndoRedoRef = useRef(false)
  const isExternalChangeRef = useRef(false)

  const VISIBLE_MESSAGES_COUNT = 3

  // Get example scripts from config, strip .json extension for display
  const exampleScripts = CONFIG.EXAMPLE_SCRIPTS.map((filename: string) =>
    filename.replace(/\.json$/, '')
  )

  // Check if script is sorted by SAO (memoized to avoid recalculating on every render)
  const isScriptSorted = useMemo(() => {
    if (!jsonInput.trim() || characters.length === 0) return true
    return isScriptJsonSortedBySAO(jsonInput, { officialData }) ?? true
  }, [jsonInput, characters.length, officialData])

  // Check if script has condensable character references (memoized to avoid recalculating on every render)
  const hasCondensableRefs = useMemo(() => {
    if (!jsonInput.trim() || characters.length === 0 || !officialData.length) return false
    return hasCondensableReferences(jsonInput, officialData)
  }, [jsonInput, characters.length, officialData])

  // Check for non-standard format issues in night reminder fields
  const formatIssuesSummary = useMemo(() => {
    if (!jsonInput.trim() || characters.length === 0) return null

    const issuesFound: { characterName: string; field: 'firstNightReminder' | 'otherNightReminder'; issues: ReturnType<typeof analyzeReminderText> }[] = []

    for (const char of characters) {
      if (char.firstNightReminder) {
        const issues = analyzeReminderText(char.firstNightReminder)
        if (issues.length > 0) {
          issuesFound.push({ characterName: char.name, field: 'firstNightReminder', issues })
        }
      }
      if (char.otherNightReminder) {
        const issues = analyzeReminderText(char.otherNightReminder)
        if (issues.length > 0) {
          issuesFound.push({ characterName: char.name, field: 'otherNightReminder', issues })
        }
      }
    }

    if (issuesFound.length === 0) return null

    // Get unique issue types across all characters
    const uniqueIssueTypes = [...new Set(issuesFound.flatMap(f => f.issues.map(i => i.description)))]
    const totalCharactersAffected = new Set(issuesFound.map(f => f.characterName)).size

    return {
      issuesFound,
      uniqueIssueTypes,
      totalCharactersAffected,
      totalIssues: issuesFound.length
    }
  }, [jsonInput, characters])

  // Undo/redo stack for JSON input
  const undoStack = useUndoStack(jsonInput)

  // Sync undo stack with context when jsonInput changes externally
  useEffect(() => {
    if (!isUndoRedoRef.current && jsonInput !== undoStack.current) {
      undoStack.set(jsonInput)
    }
  }, [jsonInput, undoStack])

  // Reset "show all messages" when warnings/error change
  useEffect(() => {
    setShowAllMessages(false)
  }, [warnings, error])

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

    // Force regenerate if project changed (handles project activation)
    const projectChanged = previousProjectIdRef.current !== currentProject?.id

    // Skip if JSON hasn't changed AND project hasn't changed AND not force regenerating
    if (!projectChanged && previousJsonRef.current === jsonInput && forceRegenerate === 0) {
      return
    }

    previousJsonRef.current = jsonInput
    previousProjectIdRef.current = currentProject?.id ?? null

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
  }, [jsonInput, characters.length, autoGenerate, isLoading, generateTokens, onGenerate, forceRegenerate, currentProject?.id])

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
    await updateScript(text, 'upload')
    previousJsonRef.current = ''
  }, [updateScript])

  const handleExampleChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const scriptName = e.target.value
    setSelectedExample(scriptName)
    if (scriptName) {
      isExternalChangeRef.current = true
      await loadExampleScriptByName(scriptName)
      previousJsonRef.current = ''
    }
  }, [loadExampleScriptByName])

  const handleClear = useCallback(async () => {
    // Push current value to undo stack before clearing
    if (jsonInput.trim()) {
      undoStack.push(jsonInput)
    }
    await updateScript('', 'clear')
    setSelectedExample('')
    previousJsonRef.current = ''
  }, [jsonInput, updateScript, undoStack])

  const handleFormat = useCallback(async () => {
    try {
      const parsed = JSON.parse(jsonInput)
      const formatted = JSON.stringify(parsed, null, 2)
      undoStack.push(formatted)
      await updateScript(formatted, 'format')
    } catch {
      setError('Cannot format: Invalid JSON')
    }
  }, [jsonInput, updateScript, undoStack, setError])

  const handleSort = useCallback(async () => {
    try {
      const sorted = sortScriptJsonBySAO(jsonInput, { officialData })
      undoStack.push(sorted)
      await updateScript(sorted, 'sort')
      // Trigger force regeneration after React updates state
      setForceRegenerate(prev => prev + 1)
    } catch {
      setError('Cannot sort: Invalid JSON')
    }
  }, [jsonInput, updateScript, undoStack, setError, officialData])

  const handleCondenseScript = useCallback(async () => {
    try {
      const condensed = condenseScript(jsonInput, officialData)
      undoStack.push(condensed)
      await updateScript(condensed, 'condense')
      // Trigger force regeneration after React updates state
      setForceRegenerate(prev => prev + 1)
    } catch {
      setError('Cannot condense: Invalid JSON')
    }
  }, [jsonInput, updateScript, undoStack, setError, officialData])

  // Fix all non-standard format issues in night reminder fields
  const handleFixFormats = useCallback(async () => {
    try {
      const parsed = JSON.parse(jsonInput)
      if (!Array.isArray(parsed)) {
        setError('Cannot fix formats: JSON must be an array')
        return
      }

      let modified = false
      const updated = parsed.map((entry: any) => {
        if (typeof entry !== 'object' || entry === null) return entry
        if (entry.id === '_meta') return entry

        const newEntry = { ...entry }

        if (entry.firstNightReminder && analyzeReminderText(entry.firstNightReminder).length > 0) {
          newEntry.firstNightReminder = normalizeReminderText(entry.firstNightReminder)
          modified = true
        }

        if (entry.otherNightReminder && analyzeReminderText(entry.otherNightReminder).length > 0) {
          newEntry.otherNightReminder = normalizeReminderText(entry.otherNightReminder)
          modified = true
        }

        return newEntry
      })

      if (modified) {
        const fixedJson = JSON.stringify(updated, null, 2)
        undoStack.push(fixedJson)
        await updateScript(fixedJson, 'fix-formats')
        setForceRegenerate(prev => prev + 1)
      }
    } catch {
      setError('Cannot fix formats: Invalid JSON')
    }
  }, [jsonInput, updateScript, undoStack, setError])

  const handleUndo = useCallback(async () => {
    if (undoStack.canUndo) {
      isUndoRedoRef.current = true
      const previous = undoStack.undo()
      if (previous !== undefined) {
        await updateScript(previous, 'undo')
        previousJsonRef.current = previous
      }
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }, [undoStack, updateScript])

  const handleRedo = useCallback(async () => {
    if (undoStack.canRedo) {
      isUndoRedoRef.current = true
      const next = undoStack.redo()
      if (next !== undefined) {
        await updateScript(next, 'redo')
        previousJsonRef.current = next
      }
      setTimeout(() => { isUndoRedoRef.current = false }, 0)
    }
  }, [undoStack, updateScript])

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
    <ViewLayout variant="2-panel">
      {/* Left Sidebar - Load Scripts */}
      <ViewLayout.Panel position="left" width="left" scrollable>
        <div className={layoutStyles.panelContent}>
          {/* Upload Script */}
          <details className={layoutStyles.sidebarCard} open>
            <summary className={layoutStyles.sectionHeader}>Upload Script</summary>
            <div className={layoutStyles.optionSection}>
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
              <Button
                variant="secondary"
                fullWidth
                onClick={() => fileInputRef.current?.click()}
              >
                📁 Upload JSON File
              </Button>
            </div>
          </details>

          {/* Load Example Script */}
          <details className={layoutStyles.sidebarCard} open>
            <summary className={layoutStyles.sectionHeader}>Example Scripts</summary>
            <div className={layoutStyles.optionSection}>
              <p className={styles.leftPanelDesc}>
                Try an example script to explore the generator.
              </p>
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
              <Button
                variant="secondary"
                fullWidth
                onClick={() => selectedExample && loadExampleScriptByName(selectedExample)}
                disabled={!selectedExample}
                style={{ marginTop: '0.5rem' }}
              >
                Load Example
              </Button>
            </div>
          </details>
        </div>
      </ViewLayout.Panel>

      {/* Right Panel - JSON Editor */}
      <ViewLayout.Panel position="right" width="flex" scrollable>
        <div className={styles.editorContainer}>
            {/* Unified Single-Row Toolbar */}
            <div className={styles.editorUnifiedToolbar}>
              <div className={styles.scriptMetaInline}>
                <strong>{scriptMeta?.name || 'No Script Loaded'}</strong>
                {scriptMeta?.author && <span className={styles.metaAuthor}> by {scriptMeta.author}</span>}
              </div>

              <div className={styles.toolbarActions}>
                <Button
                  variant="ghost"
                  size="small"
                  isIconOnly
                  onClick={handleFormat}
                  title="Format JSON"
                >
                  🎨
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  isIconOnly
                  onClick={() => {
                    navigator.clipboard.writeText(jsonInput)
                      .then(() => {
                        logger.debug('EditorView', 'JSON copied to clipboard')
                      })
                      .catch((err) => {
                        logger.error('EditorView', 'Failed to copy JSON', err)
                        setError('Failed to copy to clipboard')
                      })
                  }}
                  title="Copy JSON to clipboard"
                >
                  📋
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  isIconOnly
                  onClick={handleUndo}
                  disabled={!undoStack.canUndo}
                  title="Undo (Ctrl+Z)"
                >
                  ↩️
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  isIconOnly
                  onClick={handleRedo}
                  disabled={!undoStack.canRedo}
                  title="Redo (Ctrl+Y)"
                >
                  ↪️
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  isIconOnly
                  onClick={handleClear}
                  title="Clear editor"
                >
                  🗑️
                </Button>
              </div>
            </div>

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
            {(error || warnings.length > 0 || (characters.length > 0 && !scriptMeta) || hasUnderscoresInIds() || (characters.length > 0 && !isScriptSorted) || hasCondensableRefs || formatIssuesSummary) && (
              <div className={styles.messagesBar}>
                {/* Missing _meta recommendation */}
                {characters.length > 0 && !scriptMeta && !error && (
                  <div className={`${styles.messageItem} ${styles.infoItem}`}>
                    <span>💡 This script doesn't have a <code>_meta</code> entry. Adding one enables script name tokens and better organization.</span>
                    <button
                      className={styles.addMetaBtn}
                      onClick={() => addMetaToScript()}
                      title="Add _meta entry to script"
                    >
                      Add _meta
                    </button>
                  </div>
                )}
                {/* Underscore in IDs recommendation */}
                {hasUnderscoresInIds() && !error && (
                  <div className={`${styles.messageItem} ${styles.infoItem}`}>
                    <span>💡 Some character IDs contain underscores. Official IDs don't use underscores (e.g., <code>fortune_teller</code> → <code>fortuneteller</code>).</span>
                    <button
                      className={styles.addMetaBtn}
                      onClick={removeUnderscoresFromIds}
                      title="Remove underscores from character IDs"
                    >
                      Remove underscores
                    </button>
                  </div>
                )}
                {/* Script not sorted recommendation */}
                {characters.length > 0 && !isScriptSorted && !error && (
                  <div className={`${styles.messageItem} ${styles.infoItem}`}>
                    <span>💡 Script not sorted in Standard Order.</span>
                    <button
                      className={styles.addMetaBtn}
                      onClick={handleSort}
                      title="Sort characters by Standard Amy Order"
                    >
                      Sort
                    </button>
                  </div>
                )}
                {/* Condensable character references recommendation */}
                {hasCondensableRefs && !error && (
                  <div className={`${styles.messageItem} ${styles.infoItem}`}>
                    <span>💡 Some official characters use object format. They can be simplified to string format for cleaner JSON.</span>
                    <button
                      className={styles.addMetaBtn}
                      onClick={handleCondenseScript}
                      title="Convert object references like { &quot;id&quot;: &quot;clockmaker&quot; } to string format &quot;clockmaker&quot;"
                    >
                      Condense Script
                    </button>
                  </div>
                )}
                {/* Non-standard format issues in night reminders */}
                {formatIssuesSummary && !error && (
                  <div className={`${styles.messageItem} ${styles.infoItem}`}>
                    <span>💡 Some night reminders use non-standard formats (e.g., <code>&lt;i class="reminder-token"&gt;</code> instead of <code>:reminder:</code>, or <code>**text**</code> instead of <code>*text*</code>).</span>
                    <button
                      className={styles.addMetaBtn}
                      onClick={handleFixFormats}
                      title="Normalize HTML tags and legacy formats to :reminder: and *text*"
                    >
                      Fix Formats
                    </button>
                  </div>
                )}
                {/* Build combined messages list */}
                {(error || warnings.length > 0) && (() => {
                  const allMessages = [
                    ...(error ? [{ type: 'error', text: error }] : []),
                    ...warnings.map(w => ({ type: 'warning', text: w }))
                  ]
                  const visibleMessages = allMessages.slice(0, VISIBLE_MESSAGES_COUNT)
                  const hiddenMessages = allMessages.slice(VISIBLE_MESSAGES_COUNT)
                  const hasMore = hiddenMessages.length > 0

                  return (
                    <>
                      <div className={styles.messagesDropdownUp}>
                        {visibleMessages.map((msg, i) => (
                          <div key={i} className={`${styles.messageItem} ${msg.type === 'error' ? styles.errorItem : styles.warningItem}`}>
                            {msg.type === 'error' ? '⚠️' : 'ℹ️'} {msg.text}
                          </div>
                        ))}
                        {showAllMessages && hiddenMessages.map((msg, i) => (
                          <div key={i + VISIBLE_MESSAGES_COUNT} className={`${styles.messageItem} ${msg.type === 'error' ? styles.errorItem : styles.warningItem}`}>
                            {msg.type === 'error' ? '⚠️' : 'ℹ️'} {msg.text}
                          </div>
                        ))}
                      </div>
                      {hasMore && (
                        <button 
                          className={styles.showMoreBtn}
                          onClick={() => setShowAllMessages(!showAllMessages)}
                        >
                          {showAllMessages 
                            ? '▲ Show less' 
                            : `▼ Show ${hiddenMessages.length} more`
                          }
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
        </div>
      </ViewLayout.Panel>
    </ViewLayout>
  )
}
