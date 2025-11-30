import { TokenGrid } from '../TokenGrid/TokenGrid'
import { ExportBar } from './ExportBar'
import { useTokenContext } from '../../contexts/TokenContext'
import type { Token } from '../../ts/types/index'

interface GeneratedTokensSectionProps {
  onTokenClick: (token: Token) => void
}

export function GeneratedTokensSection({ onTokenClick }: GeneratedTokensSectionProps) {
  const { generationProgress, isLoading } = useTokenContext()

  return (
    <section className="options-card">
      <div className="card-header">
        <h2>Generated Tokens</h2>
        {isLoading && generationProgress && (
          <div className="generation-progress">
            Generating {generationProgress.current}/{generationProgress.total}...
          </div>
        )}
      </div>
      <div className="card-content">
        <ExportBar />
        <TokenGrid onTokenClick={onTokenClick} />
      </div>
    </section>
  )
}
