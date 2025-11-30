import { useCallback, useEffect } from 'react'
import { useTokenContext } from '../contexts/TokenContext'
import type { Token } from '../ts/types/index.js'

export function useFilters() {
  const {
    tokens,
    filters,
    updateFilters,
    setFilteredTokens,
  } = useTokenContext()

  const applyFilters = useCallback(() => {
    let result = [...tokens]

    // Filter by team
    if (filters.team !== 'all') {
      result = result.filter((token) => token.team === filters.team)
    }

    // Filter by token type
    if (filters.tokenType !== 'all') {
      if (filters.tokenType === 'meta') {
        // Meta includes script-name, almanac, pandemonium tokens
        result = result.filter((token) => token.type !== 'character' && token.type !== 'reminder')
      } else {
        result = result.filter((token) => token.type === filters.tokenType)
      }
    }

    // Filter by display (official vs custom)
    if (filters.display !== 'all') {
      result = result.filter((token) => {
        // This would need to be determined by comparing with officialData
        // For now, we'll skip this filter as it requires more context
        return true
      })
    }

    // Filter by reminders
    if (filters.reminders !== 'all') {
      if (filters.reminders === 'has') {
        result = result.filter((token) => token.hasReminders)
      } else if (filters.reminders === 'none') {
        result = result.filter((token) => !token.hasReminders)
      }
    }

    setFilteredTokens(result)
  }, [tokens, filters, setFilteredTokens])

  // Apply filters whenever tokens or filters change
  useEffect(() => {
    applyFilters()
  }, [tokens, filters, applyFilters])

  const resetFilters = useCallback(() => {
    updateFilters({
      team: 'all',
      tokenType: 'all',
      display: 'all',
      reminders: 'all',
    })
  }, [updateFilters])

  return {
    applyFilters,
    resetFilters,
    setTeamFilter: (team: string) => updateFilters({ team }),
    setTokenTypeFilter: (tokenType: string) => updateFilters({ tokenType }),
    setDisplayFilter: (display: string) => updateFilters({ display }),
    setRemindersFilter: (reminders: string) => updateFilters({ reminders }),
  }
}
