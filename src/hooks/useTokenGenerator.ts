import { useCallback } from 'react'
import { useTokenContext } from '../contexts/TokenContext'
import { generateAllTokens } from '../ts/tokenGenerator.js'
import type { ProgressCallback } from '../ts/types/index.js'

export function useTokenGenerator() {
  const {
    characters,
    generationOptions,
    scriptMeta,
    setTokens,
    setIsLoading,
    setError,
    setGenerationProgress,
  } = useTokenContext()

  const generateTokens = useCallback(
    async (externalProgressCallback?: ProgressCallback) => {
      if (characters.length === 0) {
        setError('No characters to generate tokens for')
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        setGenerationProgress({ current: 0, total: characters.length })

        const progressCallback: ProgressCallback = (current, total) => {
          setGenerationProgress({ current, total })
          if (externalProgressCallback) {
            externalProgressCallback(current, total)
          }
        }

        const tokens = await generateAllTokens(
          characters,
          generationOptions,
          progressCallback,
          scriptMeta || undefined
        )

        setTokens(tokens)
        setError(null)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate tokens'
        setError(errorMessage)
        console.error('Token generation error:', err)
      } finally {
        setIsLoading(false)
        setGenerationProgress(null)
      }
    },
    [characters, generationOptions, scriptMeta, setTokens, setIsLoading, setError, setGenerationProgress]
  )

  return { generateTokens }
}
