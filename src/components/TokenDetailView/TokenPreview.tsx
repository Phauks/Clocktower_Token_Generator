import { useRef, useEffect, useState } from 'react'
import type { Token } from '../../ts/types/index.js'

interface TokenPreviewProps {
  characterToken: Token
  reminderTokens: Token[]
  onReminderClick: (token: Token) => void
}

export function TokenPreview({ characterToken, reminderTokens, onReminderClick }: TokenPreviewProps) {
  const charCanvasRef = useRef<HTMLCanvasElement>(null)
  const reminderCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedReminder, setSelectedReminder] = useState<Token | null>(null)

  // Draw character token
  useEffect(() => {
    if (charCanvasRef.current && characterToken.canvas) {
      const ctx = charCanvasRef.current.getContext('2d')
      if (ctx) {
        charCanvasRef.current.width = 300
        charCanvasRef.current.height = 300
        ctx.drawImage(characterToken.canvas, 0, 0, 300, 300)
      }
    }
  }, [characterToken])
  
  // Draw selected reminder token (same size as character token - 300x300)
  useEffect(() => {
    if (reminderCanvasRef.current && selectedReminder?.canvas) {
      const ctx = reminderCanvasRef.current.getContext('2d')
      if (ctx) {
        reminderCanvasRef.current.width = 300
        reminderCanvasRef.current.height = 300
        ctx.drawImage(selectedReminder.canvas, 0, 0, 300, 300)
      }
    }
  }, [selectedReminder])
  
  // Reset selected reminder when character changes
  useEffect(() => {
    setSelectedReminder(null)
  }, [characterToken])
  
  const handleReminderClick = (reminder: Token) => {
    // Toggle: deselect if already selected, otherwise select
    if (selectedReminder?.filename === reminder.filename) {
      setSelectedReminder(null)
    } else {
      setSelectedReminder(reminder)
    }
  }
  
  const handleCloseReminder = () => {
    setSelectedReminder(null)
  }

  return (
    <div className="token-detail-preview-area">
      {/* Character token or selected reminder - in same location */}
      <div className="token-detail-preview">
        {selectedReminder ? (
          <>
            <canvas
              ref={reminderCanvasRef}
              className="token-canvas-large"
              width={300}
              height={300}
              title={selectedReminder.reminderText || selectedReminder.filename}
            />
            <button
              type="button"
              className="token-preview-close"
              onClick={handleCloseReminder}
              aria-label="Close reminder preview"
            >
              ×
            </button>
          </>
        ) : (
          <canvas
            ref={charCanvasRef}
            className="token-canvas-large"
            width={300}
            height={300}
            title={characterToken.filename}
          />
        )}
      </div>

      {/* Reminder tokens gallery below - always show */}
      <div className="token-detail-reminders">
        <h4>Reminder Tokens</h4>
        <div className="reminders-gallery-container">
          <button
            type="button"
            className="gallery-arrow gallery-arrow-left"
            onClick={() => {
              const gallery = document.querySelector('.reminders-gallery')
              if (gallery) gallery.scrollBy({ left: -120, behavior: 'smooth' })
            }}
            disabled={reminderTokens.length === 0}
            aria-label="Scroll left"
          >
            ‹
          </button>
          <div className={`reminders-gallery ${reminderTokens.length > 3 ? 'scrollable' : ''}`}>
            {reminderTokens.length > 0 ? (
              reminderTokens.map((reminder) => (
                <div
                  key={reminder.filename}
                  className={`reminder-token-item ${selectedReminder?.filename === reminder.filename ? 'selected' : ''}`}
                  onClick={() => handleReminderClick(reminder)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleReminderClick(reminder)
                    }
                  }}
                  title={reminder.reminderText || reminder.filename}
                >
                  <canvas
                    width="60"
                    height="60"
                    ref={(canvas) => {
                      if (canvas && reminder.canvas) {
                        const ctx = canvas.getContext('2d')
                        if (ctx) {
                          ctx.drawImage(reminder.canvas, 0, 0, 60, 60)
                        }
                      }
                    }}
                  />
                  <span className="reminder-text">{reminder.reminderText || reminder.filename}</span>
                </div>
              ))
            ) : (
              <div className="reminders-empty">
                <span className="empty-text">No reminder tokens</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="gallery-arrow gallery-arrow-right"
            onClick={() => {
              const gallery = document.querySelector('.reminders-gallery')
              if (gallery) gallery.scrollBy({ left: 120, behavior: 'smooth' })
            }}
            disabled={reminderTokens.length === 0}
            aria-label="Scroll right"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
