import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { useToast } from '../../contexts/ToastContext'
import { CharacterNavigation } from '../TokenDetailView/CharacterNavigation'
import { TokenPreview } from '../TokenDetailView/TokenPreview'
import { TokenEditor } from '../TokenDetailView/TokenEditor'
import { ActionButtons } from '../TokenDetailView/ActionButtons'
import { updateCharacterInJson, downloadCharacterTokensAsZip, downloadCharacterTokenOnly, downloadReminderTokensOnly, regenerateCharacterAndReminders } from '../../ts/detailViewUtils'
import type { Token, Character } from '../../ts/types/index.js'

interface CustomizeViewProps {
  initialToken?: Token
  selectedCharacterId?: string
  onCharacterSelect?: (characterId: string) => void
}

export function CustomizeView({ initialToken, selectedCharacterId: externalSelectedId, onCharacterSelect }: CustomizeViewProps) {
  const { characters, tokens, jsonInput, setJsonInput, setCharacters, setTokens, generationOptions } = useTokenContext()
  const { addToast } = useToast()
  
  // Determine the initial character ID from the clicked token or external prop
  const getInitialCharacterId = () => {
    if (externalSelectedId) return externalSelectedId
    if (!initialToken) return characters[0]?.id || ''
    
    if (initialToken.parentCharacter) {
      const char = characters.find(c => c.name === initialToken.parentCharacter)
      if (char) return char.id
    }
    
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
  
  const liveUpdateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousCharacterIdRef = useRef<string>(selectedCharacterId)
  const justAutoSavedRef = useRef(false)

  // Sync with external selected ID
  useEffect(() => {
    if (externalSelectedId && externalSelectedId !== selectedCharacterId) {
      setSelectedCharacterId(externalSelectedId)
    }
  }, [externalSelectedId])

  // Notify parent of character selection changes
  useEffect(() => {
    if (onCharacterSelect && selectedCharacterId) {
      onCharacterSelect(selectedCharacterId)
    }
  }, [selectedCharacterId, onCharacterSelect])

  useEffect(() => {
    if (selectedCharacterId && characters.length > 0) {
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

  const characterTokens = useMemo(
    () => {
      const char = characters.find((c) => c.id === selectedCharacterId)
      if (!char) return []
      return tokens.filter((t) => t.type === 'character' && t.name === char.name)
    },
    [tokens, selectedCharacterId, characters]
  )

  const reminderTokens = useMemo(
    () => {
      const char = characters.find((c) => c.id === selectedCharacterId)
      if (!char) return []
      return tokens.filter((t) => t.type === 'reminder' && t.parentCharacter === char.name)
    },
    [tokens, selectedCharacterId, characters]
  )

  useEffect(() => {
    setPreviewCharacterToken(null)
    setPreviewReminderTokens([])
  }, [selectedCharacterId])

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

  useEffect(() => {
    if (!liveUpdateEnabled || !isDirty || !editedCharacter) return
    
    if (liveUpdateTimerRef.current) {
      clearTimeout(liveUpdateTimerRef.current)
    }
    
    liveUpdateTimerRef.current = setTimeout(() => {
      regeneratePreview()
    }, 300)
    
    return () => {
      if (liveUpdateTimerRef.current) {
        clearTimeout(liveUpdateTimerRef.current)
      }
    }
  }, [editedCharacter, liveUpdateEnabled, isDirty, regeneratePreview])

  useEffect(() => {
    if (!autoSaveEnabled || !isDirty || !editedCharacter) return
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    
    autoSaveTimerRef.current = setTimeout(() => {
      justAutoSavedRef.current = true
      
      try {
        const updatedJson = updateCharacterInJson(jsonInput, selectedCharacterId, editedCharacter)
        setJsonInput(updatedJson)
        const updatedChars = characters.map(c => 
          c.id === selectedCharacterId ? editedCharacter : c
        )
        setCharacters(updatedChars)
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
  }, [autoSaveEnabled, isDirty, editedCharacter, selectedCharacterId, setJsonInput, setCharacters, jsonInput, characters])

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

  // No tokens yet - show empty state
  if (!tokens.length || !characters.length) {
    return (
      <div className="customize-view customize-view-empty">
        <div className="empty-state">
          <h2>No Tokens Generated</h2>
          <p>Generate tokens in the Editor or Gallery tab first, then come back here to customize individual tokens.</p>
        </div>
      </div>
    )
  }

  const handleEditChange = (field: keyof Character, value: any) => {
    if (editedCharacter) {
      setEditedCharacter({
        ...editedCharacter,
        [field]: value,
      })
      setIsDirty(true)
    }
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
    const newId = `custom_${Date.now()}`
    const newCharacter: Character = {
      id: newId,
      name: 'New Character',
      team: 'townsfolk',
      ability: '',
      reminders: [],
      image: '',
    }
    
    const updatedCharacters = [...characters, newCharacter]
    setCharacters(updatedCharacters)
    
    try {
      const parsed = JSON.parse(jsonInput)
      if (Array.isArray(parsed)) {
        parsed.push(newCharacter)
        setJsonInput(JSON.stringify(parsed, null, 2))
      }
    } catch (e) {
      console.error('Failed to update JSON:', e)
    }
    
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
    
    const updatedCharacters = characters.filter(c => c.id !== idToDelete)
    setCharacters(updatedCharacters)
    
    const updatedTokens = tokens.filter(t => {
      if (t.type === 'character' && t.name === charToDelete.name) return false
      if (t.type === 'reminder' && t.parentCharacter === charToDelete.name) return false
      return true
    })
    setTokens(updatedTokens)
    
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
    
    const charIndex = characters.findIndex(c => c.id === characterId)
    const updatedCharacters = [...characters]
    updatedCharacters.splice(charIndex + 1, 0, newCharacter)
    setCharacters(updatedCharacters)
    
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
    
    setSelectedCharacterId(newId)
    addToast(`Duplicated ${charToDuplicate.name}`, 'success')
    
    regenerateCharacterAndReminders(newCharacter, generationOptions)
      .then(({ characterToken, reminderTokens: newReminderTokens }) => {
        const updatedTokens = [...tokens, characterToken, ...newReminderTokens]
        setTokens(updatedTokens)
      })
      .catch((error) => {
        console.error('Failed to generate tokens for duplicated character:', error)
      })
  }

  const handleSelectMetaToken = (token: Token) => {
    addToast(`Selected: ${token.name}`, 'info')
  }

  const handleApplyToScript = async () => {
    if (!editedCharacter) return
    
    setIsLoading(true)
    try {
      const updatedJson = updateCharacterInJson(jsonInput, selectedCharacterId, editedCharacter)
      setJsonInput(updatedJson)
      
      const updatedCharacters = characters.map(c => 
        c.id === selectedCharacterId ? editedCharacter : c
      )
      setCharacters(updatedCharacters)
      
      const { characterToken, reminderTokens: newReminderTokens } = await regenerateCharacterAndReminders(
        editedCharacter,
        generationOptions
      )
      
      const originalChar = characters.find(c => c.id === selectedCharacterId)
      const originalName = originalChar?.name || editedCharacter.name
      
      const updatedTokens = tokens.filter(t => {
        if (t.type === 'character' && t.name === originalName) return false
        if (t.type === 'reminder' && t.parentCharacter === originalName) return false
        return true
      })
      
      updatedTokens.push(characterToken, ...newReminderTokens)
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
        charData
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

  const displayCharacterToken = previewCharacterToken || characterTokens[0]
  const displayReminderTokens = previewReminderTokens.length > 0 ? previewReminderTokens : reminderTokens

  return (
    <div className="customize-view">
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

      <div className="customize-main">
        <header className="customize-header">
          <h2>{selectedCharacter?.name || 'Token Details'}</h2>
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
        </header>

        {selectedCharacter && displayCharacterToken && (
          <div className="customize-content">
            <div className="customize-left">
              <TokenPreview
                characterToken={displayCharacterToken}
                reminderTokens={displayReminderTokens}
                onReminderClick={(reminder) => {
                  const parentCharName = reminder.parentCharacter
                  if (parentCharName) {
                    const char = characters.find(c => c.name === parentCharName)
                    if (char) setSelectedCharacterId(char.id)
                  }
                }}
              />
            </div>

            <div className="customize-right">
              <TokenEditor character={selectedCharacter} onEditChange={handleEditChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
