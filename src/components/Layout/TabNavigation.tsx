import { useTokenContext } from '../../contexts/TokenContext'
import styles from '../../styles/components/layout/TabNavigation.module.css'

export type AppTab = 'editor' | 'gallery' | 'customize' | 'script' | 'download'
export type TabType = AppTab

interface TabNavigationProps {
  activeTab: AppTab
  onTabChange: (tab: AppTab) => void
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const { tokens, jsonInput } = useTokenContext()
  const hasTokens = tokens.length > 0
  const hasScript = jsonInput.trim() !== ''

  const tabs: { id: AppTab; label: string; disabled?: boolean }[] = [
    { id: 'editor', label: 'Editor' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'customize', label: 'Customize' },
    { id: 'script', label: 'Script', disabled: !hasScript },
    { id: 'download', label: 'Export' },
  ]

  return (
    <nav className={styles.tabNavigation} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
          onClick={() => !tab.disabled && onTabChange(tab.id)}
          disabled={tab.disabled}
          aria-selected={activeTab === tab.id}
          role="tab"
        >
          <span className={styles.tabLabel}>{tab.label}</span>
          {tab.disabled && tab.id === 'script' && (
            <span className={styles.tabBadge}>Soon</span>
          )}
        </button>
      ))}
    </nav>
  )
}
