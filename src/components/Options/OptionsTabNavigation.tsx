import { memo } from 'react'
import styles from '../../styles/components/options/OptionsTabNavigation.module.css'

type TabType = 'character' | 'reminder' | 'meta' | 'export'

interface OptionsTabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  hideTabs?: TabType[]
}

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'character', label: 'Character' },
  { id: 'reminder', label: 'Reminder' },
  { id: 'meta', label: 'Meta' },
  { id: 'export', label: 'Export' },
]

export const OptionsTabNavigation = memo(
  ({ activeTab, onTabChange, hideTabs = [] }: OptionsTabNavigationProps) => {
    const visibleTabs = tabs.filter(tab => !hideTabs.includes(tab.id))
    
    return (
      <div className={styles.tabsNav}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )
  }
)

OptionsTabNavigation.displayName = 'OptionsTabNavigation'
