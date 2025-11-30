import { ReactNode } from 'react'

interface OptionGroupProps {
  label: string
  description?: string
  helpText?: string
  children: ReactNode
  isSlider?: boolean
}

export function OptionGroup({ label, description, helpText, children, isSlider }: OptionGroupProps) {
  const tooltipText = description || helpText
  
  if (isSlider) {
    return (
      <div className="option-group option-group-slider">
        <div className="option-slider-header">
          <span 
            className="option-label"
            data-tooltip={tooltipText}
          >
            {label}
          </span>
          {children}
        </div>
      </div>
    )
  }
  
  return (
    <div className="option-group">
      <span 
        className="option-label"
        data-tooltip={tooltipText}
      >
        {label}
      </span>
      <div className="option-control">
        {children}
      </div>
    </div>
  )
}
