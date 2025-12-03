import { useRef, useEffect, useState, memo } from 'react'
import { downloadTokenPNG } from '../../ts/export/pngExporter.js'
import { useTokenContext } from '../../contexts/TokenContext.js'
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver.js'
import { TEAM_LABELS } from '../../ts/config.js'
import type { Token, Team } from '../../ts/types/index.js'
import styles from '../../styles/components/tokens/TokenCard.module.css'

interface TokenCardProps {
  token: Token
  onCardClick: (token: Token) => void
}

// Map team names to CSS Module class names
const teamClassMap: Record<string, string> = {
  townsfolk: styles.teamTownsfolk,
  outsider: styles.teamOutsider,
  minion: styles.teamMinion,
  demon: styles.teamDemon,
  traveller: styles.teamTraveller,
  traveler: styles.teamTraveller,
  fabled: styles.teamFabled,
  loric: styles.teamLoric,
  meta: styles.teamMeta,
}

/**
 * Custom comparison function for React.memo
 * Only re-render if the token's filename changes (indicates a new/different token)
 * or if the onCardClick handler changes
 */
function arePropsEqual(prevProps: TokenCardProps, nextProps: TokenCardProps): boolean {
  return (
    prevProps.token.filename === nextProps.token.filename &&
    prevProps.onCardClick === nextProps.onCardClick
  )
}

function TokenCardComponent({ token, onCardClick }: TokenCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasRendered, setHasRendered] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const { generationOptions } = useTokenContext()

  // Lazy rendering: only draw canvas when token scrolls into view
  // Uses 200px rootMargin to pre-render tokens before they're visible
  // triggerOnce: true keeps the canvas rendered after scrolling away
  const { ref: containerRef, isVisible } = useIntersectionObserver<HTMLDivElement>({
    rootMargin: '200px',
    threshold: 0.1,
    triggerOnce: true
  })

  useEffect(() => {
    // Only draw canvas when visible and not already rendered
    if (!isVisible || hasRendered) return
    if (!canvasRef.current || !token.canvas) return

    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      // Scale down the canvas for display
      // Reminder tokens are smaller (100x100) since they fit 6 per row
      // Other tokens are 140x140
      const size = token.type === 'reminder' ? 100 : 140
      canvasRef.current.width = size
      canvasRef.current.height = size
      ctx.drawImage(token.canvas, 0, 0, size, size)
      setIsLoading(false)
      setHasRendered(true)
    }
  }, [isVisible, token, hasRendered])

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadTokenPNG(token, generationOptions.pngSettings)
  }

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDownloadMenu(!showDownloadMenu)
  }

  const handleCopyToClipboard = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        token.canvas.toBlob((b) => {
          if (b) resolve(b)
          else reject(new Error('Failed to create blob'))
        }, 'image/png')
      })
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ])
      setShowDownloadMenu(false)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const handleCardClick = () => {
    setShowDownloadMenu(false)
    onCardClick(token)
  }

  // Get team display name for character, reminder, and meta tokens
  const getTeamDisplay = () => {
    if (token.type === 'character' || token.type === 'reminder') {
      const teamKey = token.team.toLowerCase() as Team
      return TEAM_LABELS[teamKey] || token.team
    }
    if (token.type === 'script-name' || token.type === 'almanac' || token.type === 'pandemonium') {
      return 'Meta'
    }
    return null
  }

  const teamDisplay = getTeamDisplay()

  // Get team class for styling
  const getTeamClass = (): string => {
    if (token.type === 'character' || token.type === 'reminder') {
      const teamKey = token.team.toLowerCase()
      return teamClassMap[teamKey] || ''
    }
    if (token.type === 'script-name' || token.type === 'almanac' || token.type === 'pandemonium') {
      return teamClassMap['meta'] || ''
    }
    return ''
  }

  const teamClass = getTeamClass()

  return (
    <div
      ref={containerRef}
      className={styles.card}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick()
        }
      }}
      title={`Click to view details: ${token.name}`}
    >
      <div className={styles.downloadWrapper}>
        <button
          className={styles.downloadBtn}
          onClick={handleDownloadClick}
          title={`Download ${token.filename}.png`}
          aria-label={`Download ${token.name} token`}
        >
          ⬇ <span className={styles.downloadCaret} onClick={handleToggleMenu}>▼</span>
        </button>
        {showDownloadMenu && (
          <div className={styles.downloadMenu}>
            <button onClick={handleDownloadClick}>
              💾 Download PNG
            </button>
            <button onClick={handleCopyToClipboard}>
              📋 Copy to Clipboard
            </button>
          </div>
        )}
      </div>
      <div className={styles.canvasContainer}>
        {/* Show skeleton when not visible, loading text when drawing */}
        {!isVisible && <div className={styles.skeleton} />}
        {isVisible && isLoading && <div className={styles.loading}>Loading...</div>}
        <canvas
          ref={canvasRef}
          className={`${styles.canvas} ${!isVisible ? styles.canvasHidden : ''}`}
          title={token.filename}
        />
      </div>

      <div className={styles.footer}>
        <div className={styles.info}>
          <div className={styles.name}>{token.name}</div>
          <div className={styles.metadata}>
            {teamDisplay && (
              <span className={`${styles.team} ${teamClass}`}>{teamDisplay}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Memoized TokenCard component
 * Prevents re-renders when parent re-renders but token hasn't changed
 */
export const TokenCard = memo(TokenCardComponent, arePropsEqual)
