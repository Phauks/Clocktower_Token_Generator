import { memo, useState } from 'react'
import type { GenerationOptions } from '../../ts/types/index'
import { OptionGroup } from '../Shared/OptionGroup'
import { SliderWithValue } from '../Shared/SliderWithValue'

interface ReminderTabProps {
  generationOptions: GenerationOptions
  onOptionChange: (options: Partial<GenerationOptions>) => void
}

type SubTabType = 'background' | 'text'

export const ReminderTab = memo(({ generationOptions, onOptionChange }: ReminderTabProps) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTabType>('background')

  const handleFontSpacingChange = (type: string, value: number) => {
    const currentSpacing = generationOptions.fontSpacing || {
      characterName: 0,
      abilityText: 0,
      reminderText: 0,
    }
    onOptionChange({
      fontSpacing: {
        ...currentSpacing,
        [type]: value,
      },
    })
  }

  const handleTextShadowChange = (type: string, value: number) => {
    const currentShadow = generationOptions.textShadow || {
      characterName: 4,
      abilityText: 3,
      reminderText: 4,
    }
    onOptionChange({
      textShadow: {
        ...currentShadow,
        [type]: value,
      },
    })
  }

  return (
    <div className="tab-content active" data-tab-content="reminder">
      <div className="subtabs-container">
        <div className="subtabs-nav">
          <button
            className={`subtab-button ${activeSubTab === 'background' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('background')}
          >
            Background
          </button>
          <button
            className={`subtab-button ${activeSubTab === 'text' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('text')}
          >
            Font
          </button>
        </div>

        {/* Background Sub-Tab */}
        {activeSubTab === 'background' && (
          <div className="subtab-content">
            <div className="subsection">
              <OptionGroup label="Background Color" helpText="Background color for reminder tokens">
                <input
                  type="color"
                  className="color-input"
                  value={generationOptions.reminderBackground}
                  onChange={(e) => onOptionChange({ reminderBackground: e.target.value })}
                />
              </OptionGroup>

              <OptionGroup
                label="Background Image"
                helpText="Select reminder background pattern"
              >
                <select
                  className="select-input"
                  value={generationOptions.reminderBackgroundImage || 'character_background_1'}
                  onChange={(e) => onOptionChange({ reminderBackgroundImage: e.target.value })}
                >
                  {Array.from({ length: 7 }, (_, i) => (
                    <option key={i + 1} value={`character_background_${i + 1}`}>
                      Background {i + 1}
                    </option>
                  ))}
                </select>
              </OptionGroup>
            </div>
          </div>
        )}

        {/* Text Sub-Tab */}
        {activeSubTab === 'text' && (
          <div className="subtab-content">
            <div className="subsection">
              <OptionGroup label="Font" helpText="Font for reminder text">
                <select
                  className="select-input"
                  value={generationOptions.characterReminderFont}
                  onChange={(e) => onOptionChange({ characterReminderFont: e.target.value })}
                >
                  <option value="TradeGothic">Trade Gothic</option>
                  <option value="TradeGothicBold">Trade Gothic Bold</option>
                </select>
              </OptionGroup>

              <OptionGroup label="Color" helpText="Text color for reminder text">
                <input
                  type="color"
                  className="color-input"
                  value={generationOptions.reminderTextColor}
                  onChange={(e) => onOptionChange({ reminderTextColor: e.target.value })}
                />
              </OptionGroup>

              <OptionGroup
                label="Font Spacing"
                helpText="Adjust spacing between reminder text characters"
                isSlider
              >
                <SliderWithValue
                  value={generationOptions.fontSpacing?.reminderText || 0}
                  onChange={(value) => handleFontSpacingChange('reminderText', value)}
                  min={0}
                  max={20}
                  defaultValue={0}
                  unit="px"
                  ariaLabel="Reminder Text Font Spacing value"
                />
              </OptionGroup>

              <OptionGroup label="Text Shadow" helpText="Adjust text shadow intensity" isSlider>
                <SliderWithValue
                  value={generationOptions.textShadow?.reminderText || 0}
                  onChange={(value) => handleTextShadowChange('reminderText', value)}
                  min={0}
                  max={20}
                  defaultValue={4}
                  unit="px"
                  ariaLabel="Reminder Text Shadow value"
                />
              </OptionGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

ReminderTab.displayName = 'ReminderTab'
