import { useState } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import type { CustomPreset } from '../../hooks/usePresets'
import { PresetSection } from '../Presets/PresetSection'
import { OptionsTabNavigation } from '../Options/OptionsTabNavigation'
import { CharacterTab } from '../Options/CharacterTab'
import { ReminderTab } from '../Options/ReminderTab'
import { MetaTab } from '../Options/MetaTab'
import { TokenGrid } from '../TokenGrid/TokenGrid'
import type { Token } from '../../ts/types/index'
import styles from '../../styles/components/views/Views.module.css'

interface GalleryViewProps {
  onTokenClick: (token: Token) => void
}

export function GalleryView({ onTokenClick }: GalleryViewProps) {
  const { generationOptions, updateGenerationOptions, generationProgress, isLoading } = useTokenContext()
  const [activeTab, setActiveTab] = useState<'character' | 'reminder' | 'meta'>('character')
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])

  return (
    <div className={styles.galleryView}>
      {/* Left Sidebar - Presets and Options */}
      <aside className={styles.gallerySidebar}>
        <div className={styles.panelContent}>
          <div className={styles.sidebarCard}>
            <h2 className={styles.sectionHeader}>Presets</h2>
            <div className={styles.optionSection}>
              <PresetSection
                customPresets={customPresets}
                onCustomPresetsChange={setCustomPresets}
                onShowSaveModal={() => {}}
              />
            </div>
          </div>

          <div className={styles.sidebarCard}>
            <h2 className={styles.sectionHeader}>Options</h2>
            <div className={styles.optionSection}>
              <div className={styles.tabsContainer}>
                <OptionsTabNavigation 
                  activeTab={activeTab} 
                  onTabChange={(tab) => {
                    if (tab !== 'export') {
                      setActiveTab(tab as 'character' | 'reminder' | 'meta')
                    }
                  }}
                  hideTabs={['export']}
                />

                {activeTab === 'character' && (
                  <CharacterTab
                    generationOptions={generationOptions}
                    onOptionChange={updateGenerationOptions}
                  />
                )}
                {activeTab === 'reminder' && (
                  <ReminderTab
                    generationOptions={generationOptions}
                    onOptionChange={updateGenerationOptions}
                  />
                )}
                {activeTab === 'meta' && (
                  <MetaTab
                    generationOptions={generationOptions}
                    onOptionChange={updateGenerationOptions}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Content - Token Grid */}
      <div className={styles.galleryContent}>
        <div className={styles.galleryHeader}>
          {isLoading && generationProgress && (
            <div className={styles.generationProgress}>
              Generating {generationProgress.current}/{generationProgress.total}...
            </div>
          )}
        </div>
        <TokenGrid onTokenClick={onTokenClick} />
      </div>
    </div>
  )
}
