import { TokenGrid } from '../TokenGrid/TokenGrid'
import { ExportBar } from './ExportBar'
import { useTokenContext } from '../../contexts/TokenContext'
import type { Token } from '../../ts/types/index'
import styles from '../../styles/components/generatedTokens/GeneratedTokensSection.module.css'

interface GeneratedTokensSectionProps {
  onTokenClick: (token: Token) => void
}

export function GeneratedTokensSection({ onTokenClick }: GeneratedTokensSectionProps) {
  const { generationProgress, isLoading } = useTokenContext()

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2>Generated Tokens</h2>
        {isLoading && generationProgress && (
          <div className={styles.progress}>
            Generating {generationProgress.current}/{generationProgress.total}...
          </div>
        )}
      </div>
      <div className={styles.content}>
        <ExportBar />
        <TokenGrid onTokenClick={onTokenClick} />
      </div>
    </section>
  )
}
