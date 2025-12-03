import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useToast } from '../../contexts/ToastContext'
import { CharacterNavigation } from './CharacterNavigation'
import { TokenPreview } from './TokenPreview'
import { TokenEditor } from './TokenEditor'
import { ActionButtons } from './ActionButtons'
import { updateCharacterInJson, downloadCharacterTokensAsZip, downloadCharacterTokenOnly, downloadReminderTokensOnly, regenerateCharacterAndReminders } from '../../ts/ui/detailViewUtils'
import type { Token, Character } from '../../ts/types/index.js'
import styles from '../../styles/components/tokenDetail/TokenDetailModal.module.css'

interface TokenDetailModalProps {
  isOpen: boolean
  onClose: () => void
  initialToken?: Token
}

export function TokenDetailModal({ isOpen, onClose, initialToken }: TokenDetailModalProps) {
  const { characters, tokens, jsonInput, setJsonInput, setCharacters, setTokens, generationOptions } = useTokenContext()
  const { addToast } = useToast()
  
  // Determine the initial character ID from the clicked token
  // For character tokens, match by name; for reminder tokens, use parentCharacter (which is the character name)
  const getInitialCharacterId = () => {
    if (!initialToken) return characters[0]?.id || ''
    
    // If it's a reminder token, parentCharacter contains the character NAME (not ID)
    if (initialToken.parentCharacter) {
      const char = characters.find(c => c.name === initialToken.parentCharacter)
      if (char) return char.id
    }
    
    // If it's a character token, find the character by name
    if (initialToken.type === 'character') {
      const char = characters.find(c => c.name === initialToken.name)
      if (char) return char.id
    }
    
    return characters[0]?.id || ''
  }
  
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(getInitialCharacterId())
  const [editedCharacter, setEditedCharacter] = useState<Character | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [liveUpdateEnabled, setLiveUpdateEnabled] = useState(true)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false)
  const [previewCharacterToken, setPreviewCharacterToken] = useState<Token | null>(null)
  const [previewReminderTokens, setPreviewReminderTokens] = useState<Token[]>([])
  
  // Debounce timer for live updates
  const liveUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Debounce timer for auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Track previous character ID for unsaved changes detection
  const previousCharacterIdRef = useRef<string>(selectedCharacterId)
  // Track if we just auto-saved to prevent effect loops
  const justAutoSavedRef = useRef(false)

  // Update selected character when modal opens with a new token
  useEffect(() => {
    if (isOpen && initialToken) {
      // parentCharacter contains the character NAME, not ID
      if (initialToken.parentCharacter) {
        const char = characters.find(c => c.name === initialToken.parentCharacter)
        if (char) setSelectedCharacterId(char.id)
      } else if (initialToken.type === 'character') {
        const char = characters.find(c => c.name === initialToken.name)
        if (char) setSelectedCharacterId(char.id)
      }
    }
  }, [isOpen, initialToken, characters])

  useEffect(() => {
    if (selectedCharacterId && characters.length > 0) {
      // Skip if we just auto-saved (prevents loop)
      if (justAutoSavedRef.current) {
        justAutoSavedRef.current = false
        return
      }
      const char = characters.find((c) => c.id === selectedCharacterId)
      if (char) {
        setEditedCharacter(JSON.parse(JSON.stringify(char)))
        setIsDirty(false)
      }
    }
  }, [selectedCharacterId, characters])

  const selectedCharacter = useMemo(
    () => editedCharacter || characters.find((c) => c.id === selectedCharacterId),
    [editedCharacter, selectedCharacterId, characters]
  )

  // Find the character token - match by name since tokens use character name, not id
  const characterTokens = useMemo(
    () => {
      const char = characters.find((c) => c.id === selectedCharacterId)
      if (!char) return []
      return tokens.filter((t) => t.type === 'character' && t.name === char.name)
    },
    [tokens, selectedCharacterId, characters]
  )

  // Find reminder tokens - parentCharacter contains the character NAME, not ID
  const reminderTokens = useMemo(
    () => {
      const char = characters.find((c) => c.id === selectedCharacterId)
      if (!char) return []
      return tokens.filter((t) => t.type === 'reminder' && t.parentCharacter === char.name)
    },
    [tokens, selectedCharacterId, characters]
  )

  // Reset preview tokens when character changes
  useEffect(() => {
    setPreviewCharacterToken(null)
    setPreviewReminderTokens([])
  }, [selectedCharacterId])

  // Live update regeneration function
  const regeneratePreview = useCallback(async () => {
    if (!editedCharacter || !liveUpdateEnabled) return
    
    try {
      const { characterToken, reminderTokens: newReminderTokens } = await regenerateCharacterAndReminders(
        editedCharacter,
        generationOptions
      )
      setPreviewCharacterToken(characterToken)
      setPreviewReminderTokens(newReminderTokens)
    } catch (error) {
      console.error('Failed to regenerate preview:', error)
    }
  }, [editedCharacter, liveUpdateEnabled, generationOptions])

  // Debounced live update effect
  useEffect(() => {
    if (!liveUpdateEnabled || !isDirty || !editedCharacter) return
    
    // Clear any existing timer
    if (liveUpdateTimerRef.current) {
      clearTimeout(liveUpdateTimerRef.current)
    }
    
    // Set a new debounced timer (300ms delay)
    liveUpdateTimerRef.current = setTimeout(() => {
      regeneratePreview()
    }, 300)
    
    return () => {
      if (liveUpdateTimerRef.current) {
        clearTimeout(liveUpdateTimerRef.current)
      }
    }
  }, [editedCharacter, liveUpdateEnabled, isDirty, regeneratePreview])

  // Auto-save: update JSON when edits happen and auto-save is enabled
  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !editedCharacter) return
    
    // Debounce auto-save slightly to batch rapid changes
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      // Mark that we're auto-saving to prevent the character load effect from resetting
      justAutoSavedRef.current = true
      
      // Update the JSON input with the edited character
      try {
        const updatedJson = updateCharacterInJson(jsonInput, selectedCharacterId, editedCharacter)
        setJsonInput(updatedJson)
        
        // Update the characters array in context
        const updatedCharacters = characters.map((c: Character) => 
          c.id === selectedCharacterId ? editedCharacter : c
        )
        setCharacters(updatedCharacters)
        
        // Mark as clean since we auto-saved
        setIsDirty(false)
      } catch (error) {
        console.error('Auto-save failed:', error)
        justAutoSavedRef.current = false
      }
    }, 100)
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [autoSaveEnabled, isDirty, editedCharacter, selectedCharacterId, setJsonInput, setCharacters])

  // Handle character selection with unsaved changes prompt
  // Must be defined before early return to follow rules of hooks
  const handleSelectCharacter = useCallback((newCharacterId: string) => {
    if (isDirty && !autoSaveEnabled && previousCharacterIdRef.current !== newCharacterId) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes. Do you want to discard them?'
      )
      if (!confirmDiscard) return
    }
    previousCharacterIdRef.current = newCharacterId
    setSelectedCharacterId(newCharacterId)
  }, [isDirty, autoSaveEnabled])

  if (!isOpen) return null

  const handleEditChange = (field: keyof Character, value: any) => {
    setEditedCharacter(prev => {
      // Use previous state if available, otherwise fall back to finding the character
      const currentChar = prev || characters.find((c) => c.id === selectedCharacterId)
      if (currentChar) {
        return {
          ...currentChar,
          [field]: value,
        }
      }
      return prev
    })
    setIsDirty(true)
  }

  const handleReset = () => {
    const char = characters.find((c) => c.id === selectedCharacterId)
    if (char) {
      setEditedCharacter(JSON.parse(JSON.stringify(char)))
      setIsDirty(false)
      setPreviewCharacterToken(null)
      setPreviewReminderTokens([])
    }
  }

  const handleToggleLiveUpdate = () => {
    setLiveUpdateEnabled(prev => !prev)
    // Clear preview when disabling
    if (liveUpdateEnabled) {
      setPreviewCharacterToken(null)
      setPreviewReminderTokens([])
    }
  }

  const handleToggleAutoSave = () => {
    setAutoSaveEnabled(prev => !prev)
  }

  const handleDownloadJson = () => {
    if (!editedCharacter && !selectedCharacter) return
    
    const charData = editedCharacter || selectedCharacter
    if (!charData) return
    
    const jsonText = JSON.stringify(charData, null, 2)
    const blob = new Blob([jsonText], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${charData.id || charData.name || 'character'}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addToast(`Downloaded ${charData.name}.json`, 'success')
  }

  const handleAddCharacter = () => {
    // Create a new blank character with a unique ID
    const newId = `custom_${Date.now()}`
    const newCharacter: Character = {
      id: newId,
      name: 'New Character',
      team: 'townsfolk',
      ability: '',
      image: '',
      reminders: [],
    }
    
    // Add to characters array
    const updatedCharacters = [...characters, newCharacter]
    setCharacters(updatedCharacters)
    
    // Update JSON
    try {
      const parsed = JSON.parse(jsonInput)
      if (Array.isArray(parsed)) {
        parsed.push(newCharacter)
        setJsonInput(JSON.stringify(parsed, null, 2))
      }
    } catch (e) {
      console.error('Failed to update JSON:', e)
    }
    
    // Select the new character
    setSelectedCharacterId(newId)
    addToast('New character added', 'success')
  }

  const handleDeleteCharacter = (characterId?: string) => {
    const idToDelete = characterId || selectedCharacterId
    if (!idToDelete || characters.length <= 1) {
      addToast('Cannot delete the last character', 'error')
      return
    }
    
    const charToDelete = characters.find(c => c.id === idToDelete)
    if (!charToDelete) return
    
    // Remove from characters array
    const updatedCharacters = characters.filter(c => c.id !== idToDelete)
    setCharacters(updatedCharacters)
    
    // Remove associated tokens
    const updatedTokens = tokens.filter(t => {
      if (t.type === 'character' && t.name === charToDelete.name) return false
      if (t.type === 'reminder' && t.parentCharacter === charToDelete.name) return false
      return true
    })
    setTokens(updatedTokens)
    
    // Update JSON
    try {
      const parsed = JSON.parse(jsonInput)
      if (Array.isArray(parsed)) {
        const updatedParsed = parsed.filter((item: any) => {
          if (typeof item === 'string') return item !== idToDelete
          if (typeof item === 'object') return item.id !== idToDelete
          return true
        })
        setJsonInput(JSON.stringify(updatedParsed, null, 2))
      }
    } catch (e) {
      console.error('Failed to update JSON:', e)
    }
    
    // Select first remaining character if deleting the selected one
    if (idToDelete === selectedCharacterId && updatedCharacters.length > 0) {
      setSelectedCharacterId(updatedCharacters[0].id)
    }
    
    addToast(`Deleted ${charToDelete.name}`, 'success')
  }

  const handleDuplicateCharacter = (characterId: string) => {
    const charToDuplicate = characters.find(c => c.id === characterId)
    if (!charToDuplicate) return

    const newId = `${charToDuplicate.id}_copy_${Date.now()}`
    const newCharacter: Character = {
      ...JSON.parse(JSON.stringify(charToDuplicate)),
      id: newId,
      name: `${charToDuplicate.name} (Copy)`,
    }
    
    // Add to characters array
    const charIndex = characters.findIndex(c => c.id === characterId)
    const updatedCharacters = [...characters]
    updatedCharacters.splice(charIndex + 1, 0, newCharacter)
    setCharacters(updatedCharacters)
    
    // Update JSON
    try {
      const parsed = JSON.parse(jsonInput)
      if (Array.isArray(parsed)) {
        const jsonIndex = parsed.findIndex((item: any) => {
          if (typeof item === 'string') return item === characterId
          if (typeof item === 'object') return item.id === characterId
          return false
        })
        if (jsonIndex !== -1) {
          parsed.splice(jsonIndex + 1, 0, newCharacter)
          setJsonInput(JSON.stringify(parsed, null, 2))
        }
      }
    } catch (e) {
      console.error('Failed to update JSON:', e)
    }
    
    // Select the new character immediately
    setSelectedCharacterId(newId)
    addToast(`Duplicated ${charToDuplicate.name}`, 'success')
    
    // Generate tokens for the new character asynchronously (don't block UI)
    regenerateCharacterAndReminders(newCharacter, generationOptions)
      .then(({ characterToken, reminderTokens: newReminderTokens }) => {
        // Add the new tokens to the tokens array
        setTokens([...tokens, characterToken, ...newReminderTokens])
      })
      .catch((error) => {
        console.error('Failed to generate tokens for duplicated character:', error)
      })
  }

  const handleSelectMetaToken = (token: Token) => {
    // For meta tokens, we can show a simple preview or download option
    // Since meta tokens aren't editable like characters, just provide visual feedback
    addToast(`Selected: ${token.name}`, 'info')
  }

  const handleApplyToScript = async () => {
    if (!editedCharacter) return
    
    setIsLoading(true)
    try {
      // Update the JSON input with the edited character
      const updatedJson = updateCharacterInJson(jsonInput, selectedCharacterId, editedCharacter)
      setJsonInput(updatedJson)
      
      // Update the characters array in context
      const updatedCharacters = characters.map(c => 
        c.id === selectedCharacterId ? editedCharacter : c
      )
      setCharacters(updatedCharacters)
      
      // Regenerate only this character's tokens (character + reminders)
      const { characterToken, reminderTokens } = await regenerateCharacterAndReminders(
        editedCharacter,
        generationOptions
      )
      
      // Get the original character name to filter out old tokens
      const originalChar = characters.find(c => c.id === selectedCharacterId)
      const originalName = originalChar?.name || editedCharacter.name
      
      // Update tokens array: remove old tokens for this character, add new ones
      const updatedTokens = tokens.filter(t => {
        // Keep tokens that are not related to this character
        if (t.type === 'character' && t.name === originalName) return false
        if (t.type === 'reminder' && t.parentCharacter === originalName) return false
        return true
      })
      
      // Add the new tokens
      updatedTokens.push(characterToken, ...reminderTokens)
      setTokens(updatedTokens)
      
      setIsDirty(false)
      addToast(`Regenerated ${editedCharacter.name} tokens`, 'success')
    } catch (error) {
      console.error('Failed to apply changes:', error)
      addToast('Failed to apply changes to script', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadAll = async () => {
    if (!characterTokens.length) return
    
    setIsLoading(true)
    try {
      const charData = editedCharacter || selectedCharacter
      await downloadCharacterTokensAsZip(
        characterTokens[0],
        reminderTokens,
        selectedCharacter?.name || selectedCharacterId,
        generationOptions.pngSettings,
        charData  // Include character JSON in ZIP
      )
      addToast(`Downloaded ${selectedCharacter?.name} tokens`, 'success')
    } catch (error) {
      console.error('Failed to download tokens:', error)
      addToast('Failed to download tokens', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadCharacter = async () => {
    if (!characterTokens.length) return
    
    setIsLoading(true)
    try {
      await downloadCharacterTokenOnly(
        characterTokens[0],
        selectedCharacter?.name || selectedCharacterId,
        generationOptions.pngSettings
      )
      addToast(`Downloaded ${selectedCharacter?.name} character token`, 'success')
    } catch (error) {
      console.error('Failed to download character token:', error)
      addToast('Failed to download character token', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReminders = async () => {
    if (!reminderTokens.length) {
      addToast('No reminder tokens to download', 'warning')
      return
    }
    
    setIsLoading(true)
    try {
      await downloadReminderTokensOnly(
        reminderTokens,
        selectedCharacter?.name || selectedCharacterId,
        generationOptions.pngSettings
      )
      addToast(`Downloaded ${selectedCharacter?.name} reminder tokens`, 'success')
    } catch (error) {
      console.error('Failed to download reminder tokens:', error)
      addToast('Failed to download reminder tokens', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleEscapeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  // Use preview tokens if available (from live update), otherwise use stored tokens
  const displayCharacterToken = previewCharacterToken || characterTokens[0]
  const displayReminderTokens = previewReminderTokens.length > 0 ? previewReminderTokens : reminderTokens

  return (
    <div
      className={styles.modal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tokenDetailTitle"
      onKeyDown={handleEscapeKey}
    >
      <div className={styles.backdrop} onClick={handleBackdropClick} />
      <div className={styles.wrapper}>
        <CharacterNavigation
          characters={characters}
          tokens={tokens}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onAddCharacter={handleAddCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onDuplicateCharacter={handleDuplicateCharacter}
          onSelectMetaToken={handleSelectMetaToken}
        />

        <div className={styles.main}>
          <header className={styles.header}>
            <h2 id="tokenDetailTitle">{selectedCharacter?.name || 'Token Details'}</h2>
            <ActionButtons
              isDirty={isDirty}
              isLoading={isLoading}
              liveUpdateEnabled={liveUpdateEnabled}
              autoSaveEnabled={autoSaveEnabled}
              onReset={handleReset}
              onDownloadAll={handleDownloadAll}
              onDownloadCharacter={handleDownloadCharacter}
              onDownloadReminders={handleDownloadReminders}
              onDownloadJson={handleDownloadJson}
              onApply={handleApplyToScript}
              onToggleLiveUpdate={handleToggleLiveUpdate}
              onToggleAutoSave={handleToggleAutoSave}
              onDelete={() => handleDeleteCharacter()}
            />
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Close detail view"
            >
              ×
            </button>
          </header>

          {selectedCharacter && displayCharacterToken && (
            <div className={styles.content}>
              {/* Left column: Token preview + reminders */}
              <div className={styles.left}>
                <TokenPreview
                  characterToken={displayCharacterToken}
                  reminderTokens={displayReminderTokens}
                  onReminderClick={(reminder) => {
                    // parentCharacter contains the character NAME, find the character by name
                    const parentCharName = reminder.parentCharacter
                    if (parentCharName) {
                      const char = characters.find(c => c.name === parentCharName)
                      if (char) setSelectedCharacterId(char.id)
                    }
                  }}
                />
              </div>

              {/* Right column: Editor */}
              <div className={styles.right}>
                <TokenEditor character={selectedCharacter} onEditChange={handleEditChange} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}