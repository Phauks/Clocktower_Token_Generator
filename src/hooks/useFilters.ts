import { useCallback, useEffect } from 'react'
import { useTokenContext } from '../contexts/TokenContext'

export function useFilters() {
  const {
    tokens,
    filters,
    updateFilters,
    setFilteredTokens,
  } = useTokenContext()

  const applyFilters = useCallback(() => {
    let result = [...tokens]

    // Filter by teams (multi-select)
    if (filters.teams.length > 0) {
      result = result.filter((token) => filters.teams.includes(token.team || ''))
    }

    // Filter by token types (multi-select)
    if (filters.tokenTypes.length > 0) {
      result = result.filter((token) => {
        if (filters.tokenTypes.includes('meta')) {
          // Meta includes script-name, almanac, pandemonium tokens
          if (token.type !== 'character' && token.type !== 'reminder') {
            return true
          }
        }
        return filters.tokenTypes.includes(token.type)
      })
    }

    // Filter by display (official vs custom) - multi-select
    // Note: This would need to be determined by comparing with officialData
    // For now, we'll skip this filter as it requires more context

    // Filter by reminders (multi-select)
    if (filters.reminders.length > 0) {
      result = result.filter((token) => {
        if (filters.reminders.includes('has') && token.hasReminders) return true
        if (filters.reminders.includes('none') && !token.hasReminders) return true
        return false
      })
    }

    setFilteredTokens(result)
  }, [tokens, filters, setFilteredTokens])

  // Apply filters whenever tokens or filters change
  useEffect(() => {
    applyFilters()
  }, [tokens, filters, applyFilters])

  const resetFilters = useCallback(() => {
    updateFilters({
      teams: [],
      tokenTypes: [],
      display: [],
      reminders: [],
    })
  }, [updateFilters])

  const toggleTeam = useCallback((team: string) => {
    const current = filters.teams
    if (current.includes(team)) {
      updateFilters({ teams: current.filter(t => t !== team) })
    } else {
      updateFilters({ teams: [...current, team] })
    }
  }, [filters.teams, updateFilters])

  const toggleTokenType = useCallback((type: string) => {
    const current = filters.tokenTypes
    if (current.includes(type)) {
      updateFilters({ tokenTypes: current.filter(t => t !== type) })
    } else {
      updateFilters({ tokenTypes: [...current, type] })
    }
  }, [filters.tokenTypes, updateFilters])

  const toggleDisplay = useCallback((display: string) => {
    const current = filters.display
    if (current.includes(display)) {
      updateFilters({ display: current.filter(d => d !== display) })
    } else {
      updateFilters({ display: [...current, display] })
    }
  }, [filters.display, updateFilters])

  const toggleReminders = useCallback((reminder: string) => {
    const current = filters.reminders
    if (current.includes(reminder)) {
      updateFilters({ reminders: current.filter(r => r !== reminder) })
    } else {
      updateFilters({ reminders: [...current, reminder] })
    }
  }, [filters.reminders, updateFilters])

  return {
    applyFilters,
    resetFilters,
    toggleTeam,
    toggleTokenType,
    toggleDisplay,
    toggleReminders,
  }
}
