import { useRef, useEffect, useState } from 'react'
import type { Token } from '../../ts/types/index.js'
import styles from '../../styles/components/tokenDetail/TokenPreview.module.css'

interface TokenPreviewProps {
  characterToken: Token
  reminderTokens: Token[]
  onReminderClick: (token: Token) => void
}

export function TokenPreview({ characterToken, reminderTokens, onReminderClick }: TokenPreviewProps) {
  const charCanvasRef = useRef<HTMLCanvasElement>(null)
  const reminderCanvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedReminder, setSelectedReminder] = useState<Token | null>(null)

  // Draw character token when visible (not when reminder is selected)
  useEffect(() => {
    if (charCanvasRef.current && characterToken.canvas && !selectedReminder) {
      const ctx = charCanvasRef.current.getContext('2d')
      if (ctx) {
        charCanvasRef.current.width = 300
        charCanvasRef.current.height = 300
        ctx.drawImage(characterToken.canvas, 0, 0, 300, 300)
      }
    }
  }, [characterToken, selectedReminder])
  
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
    <div className={styles.previewArea}>
      {/* Character token or selected reminder - in same location */}
      <div className={styles.preview}>
        {selectedReminder ? (
          <>
            <canvas
              ref={reminderCanvasRef}
              className={styles.canvasLarge}
              width={300}
              height={300}
              title={selectedReminder.reminderText || selectedReminder.filename}
            />
            <button
              type="button"
              className={styles.closeBtn}
              onClick={handleCloseReminder}
              aria-label="Close reminder preview"
            >
              ×
            </button>
          </>
        ) : (
          <canvas
            ref={charCanvasRef}
            className={styles.canvasLarge}
            width={300}
            height={300}
            title={characterToken.filename}
          />
        )}
      </div>

      {/* Reminder tokens gallery below - always show */}
      <div className={styles.reminders}>
        <h4>Reminder Tokens</h4>
        <div className={styles.galleryContainer}>
          <button
            type="button"
            className={styles.galleryArrow}
            onClick={() => {
              const gallery = document.querySelector(`.${styles.gallery}`)
              if (gallery) gallery.scrollBy({ left: -120, behavior: 'smooth' })
            }}
            disabled={reminderTokens.length === 0}
            aria-label="Scroll left"
          >
            ‹
          </button>
          <div className={`${styles.gallery} ${reminderTokens.length > 3 ? styles.scrollable : ''}`}>
            {reminderTokens.length > 0 ? (
              reminderTokens.map((reminder) => (
                <div
                  key={reminder.filename}
                  className={`${styles.reminderItem} ${selectedReminder?.filename === reminder.filename ? styles.selected : ''}`}
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
                  <span className={styles.reminderText}>{reminder.reminderText || reminder.filename}</span>
                </div>
              ))
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyText}>No reminder tokens</span>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.galleryArrow}
            onClick={() => {
              const gallery = document.querySelector(`.${styles.gallery}`)
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
