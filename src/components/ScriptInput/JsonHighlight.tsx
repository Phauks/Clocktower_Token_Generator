import { memo } from 'react'
import { tokenizeJSON, TOKEN_CLASS_MAP } from '../../ts/jsonHighlighter'

interface JsonHighlightProps {
  json: string
}

/**
 * Renders JSON with syntax highlighting
 * Memoized to avoid re-rendering on every keystroke when content hasn't changed
 */
export const JsonHighlight = memo(({ json }: JsonHighlightProps) => {
  if (!json) return null

  const tokens = tokenizeJSON(json)

  return (
    <>
      {tokens.map((token, index) => {
        const className = TOKEN_CLASS_MAP[token.type]
        return className ? (
          <span key={index} className={className}>
            {token.value}
          </span>
        ) : (
          <span key={index}>{token.value}</span>
        )
      })}
    </>
  )
})

JsonHighlight.displayName = 'JsonHighlight'
