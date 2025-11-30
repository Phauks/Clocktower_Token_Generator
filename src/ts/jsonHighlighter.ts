/**
 * JSON Syntax Highlighting Utilities
 * Extracted from ScriptInput for reusability
 */

// Token interface for JSON highlighting
export interface HighlightToken {
  type: 'key' | 'string' | 'number' | 'boolean' | 'null' | 'text'
  value: string
}

/**
 * Tokenize JSON string for syntax highlighting
 * @param json - The JSON string to tokenize
 * @returns Array of tokens with type and value
 */
export function tokenizeJSON(json: string): HighlightToken[] {
  if (!json) return []

  const tokens: HighlightToken[] = []
  // Match JSON tokens: strings (with optional colon for keys), booleans, nulls, numbers, and everything else
  const regex = /("(?:\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(json)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: json.slice(lastIndex, match.index) })
    }

    const value = match[0]
    let type: HighlightToken['type'] = 'text'

    if (/^"/.test(value)) {
      type = /:$/.test(value) ? 'key' : 'string'
    } else if (/^(?:true|false)$/.test(value)) {
      type = 'boolean'
    } else if (value === 'null') {
      type = 'null'
    } else if (/^-?\d/.test(value)) {
      type = 'number'
    }

    tokens.push({ type, value })
    lastIndex = regex.lastIndex
  }

  // Add any remaining text
  if (lastIndex < json.length) {
    tokens.push({ type: 'text', value: json.slice(lastIndex) })
  }

  return tokens
}

/**
 * CSS class map for token types
 */
export const TOKEN_CLASS_MAP: Record<HighlightToken['type'], string> = {
  key: 'json-key',
  string: 'json-string',
  number: 'json-number',
  boolean: 'json-boolean',
  null: 'json-null',
  text: '',
}
