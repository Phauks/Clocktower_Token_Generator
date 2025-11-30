import { useTokenContext } from '../../contexts/TokenContext'
import { calculateTokenCounts } from '../../ts/dataLoader'
import { TEAM_LABELS } from '../../ts/config'
import type { Team } from '../../ts/types/index'

export function TokenStats() {
  const { characters, tokens } = useTokenContext()

  // Don't show stats if no characters
  if (characters.length === 0) {
    return null
  }

  const counts = calculateTokenCounts(characters)

  // Count meta tokens from the actual generated tokens
  const metaTokenCount = tokens.filter(
    (t) => t.type === 'script-name' || t.type === 'almanac' || t.type === 'pandemonium'
  ).length

  return (
    <div className="token-counts">
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.townsfolk}:</span>
        <span className="count-value">{counts.townsfolk.characters} / {counts.townsfolk.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.outsider}:</span>
        <span className="count-value">{counts.outsider.characters} / {counts.outsider.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.minion}:</span>
        <span className="count-value">{counts.minion.characters} / {counts.minion.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.demon}:</span>
        <span className="count-value">{counts.demon.characters} / {counts.demon.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.traveller}:</span>
        <span className="count-value">{counts.traveller.characters} / {counts.traveller.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.fabled}:</span>
        <span className="count-value">{counts.fabled.characters} / {counts.fabled.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.loric}:</span>
        <span className="count-value">{counts.loric.characters} / {counts.loric.reminders}</span>
      </div>
      <div className="count-item">
        <span className="count-label">{TEAM_LABELS.meta}:</span>
        <span className="count-value">{metaTokenCount} / 0</span>
      </div>
      <div className="count-item total">
        <span className="count-label">Total:</span>
        <span className="count-value">{counts.total.characters + metaTokenCount} / {counts.total.reminders}</span>
      </div>
    </div>
  )
}
