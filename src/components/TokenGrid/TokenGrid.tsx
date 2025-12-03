import { useTokenContext } from '../../contexts/TokenContext'
import { FilterBar } from './FilterBar'
import { TokenStats } from './TokenStats'
import { TokenCard } from './TokenCard'
import type { Token } from '../../ts/types/index.js'
import styles from '../../styles/components/tokens/TokenGrid.module.css'

interface TokenGridProps {
  onTokenClick: (token: Token) => void
}

export function TokenGrid({ onTokenClick }: TokenGridProps) {
  const { filteredTokens, isLoading, error, tokens } = useTokenContext()

  const characterTokens = filteredTokens.filter((t) => t.type === 'character')
  const reminderTokens = filteredTokens.filter((t) => t.type === 'reminder')
  const metaTokens = filteredTokens.filter((t) => t.type !== 'character' && t.type !== 'reminder')

  if (tokens.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No tokens generated yet. Upload or paste a JSON script to get started.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner}></div>
        <p>Generating tokens...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <p className={styles.errorMessage}>Error: {error}</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <TokenStats />
      <FilterBar />

      {characterTokens.length > 0 && (
        <div className={styles.section}>
          <details open className={styles.collapsible}>
            <summary className={styles.sectionHeader}>Character Tokens</summary>
            <div id="characterTokenGrid" className={styles.grid}>
              {characterTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {reminderTokens.length > 0 && (
        <div className={styles.section}>
          <details open className={styles.collapsible}>
            <summary className={styles.sectionHeader}>Reminder Tokens</summary>
            <div id="reminderTokenGrid" className={`${styles.grid} ${styles.gridReminders}`}>
              {reminderTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {metaTokens.length > 0 && (
        <div className={styles.section}>
          <details open className={styles.collapsible}>
            <summary className={styles.sectionHeader}>Meta Tokens</summary>
            <div id="metaTokenGrid" className={styles.grid}>
              {metaTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {filteredTokens.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tokens match the current filters.</p>
        </div>
      )}
    </div>
  )
}
