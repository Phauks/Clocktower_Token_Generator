/**
 * Character List View
 *
 * Alternative display mode showing characters in a compact table format:
 * [Icon | Name | Ability]
 *
 * Grouped by team with colored headers that can be collapsed.
 * Shows the raw character icon (not the rendered token).
 * Designed for quick scanning of script contents.
 */

import { useMemo, useState, useCallback } from 'react'
import { TEAM_COLORS, TEAM_LABELS } from '../../ts/config.js'
import { useCharacterImageResolver } from '../../hooks/useCharacterImageResolver.js'
import type { Token, Team, Character } from '../../ts/types/index.js'
import styles from '../../styles/components/projects/CharacterListView.module.css'

interface CharacterListViewProps {
  /** Tokens to display - extracts character data from character tokens */
  tokens: Token[]
}

interface CharacterRow {
  uuid: string
  id: string
  name: string
  team: Team
  ability: string
  order: number
}

// Team order for grouping
const TEAM_ORDER: Team[] = ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric']

export function CharacterListView({ tokens }: CharacterListViewProps) {
  // Track which team sections are collapsed
  const [collapsedTeams, setCollapsedTeams] = useState<Set<Team>>(new Set())

  // Extract Character objects from tokens for the resolver hook
  const characters = useMemo(() => {
    const characterTokens = tokens.filter(t => t.type === 'character')
    const seenIds = new Set<string>()
    const chars: Character[] = []

    for (const token of characterTokens) {
      const character = token.characterData
      if (!character) continue

      // Skip duplicates (from variants)
      if (seenIds.has(character.id)) continue
      seenIds.add(character.id)

      chars.push(character)
    }

    return chars
  }, [tokens])

  // Use the shared hook for async image resolution
  const { resolvedUrls, isLoading } = useCharacterImageResolver({ characters })

  // Extract character data from tokens and group by team
  const groupedCharacters = useMemo(() => {
    const characterTokens = tokens.filter(t => t.type === 'character')

    // Create unique character rows (handle variants)
    const seenIds = new Set<string>()
    const characterRows: CharacterRow[] = []

    for (const token of characterTokens) {
      const character = token.characterData
      if (!character) continue

      // Skip duplicates (from variants)
      const uniqueKey = character.id
      if (seenIds.has(uniqueKey)) continue
      seenIds.add(uniqueKey)

      characterRows.push({
        uuid: character.uuid || character.id,
        id: character.id,
        name: character.name || token.name,
        team: character.team as Team,
        ability: character.ability || '',
        order: token.order ?? characterRows.length
      })
    }

    // Group by team
    const grouped = new Map<Team, CharacterRow[]>()

    for (const team of TEAM_ORDER) {
      const teamCharacters = characterRows
        .filter(c => c.team === team)
        .sort((a, b) => a.order - b.order)

      if (teamCharacters.length > 0) {
        grouped.set(team, teamCharacters)
      }
    }

    return grouped
  }, [tokens])

  const toggleTeamCollapse = useCallback((team: Team) => {
    setCollapsedTeams(prev => {
      const next = new Set(prev)
      if (next.has(team)) {
        next.delete(team)
      } else {
        next.add(team)
      }
      return next
    })
  }, [])

  const isTeamCollapsed = (team: Team) => collapsedTeams.has(team)

  // Check if there are any characters to display
  const totalCharacters = Array.from(groupedCharacters.values()).reduce(
    (sum, chars) => sum + chars.length,
    0
  )

  if (totalCharacters === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No characters to display</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {Array.from(groupedCharacters.entries()).map(([team, characters]) => (
        <div key={team} className={styles.teamSection}>
          <button
            type="button"
            className={styles.teamHeader}
            style={{ backgroundColor: TEAM_COLORS[team] }}
            onClick={() => toggleTeamCollapse(team)}
            aria-expanded={!isTeamCollapsed(team)}
          >
            <span className={styles.collapseIcon}>
              {isTeamCollapsed(team) ? '▶' : '▼'}
            </span>
            <span className={styles.teamName}>{TEAM_LABELS[team]}</span>
            <span className={styles.teamCount}>{characters.length}</span>
          </button>

          {!isTeamCollapsed(team) && (
            <div className={styles.characterList}>
              {characters.map(character => {
                const iconUrl = resolvedUrls.get(character.uuid)
                return (
                  <div
                    key={character.id}
                    className={styles.characterRow}
                  >
                    <div className={styles.characterIcon}>
                      {iconUrl ? (
                        <img
                          src={iconUrl}
                          alt={character.name}
                          className={styles.iconImage}
                        />
                      ) : (
                        <div
                          className={styles.iconPlaceholder}
                          style={{ backgroundColor: TEAM_COLORS[character.team] }}
                        >
                          {isLoading ? '...' : character.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className={styles.characterName}>
                      {character.name}
                    </div>

                    <div className={styles.characterAbility}>
                      {character.ability || <span className={styles.noAbility}>No ability text</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
