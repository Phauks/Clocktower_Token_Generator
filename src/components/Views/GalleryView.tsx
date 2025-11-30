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

interface GalleryViewProps {
  onTokenClick: (token: Token) => void
}

export function GalleryView({ onTokenClick }: GalleryViewProps) {
  const { generationOptions, updateGenerationOptions, generationProgress, isLoading } = useTokenContext()
  const [activeTab, setActiveTab] = useState<'character' | 'reminder' | 'meta'>('character')
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([])

  return (
    <div className="gallery-view">
      {/* Left Sidebar - Presets and Options */}
      <aside className="gallery-sidebar">
        <div className="panel-content">
          <div className="sidebar-card">
            <h2 className="section-header">Presets</h2>
            <div className="option-section">
              <PresetSection
                customPresets={customPresets}
                onCustomPresetsChange={setCustomPresets}
                onShowSaveModal={() => {}}
              />
            </div>
          </div>

          <div className="sidebar-card">
            <h2 className="section-header">Options</h2>
            <div className="option-section">
              <div className="tabs-container">
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
      <div className="gallery-content">
        <div className="gallery-header">
          {isLoading && generationProgress && (
            <div className="generation-progress">
              Generating {generationProgress.current}/{generationProgress.total}...
            </div>
          )}
        </div>
        <TokenGrid onTokenClick={onTokenClick} />
      </div>
    </div>
  )
}
