import { useRef, useEffect, useState } from 'react'
import { downloadTokenPNG } from '../../ts/pdfGenerator.js'
import { useTokenContext } from '../../contexts/TokenContext.js'
import { TEAM_LABELS } from '../../ts/config.js'
import type { Token, Team } from '../../ts/types/index.js'

interface TokenCardProps {
  token: Token
  onCardClick: (token: Token) => void
}

export function TokenCard({ token, onCardClick }: TokenCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { generationOptions } = useTokenContext()

  useEffect(() => {
    if (canvasRef.current && token.canvas) {
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
      }
    }
  }, [token])

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    downloadTokenPNG(token, generationOptions.pngSettings)
  }

  const handleCardClick = () => {
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
  const getTeamClass = () => {
    if (token.type === 'character' || token.type === 'reminder') {
      return token.team.toLowerCase()
    }
    if (token.type === 'script-name' || token.type === 'almanac' || token.type === 'pandemonium') {
      return 'meta'
    }
    return ''
  }

  const teamClass = getTeamClass()

  return (
    <div
      className="token-card"
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
      <div className="token-canvas-container">
        {isLoading && <div className="token-loading">Loading...</div>}
        <canvas
          ref={canvasRef}
          className="token-canvas-display"
          title={token.filename}
        />
      </div>

      <div className="token-card-footer">
        <div className="token-info">
          <div className="token-name">{token.name}</div>
          <div className="token-metadata">
            {teamDisplay && (
              <span className={`token-team ${teamClass}`}>{teamDisplay}</span>
            )}
          </div>
        </div>
        <button
          className="btn-icon download-btn"
          onClick={handleDownloadClick}
          title={`Download ${token.filename}.png`}
          aria-label={`Download ${token.name} token`}
        >
          PNG
        </button>
      </div>
    </div>
  )
}
