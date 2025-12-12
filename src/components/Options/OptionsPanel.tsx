import { memo, useState } from 'react'
import type { GenerationOptions } from '../../ts/types/index'
import { AssetPreviewSelector } from '../Shared/AssetPreviewSelector'
import { OptionGroup } from '../Shared/OptionGroup'
import { SliderWithValue } from '../Shared/SliderWithValue'
import styles from '../../styles/components/options/OptionsPanel.module.css'
import viewStyles from '../../styles/components/views/Views.module.css'

interface OptionsPanelProps {
  generationOptions: GenerationOptions
  onOptionChange: (options: Partial<GenerationOptions>) => void
  projectId?: string
}

type OptionTab = 'character' | 'reminder' | 'meta'
type CharacterSubTab = 'setup' | 'accent' | 'abilityText' | 'qol'

export const OptionsPanel = memo(({ generationOptions, onOptionChange, projectId }: OptionsPanelProps) => {
  const [activeTab, setActiveTab] = useState<OptionTab>('character')
  const [activeCharacterSubTab, setActiveCharacterSubTab] = useState<CharacterSubTab>('setup')

  const handleFontSpacingChange = (type: string, value: number): void => {
    const currentSpacing = generationOptions.fontSpacing || {
      characterName: 0,
      abilityText: 0,
      reminderText: 0,
      metaText: 0,
    }
    onOptionChange({
      fontSpacing: {
        ...currentSpacing,
        [type]: value,
      },
    })
  }

  const handleTextShadowChange = (type: string, value: number): void => {
    const currentShadow = generationOptions.textShadow || {
      characterName: 4,
      abilityText: 3,
      reminderText: 3,
      metaText: 4,
    }
    onOptionChange({
      textShadow: {
        ...currentShadow,
        [type]: value,
      },
    })
  }

  return (
    <div className={styles.panelContent}>
      <div className={styles.tabsNav}>
        <button
          className={`${styles.tabButton} ${activeTab === 'character' ? styles.active : ''}`}
          onClick={() => setActiveTab('character')}
        >
          Character
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'reminder' ? styles.active : ''}`}
          onClick={() => setActiveTab('reminder')}
        >
          Reminder
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'meta' ? styles.active : ''}`}
          onClick={() => setActiveTab('meta')}
        >
          Meta
        </button>
      </div>

      {activeTab === 'character' && (
        <div className={styles.tabContent}>
          <div className={styles.subTabsNav}>
            <button
              className={`${styles.subTabButton} ${activeCharacterSubTab === 'setup' ? styles.active : ''}`}
              onClick={() => setActiveCharacterSubTab('setup')}
            >
              Setup
            </button>
            <button
              className={`${styles.subTabButton} ${activeCharacterSubTab === 'accent' ? styles.active : ''}`}
              onClick={() => setActiveCharacterSubTab('accent')}
            >
              Accent
            </button>
            <button
              className={`${styles.subTabButton} ${activeCharacterSubTab === 'abilityText' ? styles.active : ''}`}
              onClick={() => setActiveCharacterSubTab('abilityText')}
            >
              Ability
            </button>
            <button
              className={`${styles.subTabButton} ${activeCharacterSubTab === 'qol' ? styles.active : ''}`}
              onClick={() => setActiveCharacterSubTab('qol')}
            >
              QoL
            </button>
          </div>

          {/* Setup Tab - Setup Flower only */}
          {activeCharacterSubTab === 'setup' && (
            <div className={styles.sectionContent}>
              <AssetPreviewSelector
                value={generationOptions.setupFlowerStyle || 'setup_flower_1'}
                onChange={(value) => onOptionChange({ setupFlowerStyle: value })}
                assetType="setup-flower"
                shape="square"
                showNone={true}
                noneLabel="No flower"
                projectId={projectId}
                generationOptions={generationOptions}
              />
            </div>
          )}

          {/* Accent Tab - Leaf controls */}
          {activeCharacterSubTab === 'accent' && (
            <div className={styles.sectionContent}>
              {/* Leaf Style selector */}
              <AssetPreviewSelector
                value={generationOptions.leafGeneration || 'classic'}
                onChange={(value) => onOptionChange({ leafGeneration: value })}
                assetType="leaf"
                shape="square"
                showNone={false}
                projectId={projectId}
                generationOptions={generationOptions}
              />

              {/* Maximum Leaves - below leaf selection */}
              <OptionGroup
                label="Maximum Leaves"
                description="Maximum number of leaves to generate (0 = disabled)"
                isSlider
              >
                <SliderWithValue
                  value={Math.min(generationOptions.maximumLeaves ?? 0, (generationOptions.leafSlots || 7) + 2)}
                  onChange={(value) => onOptionChange({ maximumLeaves: value })}
                  min={0}
                  max={(generationOptions.leafSlots || 7) + 2}
                  defaultValue={0}
                  ariaLabel="Maximum Leaves value"
                />
              </OptionGroup>

              <OptionGroup
                label="Leaf Probability"
                description="Chance of each position spawning a leaf"
                isSlider
              >
                <SliderWithValue
                  value={generationOptions.leafPopulationProbability || 30}
                  onChange={(value) => onOptionChange({ leafPopulationProbability: value })}
                  min={0}
                  max={100}
                  defaultValue={30}
                  unit="%"
                  ariaLabel="Leaf Probability value"
                />
              </OptionGroup>

              <OptionGroup
                label="Arc Span"
                description="Width of the arc for leaves in degrees"
                isSlider
              >
                <SliderWithValue
                  value={generationOptions.leafArcSpan || 120}
                  onChange={(value) => onOptionChange({ leafArcSpan: value })}
                  min={30}
                  max={180}
                  defaultValue={120}
                  unit="°"
                  ariaLabel="Arc Span value"
                />
              </OptionGroup>

              <OptionGroup
                label="Arc Slots"
                description="Number of leaf positions along the arc"
                isSlider
              >
                <SliderWithValue
                  value={generationOptions.leafSlots || 7}
                  onChange={(value) => onOptionChange({ leafSlots: value })}
                  min={3}
                  max={15}
                  defaultValue={7}
                  ariaLabel="Arc Slots value"
                />
              </OptionGroup>
            </div>
          )}

          {activeCharacterSubTab === 'abilityText' && (
            <div className={styles.sectionContent}>
              <OptionGroup label="Show Ability Text" description="Display ability text on character token">
                <input
                  type="checkbox"
                  className={viewStyles.toggleSwitch}
                  checked={generationOptions.displayAbilityText !== false}
                  onChange={(e) => onOptionChange({ displayAbilityText: e.target.checked })}
                />
              </OptionGroup>

              <OptionGroup label="Font">
                <select
                  className={styles.selectInput}
                  value={generationOptions.abilityTextFont}
                  onChange={(e) => onOptionChange({ abilityTextFont: e.target.value })}
                >
                  <option value="TradeGothic">Trade Gothic</option>
                  <option value="TradeGothicBold">Trade Gothic Bold</option>
                </select>
              </OptionGroup>

              <OptionGroup label="Color">
                <input
                  type="color"
                  className={styles.colorInput}
                  value={generationOptions.abilityTextColor}
                  onChange={(e) => onOptionChange({ abilityTextColor: e.target.value })}
                />
              </OptionGroup>

              <OptionGroup label="Spacing" isSlider>
                <SliderWithValue
                  value={generationOptions.fontSpacing?.abilityText || 0}
                  onChange={(value) => handleFontSpacingChange('abilityText', value)}
                  min={0}
                  max={20}
                  defaultValue={0}
                  unit="px"
                  ariaLabel="Ability Text Font Spacing"
                />
              </OptionGroup>

              <OptionGroup label="Shadow" isSlider>
                <SliderWithValue
                  value={generationOptions.textShadow?.abilityText || 0}
                  onChange={(value) => handleTextShadowChange('abilityText', value)}
                  min={0}
                  max={20}
                  defaultValue={3}
                  unit="px"
                  ariaLabel="Ability Text Shadow"
                />
              </OptionGroup>
            </div>
          )}

          {activeCharacterSubTab === 'qol' && (
            <div className={styles.sectionContent}>
            <OptionGroup label="Reminder Count" description="Show number of reminder tokens on character">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.tokenCount !== false}
                onChange={(e) => onOptionChange({ tokenCount: e.target.checked })}
              />
            </OptionGroup>

            <OptionGroup label="Generate Variants" description="Generate tokens for characters with multiple images">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.generateImageVariants || false}
                onChange={(e) => onOptionChange({ generateImageVariants: e.target.checked })}
              />
            </OptionGroup>

            <OptionGroup label="Custom Bootlegger Rules" description="Show custom bootlegger rules from script on tokens">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.generateBootleggerRules !== false}
                onChange={(e) => onOptionChange({ generateBootleggerRules: e.target.checked })}
                disabled
              />
            </OptionGroup>
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminder' && (
        <div className={styles.tabContent}>
          <div className={styles.subTabsNav}>
            <button
              className={`${styles.subTabButton} ${styles.active}`}
            >
              QoL
            </button>
          </div>

          <div className={styles.sectionContent}>
            <OptionGroup label="Generate Variants" description="Generate reminder tokens for characters with multiple images">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.generateReminderVariants || false}
                onChange={(e) => onOptionChange({ generateReminderVariants: e.target.checked })}
              />
            </OptionGroup>
          </div>
        </div>
      )}

      {activeTab === 'meta' && (
        <div className={styles.tabContent}>
          <div className={styles.subTabsNav}>
            <button
              className={`${styles.subTabButton} ${styles.active}`}
            >
              Additional Tokens
            </button>
          </div>

          <div className={styles.sectionContent}>
            <OptionGroup label="Pandemonium" description="Include Pandemonium Institute token">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.pandemoniumToken !== false}
                onChange={(e) => onOptionChange({ pandemoniumToken: e.target.checked })}
              />
            </OptionGroup>

            <OptionGroup label="Script Name" description="Include Script Name token">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.scriptNameToken !== false}
                onChange={(e) => onOptionChange({ scriptNameToken: e.target.checked })}
              />
            </OptionGroup>

            {generationOptions.scriptNameToken !== false && (
              <OptionGroup label="Generate Author Name" description="Show author name on Script Name token">
                <input
                  type="checkbox"
                  className={viewStyles.toggleSwitch}
                  checked={!(generationOptions.hideScriptNameAuthor ?? false)}
                  onChange={(e) => onOptionChange({ hideScriptNameAuthor: !e.target.checked })}
                />
              </OptionGroup>
            )}

            <OptionGroup label="Almanac" description="Include Almanac link token">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                checked={generationOptions.almanacToken !== false}
                onChange={(e) => onOptionChange({ almanacToken: e.target.checked })}
              />
            </OptionGroup>

            <OptionGroup label="Tool Token" description="To Be Implemented">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                disabled
              />
            </OptionGroup>

            <OptionGroup label="Shareable Script" description="To Be Implemented">
              <input
                type="checkbox"
                className={viewStyles.toggleSwitch}
                disabled
              />
            </OptionGroup>
          </div>
        </div>
      )}
    </div>
  )
})

OptionsPanel.displayName = 'OptionsPanel'
