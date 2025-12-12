import { useState } from 'react'
import { useTokenContext } from '../../contexts/TokenContext'
import { usePresets, type CustomPreset } from '../../hooks/usePresets'
import { ViewLayout } from '../Layout/ViewLayout'
import { PresetSection } from '../Presets/PresetSection'
import { FilterBar } from '../TokenGrid/FilterBar'
import { AppearancePanel } from '../Options/AppearancePanel'
import { OptionsPanel } from '../Options/OptionsPanel'
import { TokenGrid } from '../TokenGrid/TokenGrid'
import { TokenPreviewRow } from '../TokenGrid/TokenPreviewRow'
import type { Token } from '../../ts/types/index'
import type { TabType } from '../Layout/TabNavigation'
import styles from '../../styles/components/views/Views.module.css'
import layoutStyles from '../../styles/components/layout/ViewLayout.module.css'

interface GalleryViewProps {
  onTokenClick: (token: Token) => void
  onTabChange: (tab: TabType) => void
}

export function GalleryView({ onTokenClick, onTabChange }: GalleryViewProps) {
  const { generationOptions, updateGenerationOptions, generationProgress, isLoading } = useTokenContext()
  const { getCustomPresets } = usePresets()
  // Initialize with presets directly to avoid flash of empty state
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>(() => getCustomPresets())

  return (
    <ViewLayout variant="2-panel">
      {/* Left Sidebar - Presets and Options */}
      <ViewLayout.Panel position="left" width="left" scrollable>
        <div className={layoutStyles.panelContent}>
          <details className={layoutStyles.sidebarCard} open>
            <summary className={layoutStyles.sectionHeader}>Presets</summary>
            <div className={layoutStyles.optionSection}>
              <PresetSection
                customPresets={customPresets}
                onCustomPresetsChange={setCustomPresets}
                onShowSaveModal={() => {}}
              />
            </div>
          </details>

          <details className={layoutStyles.sidebarCard}>
            <summary className={layoutStyles.sectionHeader}>Filters</summary>
            <div className={layoutStyles.optionSection}>
              <FilterBar />
            </div>
          </details>

          <details className={layoutStyles.sidebarCard} open>
            <summary className={layoutStyles.sectionHeader}>Appearance</summary>
            <div className={layoutStyles.optionSection}>
              <AppearancePanel
                generationOptions={generationOptions}
                onOptionChange={updateGenerationOptions}
              />
            </div>
          </details>

          <details className={layoutStyles.sidebarCard} open>
            <summary className={layoutStyles.sectionHeader}>Options</summary>
            <div className={layoutStyles.optionSection}>
              <OptionsPanel
                generationOptions={generationOptions}
                onOptionChange={updateGenerationOptions}
              />
            </div>
          </details>
        </div>
      </ViewLayout.Panel>

      {/* Right Content - Token Grid */}
      <ViewLayout.Panel position="right" width="flex" scrollable>
        <TokenPreviewRow />
        <div className={styles.galleryHeader}>
          {isLoading && generationProgress && (
            <div className={styles.generationProgress}>
              Generating {generationProgress.current}/{generationProgress.total}...
            </div>
          )}
        </div>
        <TokenGrid onTokenClick={onTokenClick} onTabChange={onTabChange} />
      </ViewLayout.Panel>
    </ViewLayout>
  )
}
