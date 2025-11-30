/**
 * Blood on the Clocktower Token Generator
 * Data Loader - JSON parsing and character data fetching
 */

import CONFIG from './config.js';
import type {
    Character,
    ScriptEntry,
    ScriptMeta,
    Team,
    TokenCounts,
    TeamCounts,
    CharacterValidationResult
} from './types/index.js';

/**
 * Cache for official character data
 */
let officialDataCache: Character[] | null = null;

/**
 * Validate JSON string
 * @param jsonString - JSON string to validate
 * @returns Validation result with isValid flag and optional error message
 */
export function validateJson(jsonString: string): { isValid: boolean; error?: string } {
    if (!jsonString || !jsonString.trim()) {
        return { isValid: false, error: 'JSON is empty' };
    }

    try {
        JSON.parse(jsonString);
        return { isValid: true };
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Invalid JSON format';
        return { isValid: false, error: message };
    }
}

/**
 * Fetch official Blood on the Clocktower character data
 * @returns Array of character objects
 */
export async function fetchOfficialData(): Promise<Character[]> {
    if (officialDataCache) {
        return officialDataCache;
    }

    try {
        const response = await fetch(CONFIG.API.BOTC_DATA);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        officialDataCache = await response.json() as Character[];
        return officialDataCache;
    } catch (error) {
        console.warn('Failed to fetch official data, continuing with script data only:', error);
        return [];
    }
}

/**
 * Load example script from file
 * @param filename - Example script filename (with or without .json extension)
 * @returns Parsed script data
 */
export async function loadExampleScript(filename: string): Promise<ScriptEntry[]> {
    console.log(`[loadExampleScript] Loading example script: ${filename}`);

    // Ensure filename has .json extension
    const jsonFilename = filename.endsWith('.json') ? filename : `${filename}.json`;

    // Try multiple path variations for compatibility with different deployment scenarios
    const basePath = new URL('.', window.location.href).href;
    const pathsToTry = [
        `/example_scripts/${jsonFilename}`,
        `./example_scripts/${jsonFilename}`,
        `example_scripts/${jsonFilename}`,
        new URL(`example_scripts/${jsonFilename}`, basePath).href
    ];

    let lastError: Error | null = null;

    for (const path of pathsToTry) {
        try {
            console.log(`[loadExampleScript] Trying path: ${path}`);
            const response = await fetch(path);
            if (response.ok) {
                const data = await response.json() as ScriptEntry[];
                console.log(`[loadExampleScript] Successfully loaded from: ${path}`, data);
                return data;
            }
            console.log(`[loadExampleScript] Path returned status: ${response.status}`);
        } catch (error) {
            console.log(`[loadExampleScript] Path failed: ${path}`, error);
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    const errorMessage = `Failed to load example script: ${filename}. ${lastError?.message ?? 'Unknown error'}`;
    console.error('[loadExampleScript]', errorMessage);
    throw new Error(errorMessage);
}

/**
 * Type guard for checking if entry is a ScriptMeta
 */
function isScriptMeta(entry: ScriptEntry): entry is ScriptMeta {
    return typeof entry === 'object' && entry !== null && 'id' in entry && entry.id === '_meta';
}

/**
 * Type guard for checking if entry is a Character
 */
function isCharacter(entry: ScriptEntry): entry is Character {
    return typeof entry === 'object' && entry !== null && 'name' in entry;
}

/**
 * Type guard for checking if entry is an ID reference object
 */
function isIdReference(entry: ScriptEntry): entry is { id: string } {
    return typeof entry === 'object' && entry !== null && 'id' in entry && Object.keys(entry).length === 1;
}

/**
 * Parse script JSON and merge with official data where needed
 * @param scriptData - Raw script data array
 * @param officialData - Official character data
 * @returns Merged character data
 */
export function parseScriptData(scriptData: ScriptEntry[], officialData: Character[] = []): Character[] {
    if (!Array.isArray(scriptData)) {
        throw new Error('Script data must be an array');
    }

    // Create a map of official characters by ID for quick lookup
    const officialMap = new Map<string, Character>();
    if (Array.isArray(officialData)) {
        officialData.forEach(char => {
            if (char && char.id) {
                officialMap.set(char.id.toLowerCase(), char);
            }
        });
    }

    // Process script entries
    const characters: Character[] = [];

    for (const entry of scriptData) {
        // Skip meta entries
        if (typeof entry === 'string') {
            // Simple ID reference
            const officialChar = officialMap.get(entry.toLowerCase());
            if (officialChar) {
                characters.push({ ...officialChar });
            } else {
                console.warn(`Character not found in official data: ${entry}`);
            }
            continue;
        }

        if (!entry || typeof entry !== 'object') {
            continue;
        }

        // Skip _meta entries
        if (isScriptMeta(entry)) {
            continue;
        }

        // Check if it's just an ID reference object
        if (isIdReference(entry)) {
            const officialChar = officialMap.get(entry.id.toLowerCase());
            if (officialChar) {
                characters.push({ ...officialChar });
            } else {
                console.warn(`Character not found in official data: ${entry.id}`);
            }
            continue;
        }

        // Custom character with full data
        if (isCharacter(entry)) {
            // Merge with official data if ID matches
            const entryWithId = entry as Character;
            const officialChar = entryWithId.id ? officialMap.get(entryWithId.id.toLowerCase()) : null;
            const mergedChar = officialChar ? { ...officialChar, ...entryWithId } : entryWithId;
            characters.push(mergedChar as Character);
        }
    }

    return characters;
}

/**
 * Result of lenient script validation
 */
export interface ScriptValidationResult {
    characters: Character[];
    warnings: string[];
}

/**
 * Validate and parse script with lenient filtering
 * Invalid entries are filtered out with warnings instead of failing
 * @param scriptData - Raw script data array
 * @param officialData - Official character data
 * @returns Object containing valid characters and warnings for filtered entries
 */
export function validateAndParseScript(
    scriptData: ScriptEntry[],
    officialData: Character[] = []
): ScriptValidationResult {
    const warnings: string[] = [];

    if (!Array.isArray(scriptData)) {
        return {
            characters: [],
            warnings: ['Script data must be an array']
        };
    }

    // Create a map of official characters by ID for quick lookup
    const officialMap = new Map<string, Character>();
    if (Array.isArray(officialData)) {
        officialData.forEach(char => {
            if (char && char.id) {
                officialMap.set(char.id.toLowerCase(), char);
            }
        });
    }

    const characters: Character[] = [];
    const validTeams = CONFIG.TEAMS as readonly string[];

    for (let i = 0; i < scriptData.length; i++) {
        const entry = scriptData[i];
        const position = `Entry ${i + 1}`;

        // Handle string ID references
        if (typeof entry === 'string') {
            const officialChar = officialMap.get(entry.toLowerCase());
            if (officialChar) {
                characters.push({ ...officialChar });
            } else {
                warnings.push(`${position}: Character "${entry}" not found in official data`);
            }
            continue;
        }

        // Skip null/undefined/non-objects
        if (!entry || typeof entry !== 'object') {
            warnings.push(`${position}: Invalid entry type (expected object or string)`);
            continue;
        }

        // Skip _meta entries (valid, no warning)
        if (isScriptMeta(entry)) {
            continue;
        }

        // Handle ID reference objects
        if (isIdReference(entry)) {
            if (typeof entry.id !== 'string') {
                warnings.push(`${position}: Invalid id field type`);
                continue;
            }
            const officialChar = officialMap.get(entry.id.toLowerCase());
            if (officialChar) {
                characters.push({ ...officialChar });
            } else {
                warnings.push(`${position}: Character "${entry.id}" not found in official data`);
            }
            continue;
        }

        // Handle custom characters with full data
        if (isCharacter(entry)) {
            const entryWithId = entry as Character;
            const entryWarnings: string[] = [];

            // Validate team field
            if (entryWithId.team && !validTeams.includes(entryWithId.team)) {
                entryWarnings.push(`invalid team "${entryWithId.team}"`);
            }

            // Validate image field
            if (entryWithId.image !== undefined) {
                if (
                    typeof entryWithId.image !== 'string' &&
                    (!Array.isArray(entryWithId.image) || 
                     !entryWithId.image.every(img => typeof img === 'string'))
                ) {
                    entryWarnings.push('image must be a string or array of strings');
                }
            }

            // Validate reminders field
            if (entryWithId.reminders !== undefined) {
                if (!Array.isArray(entryWithId.reminders)) {
                    entryWarnings.push('reminders must be an array');
                }
            }

            // If there are validation issues, add warnings but still include character
            if (entryWarnings.length > 0) {
                const charName = entryWithId.name || entryWithId.id || 'Unknown';
                warnings.push(`${position} (${charName}): ${entryWarnings.join(', ')}`);
            }

            // Merge with official data if ID matches
            const officialChar = entryWithId.id ? officialMap.get(entryWithId.id.toLowerCase()) : null;
            const mergedChar = officialChar ? { ...officialChar, ...entryWithId } : entryWithId;
            characters.push(mergedChar as Character);
        }
    }

    return { characters, warnings };
}

/**
 * Extract meta information from script
 * @param scriptData - Raw script data
 * @returns Meta object or null
 */
export function extractScriptMeta(scriptData: ScriptEntry[]): ScriptMeta | null {
    if (!Array.isArray(scriptData)) {
        return null;
    }

    for (const entry of scriptData) {
        if (isScriptMeta(entry)) {
            return entry;
        }
    }

    return null;
}

/**
 * Validate character data has required fields
 * @param character - Character object
 * @returns Validation result
 */
export function validateCharacter(character: Partial<Character>): CharacterValidationResult {
    const errors: string[] = [];

    if (!character.name) {
        errors.push('Missing character name');
    }

    if (!character.team) {
        errors.push('Missing team type');
    } else if (!CONFIG.TEAMS.includes(character.team as Team)) {
        errors.push(`Invalid team type: ${character.team}`);
    }

    // Image can be string or array
    if (!character.image) {
        errors.push('Missing character image');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Get image URL from character image field
 * Handles both string and array formats
 * @param imageField - Image field value
 * @returns Image URL
 */
export function getCharacterImageUrl(imageField: string | string[] | undefined): string {
    if (typeof imageField === 'string') {
        return imageField;
    }
    if (Array.isArray(imageField) && imageField.length > 0) {
        return imageField[0]; // Use first image (default/good version)
    }
    return '';
}

/**
 * Count reminders for a character
 * @param character - Character object
 * @returns Number of reminders
 */
export function countReminders(character: Character): number {
    if (!character.reminders) {
        return 0;
    }
    if (Array.isArray(character.reminders)) {
        return character.reminders.length;
    }
    return 0;
}

/**
 * Get global reminders for a character (used for tokens that affect other characters)
 * @param character - Character object
 * @returns Array of global reminder strings
 */
export function getGlobalReminders(character: Character): string[] {
    if (!character.remindersGlobal) {
        return [];
    }
    if (Array.isArray(character.remindersGlobal)) {
        return character.remindersGlobal;
    }
    return [];
}

/**
 * Group characters by team
 * @param characters - Array of character objects
 * @returns Object with team names as keys and character arrays as values
 */
export function groupByTeam(characters: Character[]): Record<Team, Character[]> {
    const groups: Record<Team, Character[]> = {
        townsfolk: [],
        outsider: [],
        minion: [],
        demon: [],
        traveller: [],
        fabled: [],
        loric: [],
        meta: []
    };

    characters.forEach(char => {
        const team = (char.team || 'townsfolk').toLowerCase() as Team;
        if (groups[team]) {
            groups[team].push(char);
        } else {
            groups.townsfolk.push(char);
        }
    });

    return groups;
}

/**
 * Calculate token counts by team
 * @param characters - Array of character objects
 * @returns Counts object with character and reminder counts per team
 */
export function calculateTokenCounts(characters: Character[]): TokenCounts {
    const counts: Record<Team, TeamCounts> = {
        townsfolk: { characters: 0, reminders: 0 },
        outsider: { characters: 0, reminders: 0 },
        minion: { characters: 0, reminders: 0 },
        demon: { characters: 0, reminders: 0 },
        traveller: { characters: 0, reminders: 0 },
        fabled: { characters: 0, reminders: 0 },
        loric: { characters: 0, reminders: 0 },
        meta: { characters: 0, reminders: 0 }
    };

    characters.forEach(char => {
        const team = (char.team || 'townsfolk').toLowerCase() as Team;
        if (counts[team]) {
            counts[team].characters++;
            counts[team].reminders += countReminders(char);
        }
    });

    // Calculate totals in a single iteration
    let totalCharacters = 0;
    let totalReminders = 0;
    for (const team of CONFIG.TEAMS) {
        totalCharacters += counts[team].characters;
        totalReminders += counts[team].reminders;
    }

    return {
        ...counts,
        total: {
            characters: totalCharacters,
            reminders: totalReminders
        }
    };
}

/**
 * Load and parse JSON from file
 * @param file - File object
 * @returns Parsed JSON data
 */
export async function loadJsonFile(file: File): Promise<ScriptEntry[]> {
    console.log(`[loadJsonFile] Loading file: ${file.name}, size: ${file.size}, type: ${file.type}`);
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event): void => {
            console.log('[loadJsonFile] File read successfully');
            try {
                const result = event.target?.result;
                if (typeof result !== 'string') {
                    const error = new Error('Failed to read file as text');
                    console.error('[loadJsonFile]', error.message);
                    reject(error);
                    return;
                }
                console.log(`[loadJsonFile] File content length: ${result.length}`);
                const data = JSON.parse(result) as ScriptEntry[];
                console.log('[loadJsonFile] JSON parsed successfully:', data);
                resolve(data);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';
                const parseError = new Error(`Invalid JSON file: ${message}`);
                console.error('[loadJsonFile]', parseError.message);
                reject(parseError);
            }
        };
        
        reader.onerror = (): void => {
            const error = new Error('Failed to read file');
            console.error('[loadJsonFile]', error.message, reader.error);
            reject(error);
        };
        
        reader.readAsText(file);
    });
}

export default {
    fetchOfficialData,
    loadExampleScript,
    parseScriptData,
    extractScriptMeta,
    validateCharacter,
    getCharacterImageUrl,
    countReminders,
    getGlobalReminders,
    groupByTeam,
    calculateTokenCounts,
    loadJsonFile
};
