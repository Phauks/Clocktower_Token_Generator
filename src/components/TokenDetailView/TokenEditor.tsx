import { useState, useEffect, useRef } from 'react'
import { JsonHighlight } from '../ScriptInput/JsonHighlight'
import type { Character } from '../../ts/types/index.js'
import styles from '../../styles/components/tokenDetail/TokenEditor.module.css'

interface TokenEditorProps {
  character: Character
  onEditChange: (field: keyof Character, value: any) => void
}

// Extended character type for decorative overrides
interface DecorativeOverrides {
  useCustomLeaves?: boolean
  leafStyle?: string
  leafCount?: number
  leafProbability?: number
  hideSetupFlower?: boolean
  setupFlowerStyle?: string
}

// Map team names to CSS Module class names
const teamSelectClassMap: Record<string, string> = {
  townsfolk: styles.teamTownsfolk,
  outsider: styles.teamOutsider,
  minion: styles.teamMinion,
  demon: styles.teamDemon,
  traveller: styles.teamTraveller,
  traveler: styles.teamTraveller,
  fabled: styles.teamFabled,
  loric: styles.teamLoric,
}

export function TokenEditor({ character, onEditChange }: TokenEditorProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'decoratives' | 'json'>('info')
  const [reminders, setReminders] = useState<string[]>(character.reminders || [])
  const [newReminder, setNewReminder] = useState('')
  
  // JSON editing state
  const [jsonText, setJsonText] = useState(() => JSON.stringify(character, null, 2))
  const [jsonError, setJsonError] = useState<string | null>(null)
  const jsonTextareaRef = useRef<HTMLTextAreaElement>(null)
  const jsonHighlightRef = useRef<HTMLDivElement>(null)
  
  // Decorative overrides stored in character._decoratives
  const decoratives: DecorativeOverrides = (character as any)._decoratives || {}
  
  // Update reminders when character changes
  useEffect(() => {
    setReminders(character.reminders || [])
  }, [character.id, character.reminders])
  
  // Update JSON text when character changes
  useEffect(() => {
    setJsonText(JSON.stringify(character, null, 2))
    setJsonError(null)
  }, [character.id])
  
  // Sync scroll between textarea and highlight overlay
  const handleJsonScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (jsonHighlightRef.current) {
      jsonHighlightRef.current.scrollTop = e.currentTarget.scrollTop
      jsonHighlightRef.current.scrollLeft = e.currentTarget.scrollLeft
    }
  }
  
  // Handle JSON text changes
  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setJsonText(newText)
    
    try {
      const parsed = JSON.parse(newText)
      setJsonError(null)
      // Apply all parsed fields to character
      Object.keys(parsed).forEach(key => {
        if (key !== 'id') { // Don't allow changing the ID
          onEditChange(key as keyof Character, parsed[key])
        }
      })
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }
  
  // Format JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      setJsonText(JSON.stringify(parsed, null, 2))
      setJsonError(null)
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Cannot format: Invalid JSON')
    }
  }
  
  const updateDecoratives = (updates: Partial<DecorativeOverrides>) => {
    onEditChange('_decoratives' as keyof Character, { ...decoratives, ...updates })
  }

  const handleAddReminder = () => {
    if (newReminder.trim()) {
      const updated = [...reminders, newReminder]
      setReminders(updated)
      onEditChange('reminders', updated)
      setNewReminder('')
    }
  }

  const handleRemoveReminder = (index: number) => {
    const updated = reminders.filter((_, i) => i !== index)
    setReminders(updated)
    onEditChange('reminders', updated)
  }

  return (
    <div className={styles.editor}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabsNav}>
          <button
            className={`${styles.tabButton} ${activeTab === 'info' ? styles.active : ''}`}
            onClick={() => setActiveTab('info')}
          >
            Character Information
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'decoratives' ? styles.active : ''}`}
            onClick={() => setActiveTab('decoratives')}
          >
            Decoratives
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'json' ? styles.active : ''}`}
            onClick={() => setActiveTab('json')}
          >
            JSON
          </button>
        </div>

        {activeTab === 'info' && (
          <div className={styles.tabContent}>
            <div className={styles.formGroup}>
              <label htmlFor="edit-id">Character ID</label>
              <input
                id="edit-id"
                type="text"
                value={character.id}
                readOnly
                disabled
                className={styles.readonlyField}
                title="Unique identifier for this character"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-name">Character Name</label>
              <input
                id="edit-name"
                type="text"
                value={character.name}
                onChange={(e) => onEditChange('name', e.target.value)}
                placeholder="Character name"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.teamSelectGroup} ${teamSelectClassMap[character.team] || ''}`}>
              <label htmlFor="edit-team">Team</label>
              <select
                id="edit-team"
                value={character.team}
                onChange={(e) => onEditChange('team', e.target.value)}
              >
                <option value="townsfolk">Townsfolk</option>
                <option value="outsider">Outsider</option>
                <option value="minion">Minion</option>
                <option value="demon">Demon</option>
                <option value="traveller">Traveller</option>
                <option value="fabled">Fabled</option>
                <option value="loric">Loric</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.setupCheckboxGroup}`}>
              <label htmlFor="edit-setup">Setup Character</label>
              <input
                id="edit-setup"
                type="checkbox"
                checked={character.setup || false}
                onChange={(e) => onEditChange('setup', e.target.checked)}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Image URLs</label>
              <p className={styles.fieldHint}>Add one or more image URLs. Multiple URLs provide fallback options.</p>
              <div className={styles.imageUrlsList}>
                {(Array.isArray(character.image) ? character.image : [character.image || '']).map((url, index) => (
                  <div key={index} className={styles.imageUrlRow}>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => {
                        const images = Array.isArray(character.image) ? [...character.image] : [character.image || '']
                        images[index] = e.target.value
                        onEditChange('image', images.length === 1 ? images[0] : images)
                      }}
                      placeholder="URL to character image"
                    />
                    <button
                      type="button"
                      className={`${styles.btnIcon} ${styles.btnDanger}`}
                      onClick={() => {
                        const images = Array.isArray(character.image) ? [...character.image] : [character.image || '']
                        if (images.length > 1) {
                          images.splice(index, 1)
                          onEditChange('image', images.length === 1 ? images[0] : images)
                        }
                      }}
                      disabled={!Array.isArray(character.image) || character.image.length <= 1}
                      title="Remove URL"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => {
                  const images = Array.isArray(character.image) ? [...character.image] : [character.image || '']
                  images.push('')
                  onEditChange('image', images)
                }}
              >
                + Add Image URL
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-ability">Ability Text</label>
              <textarea
                id="edit-ability"
                value={character.ability || ''}
                onChange={(e) => onEditChange('ability', e.target.value)}
                placeholder="Character ability description"
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-flavor">Flavor Text</label>
              <textarea
                id="edit-flavor"
                value={character.flavor || ''}
                onChange={(e) => onEditChange('flavor', e.target.value)}
                placeholder="Flavor quote or description"
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Reminders</label>
              <p className={styles.fieldHint}>Add reminder text that appears on reminder tokens.</p>
              <div className={styles.remindersUrlsList}>
                {reminders.map((reminder, idx) => (
                  <div key={idx} className={styles.reminderUrlRow}>
                    <input
                      type="text"
                      value={reminder}
                      onChange={(e) => {
                        const updated = [...reminders]
                        updated[idx] = e.target.value
                        setReminders(updated)
                        onEditChange('reminders', updated)
                      }}
                      placeholder="Reminder text"
                    />
                    <button
                      type="button"
                      className={`${styles.btnIcon} ${styles.btnDanger}`}
                      onClick={() => handleRemoveReminder(idx)}
                      title="Remove reminder"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => {
                  const updated = [...reminders, '']
                  setReminders(updated)
                  onEditChange('reminders', updated)
                }}
              >
                + Add Reminder
              </button>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-firstnight">First Night Reminder</label>
              <textarea
                id="edit-firstnight"
                value={character.firstNightReminder || ''}
                onChange={(e) => onEditChange('firstNightReminder', e.target.value)}
                placeholder="Reminder text for the first night"
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="edit-othernight">Other Night Reminder</label>
              <textarea
                id="edit-othernight"
                value={character.otherNightReminder || ''}
                onChange={(e) => onEditChange('otherNightReminder', e.target.value)}
                placeholder="Reminder text for other nights"
                rows={2}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Special</label>
              <p className={styles.fieldHint}>Add special app integration features for this character.</p>
              <div className={styles.specialItemsList}>
                {(() => {
                  // Ensure special is always treated as an array
                  const specialArray = Array.isArray((character as any).special) 
                    ? (character as any).special 
                    : (character as any).special 
                      ? [(character as any).special] 
                      : []
                  
                  const SPECIAL_TYPES = ['selection', 'ability', 'signal', 'vote', 'reveal', 'player'] as const
                  const SPECIAL_NAMES = ['grimoire', 'pointing', 'ghost-votes', 'distribute-roles', 'bag-disabled', 'bag-duplicate', 'multiplier', 'hidden', 'replace-character', 'player', 'card', 'open-eyes'] as const
                  const SPECIAL_TIMES = ['', 'pregame', 'day', 'night', 'firstNight', 'firstDay', 'otherNight', 'otherDay'] as const
                  const SPECIAL_GLOBALS = ['', 'townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'dead'] as const
                  
                  return specialArray.map((item: any, index: number) => {
                    // Parse item to get all properties
                    const itemObj = typeof item === 'object' && item !== null ? item : { type: 'selection', name: '' }
                    const itemType = itemObj.type || 'selection'
                    const itemName = itemObj.name || ''
                    const itemValue = itemObj.value !== undefined ? String(itemObj.value) : ''
                    const itemTime = itemObj.time || ''
                    const itemGlobal = itemObj.global || ''
                    
                    const updateSpecialItem = (updates: Record<string, any>) => {
                      const special = [...specialArray]
                      const newItem: Record<string, any> = { ...itemObj, ...updates }
                      // Remove empty optional fields
                      if (!newItem.value && newItem.value !== 0) delete newItem.value
                      if (!newItem.time) delete newItem.time
                      if (!newItem.global) delete newItem.global
                      special[index] = newItem
                      onEditChange('special' as keyof Character, special)
                    }
                    
                    return (
                      <div key={index} className={styles.specialItemCard}>
                        <div className={styles.specialItemHeader}>
                          <span className={styles.specialItemNumber}>#{index + 1}</span>
                          <button
                            type="button"
                            className={`${styles.btnIcon} ${styles.btnDanger}`}
                            onClick={() => {
                              const special = [...specialArray]
                              special.splice(index, 1)
                              onEditChange('special' as keyof Character, special)
                            }}
                            title="Remove special"
                          >
                            ✕
                          </button>
                        </div>
                        <div className={styles.specialItemFields}>
                          <div className={styles.specialField}>
                            <label>Type <span className={styles.required}>*</span></label>
                            <select
                              value={itemType}
                              onChange={(e) => updateSpecialItem({ type: e.target.value })}
                            >
                              {SPECIAL_TYPES.map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.specialField}>
                            <label>Name <span className={styles.required}>*</span></label>
                            <select
                              value={itemName}
                              onChange={(e) => updateSpecialItem({ name: e.target.value })}
                            >
                              <option value="">-- Select --</option>
                              {SPECIAL_NAMES.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.specialField}>
                            <label>Value</label>
                            <input
                              type="text"
                              value={itemValue}
                              onChange={(e) => {
                                const val = e.target.value
                                // Try to parse as number if it looks like one
                                const numVal = parseFloat(val)
                                updateSpecialItem({ value: !isNaN(numVal) && val === String(numVal) ? numVal : val })
                              }}
                              placeholder="Text or number"
                            />
                          </div>
                          <div className={styles.specialField}>
                            <label>Time</label>
                            <select
                              value={itemTime}
                              onChange={(e) => updateSpecialItem({ time: e.target.value })}
                            >
                              <option value="">-- None --</option>
                              {SPECIAL_TIMES.filter(t => t).map(time => (
                                <option key={time} value={time}>{time}</option>
                              ))}
                            </select>
                          </div>
                          <div className={styles.specialField}>
                            <label>Global</label>
                            <select
                              value={itemGlobal}
                              onChange={(e) => updateSpecialItem({ global: e.target.value })}
                            >
                              <option value="">-- None --</option>
                              {SPECIAL_GLOBALS.filter(g => g).map(global => (
                                <option key={global} value={global}>{global}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  })
                })()}
              </div>
              <button
                type="button"
                className={`${styles.btnSecondary} ${styles.btnSm}`}
                onClick={() => {
                  const specialArray = Array.isArray((character as any).special) 
                    ? (character as any).special 
                    : (character as any).special 
                      ? [(character as any).special] 
                      : []
                  const special = [...specialArray, { type: 'selection', name: 'grimoire' }]
                  onEditChange('special' as keyof Character, special)
                }}
              >
                + Add Special
              </button>
            </div>
          </div>
        )}

        {activeTab === 'decoratives' && (
          <div className={styles.tabContent}>
            <p className={styles.decorativesDescription}>
              Override global decorative settings for this character only.
            </p>
            
            {/* Leaf Settings */}
            <div className={styles.decorativesSection}>
              <h4>Leaf Decorations</h4>
              
              <div className={styles.formGroup}>
                <label htmlFor="use-custom-leaves">
                  <input
                    id="use-custom-leaves"
                    type="checkbox"
                    checked={decoratives.useCustomLeaves || false}
                    onChange={(e) => updateDecoratives({ useCustomLeaves: e.target.checked })}
                  />
                  Use custom leaf settings for this character
                </label>
              </div>
              
              {decoratives.useCustomLeaves && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="leaf-style">Leaf Style</label>
                    <select
                      id="leaf-style"
                      value={decoratives.leafStyle || 'classic'}
                      onChange={(e) => updateDecoratives({ leafStyle: e.target.value })}
                    >
                      <option value="classic">Classic</option>
                      <option value="none">None (disable leaves)</option>
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="leaf-count">Maximum Leaves</label>
                    <input
                      id="leaf-count"
                      type="range"
                      min={0}
                      max={9}
                      value={decoratives.leafCount ?? 0}
                      onChange={(e) => updateDecoratives({ leafCount: parseInt(e.target.value) })}
                    />
                    <span className={styles.sliderValue}>{decoratives.leafCount ?? 0}</span>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="leaf-probability">Leaf Probability</label>
                    <input
                      id="leaf-probability"
                      type="range"
                      min={0}
                      max={100}
                      value={decoratives.leafProbability ?? 30}
                      onChange={(e) => updateDecoratives({ leafProbability: parseInt(e.target.value) })}
                    />
                    <span className={styles.sliderValue}>{decoratives.leafProbability ?? 30}%</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Setup Flower Settings */}
            {character.setup && (
              <div className={styles.decorativesSection}>
                <h4>Setup Flower</h4>
                
                <div className={styles.formGroup}>
                  <label htmlFor="hide-setup-flower">
                    <input
                      id="hide-setup-flower"
                      type="checkbox"
                      checked={decoratives.hideSetupFlower || false}
                      onChange={(e) => updateDecoratives({ hideSetupFlower: e.target.checked })}
                    />
                    Hide setup flower for this character
                  </label>
                </div>
                
                {!decoratives.hideSetupFlower && (
                  <div className={styles.formGroup}>
                    <label htmlFor="setup-flower-style">Flower Style</label>
                    <select
                      id="setup-flower-style"
                      value={decoratives.setupFlowerStyle || 'default'}
                      onChange={(e) => updateDecoratives({ setupFlowerStyle: e.target.value })}
                    >
                      <option value="default">Use global setting</option>
                      <option value="setup_flower_1">Style 1</option>
                      <option value="setup_flower_2">Style 2</option>
                      <option value="setup_flower_3">Style 3</option>
                      <option value="setup_flower_4">Style 4</option>
                    </select>
                  </div>
                )}
              </div>
            )}
            
            <div className={styles.decorativesNote}>
              <p><strong>Note:</strong> These settings will override global options when regenerating this character's token.</p>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className={styles.tabContent}>
            <div className={styles.jsonTabContent}>
              <div className={styles.jsonHeader}>
                <p className={styles.jsonDescription}>Edit the raw JSON data for this character.</p>
                <div className={styles.jsonButtons}>
                  <button
                    type="button"
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={handleFormatJson}
                    title="Format JSON"
                  >
                    🎨 Format
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => {
                      navigator.clipboard.writeText(jsonText)
                        .then(() => {
                          // Could add a toast here if needed
                        })
                        .catch((err) => {
                          console.error('Failed to copy:', err)
                        })
                    }}
                    title="Copy JSON to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    type="button"
                    className={`${styles.btnSecondary} ${styles.btnSm}`}
                    onClick={() => {
                      const blob = new Blob([jsonText], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `${character.id || character.name || 'character'}.json`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }}
                    title="Download JSON file"
                  >
                    ⬇️ Download
                  </button>
                </div>
              </div>
              <div className={styles.jsonEditorWrapper}>
                <div className={styles.jsonHighlight} ref={jsonHighlightRef}>
                  <JsonHighlight json={jsonText} />
                </div>
                <textarea
                  ref={jsonTextareaRef}
                  className={styles.jsonEditor}
                  value={jsonText}
                  onChange={handleJsonChange}
                  onScroll={handleJsonScroll}
                  spellCheck={false}
                  aria-label="JSON editor"
                />
              </div>
              {jsonError && (
                <div className={styles.jsonError}>
                  ⚠️ {jsonError}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
