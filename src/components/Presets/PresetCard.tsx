import { memo } from 'react'
import type { CustomPreset } from '../../hooks/usePresets'
import type { PresetName } from '../../ts/types/index'
import styles from '../../styles/components/presets/PresetCard.module.css'

interface PresetCardProps {
  icon: string
  name: string
  title: string
  isActive?: boolean
  onApply: () => void
  onMenuToggle: () => void
  menuIsOpen?: boolean
  menuItems?: MenuItemConfig[]
  defaultStar?: boolean
  isAddButton?: boolean
}

interface MenuItemConfig {
  icon: string
  label: string
  description?: string
  onClick: () => void
}

export const PresetCard = memo(
  ({
    icon,
    name,
    title,
    isActive = false,
    onApply,
    onMenuToggle,
    menuIsOpen = false,
    menuItems = [],
    defaultStar = false,
    isAddButton = false,
  }: PresetCardProps) => {
    return (
      <div
        className={`${styles.card} ${isActive ? styles.active : ''} ${isAddButton ? styles.cardAdd : ''}`}
        onClick={onApply}
        title={title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onApply()
          }
        }}
      >
        {defaultStar && <span className={styles.defaultStar}>⭐</span>}
        <span className={styles.icon}>{icon}</span>
        <span className={styles.name}>{name}</span>
        {menuItems.length > 0 && (
          <button
            className={styles.menuTrigger}
            title="Preset options"
            onClick={(e) => {
              e.stopPropagation()
              onMenuToggle()
            }}
          >
            ⋮
          </button>
        )}
        {menuItems.length > 0 && (
          <div className={`${styles.menuDropdown} ${menuIsOpen ? styles.active : ''}`}>
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={styles.menuItem}
                data-tooltip={item.description}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick()
                }}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }
)

PresetCard.displayName = 'PresetCard'
