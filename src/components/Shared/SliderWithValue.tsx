interface SliderWithValueProps {
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  ariaLabel?: string
  defaultValue?: number
  unit?: string
}

export function SliderWithValue({
  value,
  onChange,
  min,
  max,
  step = 1,
  ariaLabel,
  defaultValue,
  unit = '',
}: SliderWithValueProps) {
  const handleDoubleClick = () => {
    if (defaultValue !== undefined) {
      onChange(defaultValue)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value.replace(/[^0-9-]/g, '')
    const numValue = parseInt(inputValue) || 0
    const clampedValue = Math.max(min, Math.min(max, numValue))
    onChange(clampedValue)
  }

  // Calculate tick positions for visual markers
  const tickCount = Math.min(5, Math.floor((max - min) / step) + 1)
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const tickValue = min + (i * (max - min)) / (tickCount - 1)
    return Math.round(tickValue)
  })

  return (
    <div className="slider-control">
      <div className="slider-input-row">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9-]*"
          className="slider-value-input"
          value={value}
          onChange={handleInputChange}
          onDoubleClick={handleDoubleClick}
          maxLength={4}
          aria-label={ariaLabel}
          title={defaultValue !== undefined ? `Double-click to reset to ${defaultValue}` : undefined}
        />
        {unit && <span className="slider-unit">{unit}</span>}
      </div>
      <div className="slider-track-container">
        <input
          type="range"
          className="slider-range"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          onDoubleClick={handleDoubleClick}
          min={min}
          max={max}
          step={step}
          title={defaultValue !== undefined ? `Double-click to reset to ${defaultValue}` : undefined}
        />
        <div className="slider-ticks">
          {ticks.map((tick, index) => (
            <span key={index} className="slider-tick" />
          ))}
        </div>
      </div>
    </div>
  )
}
