import { memo } from 'react'
import type { CustomPreset } from '../../hooks/usePresets'
import type { PresetName } from '../../ts/types/index'

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
  }: PresetCardProps) => {
    return (
      <div
        className={`btn-preset ${isActive ? 'active' : ''}`}
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
        {defaultStar && <span className="preset-default-star">⭐</span>}
        <span className="preset-icon">{icon}</span>
        <span className="preset-name">{name}</span>
        {menuItems.length > 0 && (
          <button
            className="preset-menu-trigger"
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
          <div className={`preset-menu-dropdown ${menuIsOpen ? 'active' : ''}`}>
            {menuItems.map((item) => (
              <button
                key={item.label}
                className="menu-item"
                data-tooltip={item.description}
                onClick={(e) => {
                  e.stopPropagation()
                  item.onClick()
                }}
              >
                <span className="menu-icon">{item.icon}</span>
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
