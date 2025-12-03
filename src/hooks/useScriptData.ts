import { useCallback } from 'react'
import { useTokenContext } from '../contexts/TokenContext'
import { fetchOfficialData, loadExampleScript } from '../ts/data/dataLoader.js'
import { validateAndParseScript, extractScriptMeta } from '../ts/data/scriptParser.js'
import { validateJson } from '../ts/utils/index.js'

export function useScriptData() {
  const {
    setJsonInput,
    setCharacters,
    setOfficialData,
    setScriptMeta,
    setError,
    setIsLoading,
    setWarnings,
    officialData,
  } = useTokenContext()

  const loadScript = useCallback(
    async (jsonString: string) => {
      try {
        setIsLoading(true)
        setError(null)
        setWarnings([])

        // Validate JSON syntax
        const validation = validateJson(jsonString)
        if (!validation.valid) {
          setError(validation.error || 'Invalid JSON')
          return
        }

        // Parse the script data with lenient validation
        const parsed = JSON.parse(jsonString)
        const { characters: scriptChars, warnings } = validateAndParseScript(parsed, officialData)

        // Extract metadata if present
        const meta = extractScriptMeta(parsed)

        // Update state
        setJsonInput(jsonString)
        setCharacters(scriptChars)
        setScriptMeta(meta)
        setWarnings(warnings)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load script'
        setError(errorMessage)
        console.error('Script loading error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [setJsonInput, setCharacters, setScriptMeta, setError, setIsLoading, setWarnings, officialData]
  )

  const loadExampleScriptByName = useCallback(
    async (name: string) => {
      try {
        setIsLoading(true)
        setError(null)

        const scriptJson = await loadExampleScript(name)
        await loadScript(JSON.stringify(scriptJson, null, 2))
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load example script'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [loadScript, setIsLoading, setError]
  )

  const loadOfficialData = useCallback(async () => {
    try {
      const official = await fetchOfficialData()
      setOfficialData(official)
      return official
    } catch (err) {
      console.error('Failed to fetch official data:', err)
      return []
    }
  }, [setOfficialData])

  /**
   * Parse JSON string and update characters/warnings without setting jsonInput
   * Used for live editing - jsonInput is already set by the textarea
   */
  const parseJson = useCallback(
    (jsonString: string) => {
      // Handle empty input
      if (!jsonString.trim()) {
        setCharacters([])
        setScriptMeta(null)
        setWarnings([])
        setError(null)
        return
      }

      // Validate JSON syntax
      const validation = validateJson(jsonString)
      if (!validation.valid) {
        setError(validation.error || 'Invalid JSON')
        return
      }

      try {
        // Parse the script data with lenient validation
        const parsed = JSON.parse(jsonString)
        const { characters: scriptChars, warnings } = validateAndParseScript(parsed, officialData)

        // Extract metadata if present
        const meta = extractScriptMeta(parsed)

        // Update state (but not jsonInput - it's already set)
        setCharacters(scriptChars)
        setScriptMeta(meta)
        setWarnings(warnings)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to parse script'
        setError(errorMessage)
      }
    },
    [setCharacters, setScriptMeta, setError, setWarnings, officialData]
  )

  /**
   * Clear all script data
   */
  const clearScript = useCallback(() => {
    setJsonInput('')
    setCharacters([])
    setScriptMeta(null)
    setWarnings([])
    setError(null)
  }, [setJsonInput, setCharacters, setScriptMeta, setWarnings, setError])

  return {
    loadScript,
    loadExampleScriptByName,
    loadOfficialData,
    parseJson,
    clearScript,
  }
}
