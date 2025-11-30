import { useTokenContext } from '../../contexts/TokenContext'

export type AppTab = 'editor' | 'gallery' | 'customize' | 'script' | 'download'
export type TabType = AppTab

interface TabNavigationProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { tokens } = useTokenContext()
  const hasTokens = tokens.length > 0

  const tabs: { id: AppTab; label: string; disabled?: boolean }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'customize', label: 'Customize', disabled: !hasTokens },
    { id: 'script', label: 'Script', disabled: true },
    { id: 'download', label: 'Export', disabled: !hasTokens },
  ]

  return (
    <nav className="tab-navigation" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-navigation-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <span className="tab-label">{tab.label}</span>
          {tab.disabled && tab.id === 'script' && (
            <span className="tab-badge">Soon</span>
          )}
        </button>
      ))}
    </nav>
  )
}
