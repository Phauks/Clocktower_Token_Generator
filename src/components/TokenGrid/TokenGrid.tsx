import { useTokenContext } from '../../contexts/TokenContext'
import { FilterBar } from './FilterBar'
import { TokenStats } from './TokenStats'
import { TokenCard } from './TokenCard'
import type { Token } from '../../ts/types/index.js'

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
      <div className="empty-state">
        <p>No tokens generated yet. Upload or paste a JSON script to get started.</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
        <p>Generating tokens...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="error-state">
        <p className="error-message">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="token-grid-container">
      <TokenStats />
      <FilterBar />

      {characterTokens.length > 0 && (
        <div className="token-section">
          <details open className="token-collapsible">
            <summary className="token-section-header">Character Tokens</summary>
            <div id="characterTokenGrid" className="token-grid">
              {characterTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {reminderTokens.length > 0 && (
        <div className="token-section">
          <details open className="token-collapsible">
            <summary className="token-section-header">Reminder Tokens</summary>
            <div id="reminderTokenGrid" className="token-grid">
              {reminderTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {metaTokens.length > 0 && (
        <div className="token-section">
          <details open className="token-collapsible">
            <summary className="token-section-header">Meta Tokens</summary>
            <div id="metaTokenGrid" className="token-grid">
              {metaTokens.map((token) => (
                <TokenCard key={token.filename} token={token} onCardClick={onTokenClick} />
              ))}
            </div>
          </details>
        </div>
      )}

      {filteredTokens.length === 0 && (
        <div className="empty-state">
          <p>No tokens match the current filters.</p>
        </div>
      )}
    </div>
  )
}
