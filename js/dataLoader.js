/**
 * Blood on the Clocktower Token Generator
 * Data Loader - JSON parsing and character data fetching
 */

import CONFIG from './config.js';

/**
 * Cache for official character data
 */
let officialDataCache = null;

/**
 * Fetch official Blood on the Clocktower character data
 * @returns {Promise<Object[]>} Array of character objects
 */
export async function fetchOfficialData() {
    if (officialDataCache) {
        return officialDataCache;
    }

    try {
        const response = await fetch(CONFIG.API.BOTC_DATA);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        officialDataCache = await response.json();
        return officialDataCache;
    } catch (error) {
        console.warn('Failed to fetch official data, continuing with script data only:', error);
        return [];
    }
}

/**
 * Load example script from file
 * @param {string} filename - Example script filename
 * @returns {Promise<Object[]>} Parsed script data
 */
export async function loadExampleScript(filename) {
    try {
        const response = await fetch(`./example_scripts/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load example script: ${filename}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading example script:', error);
        throw error;
    }
}

/**
 * Parse script JSON and merge with official data where needed
 * @param {Object[]} scriptData - Raw script data array
 * @param {Object[]} officialData - Official character data
 * @returns {Object[]} Merged character data
 */
export function parseScriptData(scriptData, officialData = []) {
    if (!Array.isArray(scriptData)) {
        throw new Error('Script data must be an array');
    }

    // Create a map of official characters by ID for quick lookup
    const officialMap = new Map();
    if (Array.isArray(officialData)) {
        officialData.forEach(char => {
            if (char && char.id) {
                officialMap.set(char.id.toLowerCase(), char);
            }
        });
    }

    // Process script entries
    const characters = [];
    
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
        if (entry.id === '_meta') {
            continue;
        }

        // Check if it's just an ID reference object
        if (entry.id && Object.keys(entry).length === 1) {
            const officialChar = officialMap.get(entry.id.toLowerCase());
            if (officialChar) {
                characters.push({ ...officialChar });
            } else {
                console.warn(`Character not found in official data: ${entry.id}`);
            }
            continue;
        }

        // Custom character with full data
        if (entry.name) {
            // Merge with official data if ID matches
            const officialChar = entry.id ? officialMap.get(entry.id.toLowerCase()) : null;
            const mergedChar = officialChar ? { ...officialChar, ...entry } : entry;
            characters.push(mergedChar);
        }
    }

    return characters;
}

/**
 * Extract meta information from script
 * @param {Object[]} scriptData - Raw script data
 * @returns {Object|null} Meta object or null
 */
export function extractScriptMeta(scriptData) {
    if (!Array.isArray(scriptData)) {
        return null;
    }

    for (const entry of scriptData) {
        if (entry && entry.id === '_meta') {
            return entry;
        }
    }

    return null;
}

/**
 * Validate character data has required fields
 * @param {Object} character - Character object
 * @returns {Object} Validation result
 */
export function validateCharacter(character) {
    const errors = [];

    if (!character.name) {
        errors.push('Missing character name');
    }

    if (!character.team) {
        errors.push('Missing team type');
    } else if (!CONFIG.TEAMS.includes(character.team.toLowerCase())) {
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
 * @param {string|string[]} imageField - Image field value
 * @returns {string} Image URL
 */
export function getCharacterImageUrl(imageField) {
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
 * @param {Object} character - Character object
 * @returns {number} Number of reminders
 */
export function countReminders(character) {
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
 * @param {Object} character - Character object
 * @returns {string[]} Array of global reminder strings
 */
export function getGlobalReminders(character) {
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
 * @param {Object[]} characters - Array of character objects
 * @returns {Object} Object with team names as keys and character arrays as values
 */
export function groupByTeam(characters) {
    const groups = {};
    
    CONFIG.TEAMS.forEach(team => {
        groups[team] = [];
    });

    characters.forEach(char => {
        const team = (char.team || 'townsfolk').toLowerCase();
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
 * @param {Object[]} characters - Array of character objects
 * @returns {Object} Counts object with character and reminder counts per team
 */
export function calculateTokenCounts(characters) {
    const counts = {};

    CONFIG.TEAMS.forEach(team => {
        counts[team] = { characters: 0, reminders: 0 };
    });

    characters.forEach(char => {
        const team = (char.team || 'townsfolk').toLowerCase();
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
    counts.total = {
        characters: totalCharacters,
        reminders: totalReminders
    };

    return counts;
}

/**
 * Load and parse JSON from file
 * @param {File} file - File object
 * @returns {Promise<Object[]>} Parsed JSON data
 */
export async function loadJsonFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                resolve(data);
            } catch (error) {
                reject(new Error(`Invalid JSON file: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
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
