import { useState, useRef, useEffect } from 'react'
import type { Token, Character, Team } from '../../ts/types/index.js'

interface CharacterNavigationProps {
  characters: Character[]
  tokens: Token[]
  selectedCharacterId: string
  onSelectCharacter: (characterId: string) => void
  onAddCharacter: () => void
  onDeleteCharacter: (characterId: string) => void
  onDuplicateCharacter: (characterId: string) => void
  onSelectMetaToken?: (token: Token) => void
}

// Order teams for display
const TEAM_ORDER: Team[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric']

// Team display names
const TEAM_DISPLAY_NAMES: Record<Team, string> = {
  townsfolk: 'Townsfolk',
  outsider: 'Outsiders',
  minion: 'Minions',
  demon: 'Demons',
  traveller: 'Travellers',
  fabled: 'Fabled',
  loric: 'Loric',
  meta: 'Meta Tokens',
}

export function CharacterNavigation({
  characters,
  tokens,
  selectedCharacterId,
  onSelectCharacter,
  onAddCharacter,
  onDeleteCharacter,
  onDuplicateCharacter,
  onSelectMetaToken,
}: CharacterNavigationProps) {
  const selectedRef = useRef<HTMLDivElement>(null)
  const [collapsedTeams, setCollapsedTeams] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; characterId: string } | null>(null)

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedCharacterId])

  // Close context menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null)
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu])

  const handleContextMenu = (e: React.MouseEvent, characterId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, characterId })
  }

  const getCharacterToken = (characterName: string) => {
    return tokens.find((t) => t.type === 'character' && t.name === characterName)
  }

  // parentCharacter contains the character NAME, not ID
  const getReminderCount = (characterName: string) => {
    return tokens.filter((t) => t.type === 'reminder' && t.parentCharacter === characterName).length
  }

  // Get meta tokens (not character or reminder)
  const metaTokens = tokens.filter((t) => t.type !== 'character' && t.type !== 'reminder')

  // Group characters by team
  const charactersByTeam = TEAM_ORDER.reduce((acc, team) => {
    acc[team] = characters.filter((char) => char.team === team)
    return acc
  }, {} as Record<Team, Character[]>)

  const toggleTeamCollapse = (team: string) => {
    setCollapsedTeams((prev) => {
      const next = new Set(prev)
      if (next.has(team)) {
        next.delete(team)
      } else {
        next.add(team)
      }
      return next
    })
  }

  const renderCharacterItem = (char: Character, isLast: boolean) => {
    const reminderCount = getReminderCount(char.name)
    const isSelected = char.id === selectedCharacterId
    const charToken = getCharacterToken(char.name)
    const teamClass = char.team?.toLowerCase() || 'townsfolk'

    return (
      <div key={char.id} className={`token-nav-item-wrapper ${!isLast ? 'with-divider' : ''}`}>
        <div
          ref={isSelected ? selectedRef : null}
          className={`token-nav-item team-${teamClass} ${isSelected ? 'selected' : ''}`}
          onClick={() => onSelectCharacter(char.id)}
          onContextMenu={(e) => handleContextMenu(e, char.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectCharacter(char.id)
            }
          }}
          title={`${char.name} (${reminderCount} reminders) - Right-click for options`}
        >
          {charToken && (
            <div className="token-nav-thumbnail">
              <canvas
                width="40"
                height="40"
                ref={(canvas) => {
                  if (canvas && charToken.canvas) {
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      ctx.drawImage(charToken.canvas, 0, 0, 40, 40)
                    }
                  }
                }}
              />
            </div>
          )}
          <div className="token-nav-info">
            <div className="token-nav-name">{char.name}</div>
          </div>
          {reminderCount > 0 && (
            <div className="token-nav-badge">{reminderCount}</div>
          )}
        </div>
      </div>
    )
  }

  const renderMetaTokenItem = (token: Token, isLast: boolean) => {
    return (
      <div key={token.filename} className={`token-nav-item-wrapper ${!isLast ? 'with-divider' : ''}`}>
        <div
          className="token-nav-item team-meta"
          role="button"
          tabIndex={0}
          title={token.name}
          onClick={() => onSelectMetaToken?.(token)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectMetaToken?.(token)
            }
          }}
        >
          <div className="token-nav-thumbnail">
            <canvas
              width="40"
              height="40"
              ref={(canvas) => {
                if (canvas && token.canvas) {
                  const ctx = canvas.getContext('2d')
                  if (ctx) {
                    ctx.drawImage(token.canvas, 0, 0, 40, 40)
                  }
                }
              }}
            />
          </div>
          <div className="token-nav-info">
            <div className="token-nav-name">{token.name}</div>
          </div>
        </div>
      </div>
    )
  }

  const collapseAll = () => {
    const allTeams = new Set([...TEAM_ORDER.map(t => t as string), 'meta'])
    setCollapsedTeams(allTeams)
  }

  const expandAll = () => {
    setCollapsedTeams(new Set())
  }

  return (
    <aside className="token-detail-nav">
      <div className="nav-header">
        <div className="nav-header-top">
          <h3>Characters</h3>
          <button
            type="button"
            className="nav-add-btn"
            onClick={onAddCharacter}
            title="Add new character"
          >
            +
          </button>
        </div>
        <div className="nav-header-actions">
          <button
            type="button"
            className="nav-text-btn"
            onClick={collapseAll}
          >
            Collapse
          </button>
          <button
            type="button"
            className="nav-text-btn"
            onClick={expandAll}
          >
            Expand
          </button>
        </div>
      </div>
      <div className="nav-list">
        {TEAM_ORDER.map((team) => {
          const teamCharacters = charactersByTeam[team]
          const isCollapsed = collapsedTeams.has(team)

          return (
            <div key={team} className="team-section">
              <button
                type="button"
                className={`team-header team-${team}`}
                onClick={() => toggleTeamCollapse(team)}
                aria-expanded={!isCollapsed}
              >
                <span className="team-collapse-icon">{isCollapsed ? '▶' : '▼'}</span>
                <span className="team-name">{TEAM_DISPLAY_NAMES[team]}</span>
                <span className="team-count">{teamCharacters.length}</span>
              </button>
              {!isCollapsed && teamCharacters.length > 0 && (
                <div className="team-characters">
                  {teamCharacters.map((char, index) => 
                    renderCharacterItem(char, index === teamCharacters.length - 1)
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Meta tokens section */}
        {metaTokens.length > 0 && (
          <div className="team-section">
            <button
              type="button"
              className="team-header team-meta"
              onClick={() => toggleTeamCollapse('meta')}
              aria-expanded={!collapsedTeams.has('meta')}
            >
              <span className="team-collapse-icon">{collapsedTeams.has('meta') ? '▶' : '▼'}</span>
              <span className="team-name">{TEAM_DISPLAY_NAMES['meta']}</span>
              <span className="team-count">{metaTokens.length}</span>
            </button>
            {!collapsedTeams.has('meta') && (
              <div className="team-characters">
                {metaTokens.map((token, index) => 
                  renderMetaTokenItem(token, index === metaTokens.length - 1)
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="character-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            type="button"
            onClick={() => {
              onDuplicateCharacter(contextMenu.characterId)
              setContextMenu(null)
            }}
          >
            📋 Duplicate
          </button>
          <button
            type="button"
            className="danger"
            onClick={() => {
              onDeleteCharacter(contextMenu.characterId)
              setContextMenu(null)
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </aside>
  )
}
