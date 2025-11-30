import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import type {
  Token,
  Character,
  GenerationOptions,
  ScriptMeta,
} from '../ts/types/index.js'

interface TokenContextType {
  // Token state
  tokens: Token[]
  setTokens: (tokens: Token[]) => void

  filteredTokens: Token[]
  setFilteredTokens: (tokens: Token[]) => void

  // Character state
  characters: Character[]
  setCharacters: (characters: Character[]) => void

  officialData: Character[]
  setOfficialData: (data: Character[]) => void

  // Script metadata
  scriptMeta: ScriptMeta | null
  setScriptMeta: (meta: ScriptMeta | null) => void

  // Generation options
  generationOptions: GenerationOptions
  updateGenerationOptions: (options: Partial<GenerationOptions>) => void

  // JSON input
  jsonInput: string
  setJsonInput: (json: string) => void

  // Filter state
  filters: {
    team: string
    tokenType: string
    display: string
    reminders: string
  }
  updateFilters: (filters: Partial<TokenContextType['filters']>) => void

  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  error: string | null
  setError: (error: string | null) => void

  // Validation warnings
  warnings: string[]
  setWarnings: (warnings: string[]) => void

  // Generation progress
  generationProgress: { current: number; total: number } | null
  setGenerationProgress: (progress: { current: number; total: number } | null) => void
}

const TokenContext = createContext<TokenContextType | undefined>(undefined)

interface TokenProviderProps {
  children: ReactNode
}

export function TokenProvider({ children }: TokenProviderProps) {
  const [tokens, setTokens] = useState<Token[]>([])
  const [filteredTokens, setFilteredTokens] = useState<Token[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [officialData, setOfficialData] = useState<Character[]>([])
  const [scriptMeta, setScriptMeta] = useState<ScriptMeta | null>(null)
  const [jsonInput, setJsonInput] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null)

  const [generationOptions, setGenerationOptions] = useState<GenerationOptions>({
    displayAbilityText: false,
    tokenCount: false,
    setupFlowerStyle: 'setup_flower_1',
    reminderBackground: '#FFFFFF',
    reminderBackgroundImage: 'character_background_1',
    characterBackground: 'character_background_1',
    characterBackgroundColor: '#FFFFFF',
    metaBackground: 'character_background_1',
    characterNameFont: 'Dumbledor',
    characterNameColor: '#000000',
    characterReminderFont: 'TradeGothic',
    abilityTextFont: 'TradeGothic',
    abilityTextColor: '#000000',
    reminderTextColor: '#FFFFFF',
    leafGeneration: 'classic',
    maximumLeaves: 0,
    leafPopulationProbability: 30,
    leafArcSpan: 120,
    leafSlots: 7,
    dpi: 300,
    fontSpacing: {
      characterName: 0,
      abilityText: 0,
      reminderText: 0,
    },
    textShadow: {
      characterName: 4,
      abilityText: 3,
      reminderText: 4,
    },
    pandemoniumToken: true,
    scriptNameToken: true,
    almanacToken: true,
    pngSettings: {
      embedMetadata: false,
      transparentBackground: false,
    },
    zipSettings: {
      saveInTeamFolders: true,
      saveRemindersSeparately: true,
      metaTokenFolder: true,
      includeScriptJson: false,
      compressionLevel: 'normal',
    },
  })

  const [filters, setFilters] = useState({
    team: 'all',
    tokenType: 'all',
    display: 'all',
    reminders: 'all',
  })

  const updateGenerationOptions = useCallback((options: Partial<GenerationOptions>) => {
    setGenerationOptions((prev) => ({ ...prev, ...options }))
  }, [])

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const value: TokenContextType = {
    tokens,
    setTokens,
    filteredTokens,
    setFilteredTokens,
    characters,
    setCharacters,
    officialData,
    setOfficialData,
    scriptMeta,
    setScriptMeta,
    generationOptions,
    updateGenerationOptions,
    jsonInput,
    setJsonInput,
    filters,
    updateFilters,
    isLoading,
    setIsLoading,
    error,
    setError,
    warnings,
    setWarnings,
    generationProgress,
    setGenerationProgress,
  }

  return (
    <TokenContext.Provider value={value}>
      {children}
    </TokenContext.Provider>
  )
}

export function useTokenContext() {
  const context = useContext(TokenContext)
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider')
  }
  return context
}
