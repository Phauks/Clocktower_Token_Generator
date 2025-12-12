import { useCallback } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { TokenCard } from './TokenCard'
import { ConfirmModal } from '../Presets/ConfirmModal'
import { useTokenDeletion } from '../../hooks/useTokenDeletion'
import { useTokenGrouping } from '../../hooks/useTokenGrouping'
import { useStudioNavigation } from '../../hooks/useStudioNavigation'
import type { Token } from '../../ts/types/index.js'
import type { TabType } from '../Layout/TabNavigation'
import styles from '../../styles/components/tokens/TokenGrid.module.css'

interface TokenGridProps {
  /** Optional tokens array - when provided, uses these instead of context */
  tokens?: Token[]
  /** When true, hides editing controls (context menu, delete, set as example) */
  readOnly?: boolean
  /** Click handler for tokens - required when not readOnly */
  onTokenClick?: (token: Token) => void
  /** Tab change handler - for navigating to Studio */
  onTabChange?: (tab: TabType) => void
}

export function TokenGrid({ tokens: propTokens, readOnly = false, onTokenClick, onTabChange }: TokenGridProps) {
  const {
    filteredTokens: contextFilteredTokens,
    isLoading,
    error,
    tokens: contextTokens,
    setTokens,
    characters,
    setCharacters,
    setExampleToken,
    updateGenerationOptions
  } = useTokenContext()

  // Use prop tokens if provided, otherwise use context
  const displayTokens = propTokens ?? contextFilteredTokens
  const allTokens = propTokens ?? contextTokens

  const handleSetAsExample = useCallback((token: Token) => {
    setExampleToken(token)
  }, [setExampleToken])

  // Use custom hooks for token management
  const deletion = useTokenDeletion({
    tokens: allTokens,
    characters,
    setTokens,
    setCharacters,
    updateGenerationOptions
  })

  const grouping = useTokenGrouping(displayTokens)

  const studioNav = useStudioNavigation({ onTabChange })

  // For readOnly mode with prop tokens, skip loading/error states
  if (!propTokens && allTokens.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No tokens generated yet. Upload or paste a JSON script to get started.</p>
      </div>
    )
  }

  if (!propTokens && isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Generating tokens...</p>
      </div>
    )
  }

  if (!propTokens && error) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorMessage}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.tokenContainer}>
        {grouping.groupedCharacterTokens.length > 0 && (
          <div className={styles.section}>
            <details open className={styles.collapsible}>
              <summary className={styles.sectionHeader}>Character Tokens</summary>
              <div id="characterTokenGrid" className={styles.grid}>
                {grouping.groupedCharacterTokens.map((group) => (
                  <TokenCard
                    key={group.token.filename}
                    token={group.token}
                    count={group.count}
                    variants={group.variants}
                    onCardClick={readOnly ? undefined : onTokenClick}
                    onSetAsExample={readOnly ? undefined : handleSetAsExample}
                    onDelete={readOnly ? undefined : deletion.handleDeleteRequest}
                    onEditInStudio={readOnly ? undefined : studioNav.editInStudio}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        {grouping.groupedReminderTokens.length > 0 && (
          <div className={styles.section}>
            <details open className={styles.collapsible}>
              <summary className={styles.sectionHeader}>Reminder Tokens</summary>
              <div id="reminderTokenGrid" className={`${styles.grid} ${styles.gridReminders}`}>
                {grouping.groupedReminderTokens.map((group) => (
                  <TokenCard
                    key={group.token.filename}
                    token={group.token}
                    count={group.count}
                    variants={group.variants}
                    onCardClick={readOnly ? undefined : onTokenClick}
                    onSetAsExample={readOnly ? undefined : handleSetAsExample}
                    onDelete={readOnly ? undefined : deletion.handleDeleteRequest}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        {grouping.groupedMetaTokens.length > 0 && (
          <div className={styles.section}>
            <details open className={styles.collapsible}>
              <summary className={styles.sectionHeader}>Meta Tokens</summary>
              <div id="metaTokenGrid" className={styles.grid}>
                {grouping.groupedMetaTokens.map((group) => (
                  <TokenCard
                    key={group.token.filename}
                    token={group.token}
                    count={group.count}
                    variants={group.variants}
                    onCardClick={readOnly ? undefined : onTokenClick}
                    onSetAsExample={readOnly ? undefined : handleSetAsExample}
                    onDelete={readOnly ? undefined : deletion.handleDeleteRequest}
                  />
                ))}
              </div>
            </details>
          </div>
        )}

        {displayTokens.length === 0 && (
          <div className={styles.emptyState}>
            <p>No tokens match the current filters.</p>
          </div>
        )}
      </div>

      {!readOnly && (
        <ConfirmModal
          isOpen={deletion.tokenToDelete !== null}
          title="Delete Token"
          message={`Are you sure you want to delete the token "${deletion.tokenToDelete?.name}"? This action cannot be undone.`}
          onConfirm={deletion.confirmDelete}
          onCancel={deletion.cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}
    </div>
  )
}
