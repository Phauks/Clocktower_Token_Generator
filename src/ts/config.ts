/**
 * Blood on the Clocktower Token Generator
 * Configuration and Constants
 */

import type { Config, Team, TeamColors, TeamLabels } from './types/index.js';

export const CONFIG: Config = {
    // Application Version
    VERSION: '0.2.0',

    // Token Generation Defaults
    TOKEN: {
        // Physical sizes in inches (not configurable by users)
        ROLE_DIAMETER_INCHES: 1.75,      // Character token diameter
        REMINDER_DIAMETER_INCHES: 1,      // Reminder token diameter
        DISPLAY_ABILITY_TEXT: false,
        TOKEN_COUNT: false
    },

    // Style Defaults
    STYLE: {
        LEAF_GENERATION: 'classic',
        MAXIMUM_LEAVES: 0,
        LEAF_POPULATION_PROBABILITY: 30,
        LEAF_ARC_SPAN: 120,
        LEAF_SLOTS: 7,
        SETUP_FLOWER_STYLE: 'setup_flower_1',
        REMINDER_BACKGROUND: '#FFFFFF',
        CHARACTER_BACKGROUND: 'character_background_1',
        CHARACTER_NAME_FONT: 'Dumbledor',
        CHARACTER_NAME_COLOR: '#000000',
        CHARACTER_REMINDER_FONT: 'TradeGothic',
        ABILITY_TEXT_FONT: 'TradeGothic',
        ABILITY_TEXT_COLOR: '#000000',
        REMINDER_TEXT_COLOR: '#FFFFFF'
    },

    // PDF Generation Defaults
    PDF: {
        TOKEN_PADDING: 75,
        X_OFFSET: 0,
        Y_OFFSET: 0,
        PAGE_WIDTH: 8.5,  // inches
        PAGE_HEIGHT: 11,   // inches
        DPI: 300,
        MARGIN: 0.25       // inches
    },

    // Font Spacing Defaults
    FONT_SPACING: {
        CHARACTER_NAME: 0,    // 0px = normal spacing
        ABILITY_TEXT: 0,
        REMINDER_TEXT: 0
    },

    // Text Shadow Defaults
    TEXT_SHADOW: {
        CHARACTER_NAME: 4,    // 4px blur radius
        ABILITY_TEXT: 3,      // 3px blur radius
        REMINDER_TEXT: 4      // 4px blur radius
    },

    // ZIP Export Settings
    ZIP: {
        SAVE_IN_TEAM_FOLDERS: true,
        SAVE_REMINDERS_SEPARATELY: true
    },

    // Batch Generation Settings
    GENERATION: {
        // Adaptive batch size based on CPU cores
        // Formula: min(8, max(2, cores - 1))
        // 2-core: 2 parallel, 4-core: 3, 8-core: 7, 16-core: 8 (capped)
        BATCH_SIZE: Math.min(
            8,
            Math.max(2, (typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4) - 1)
        ),
        MIN_BATCH_SIZE: 2,
        MAX_BATCH_SIZE: 8
    },

    // Auto-generation Default
    AUTO_GENERATE_DEFAULT: true,

    // API Endpoints
    API: {
        BOTC_DATA: 'https://script.bloodontheclocktower.com/data.json'
    },

    // Asset Paths
    ASSETS: {
        FONTS: './assets/fonts/',
        IMAGES: './assets/images/',
        CHARACTER_BACKGROUNDS: './assets/images/character_background/',
        SETUP_FLOWERS: './assets/images/setup_flower/',
        LEAVES: './assets/images/'
    },

    // Example Scripts
    EXAMPLE_SCRIPTS: [
        'Catfishing.json',
        'Uncertain_Death.json',
        'Fall_of_Rome.json'
    ],

    // Team Types
    TEAMS: ['townsfolk', 'outsider', 'minion', 'demon', 'traveller', 'fabled', 'loric', 'meta'] as Team[],

    // Font Settings
    FONTS: {
        CHARACTER_NAME: {
            SIZE_RATIO: 0.12,  // Relative to diameter
            CURVE_OFFSET: 0.85  // Position along curve (0-1)
        },
        REMINDER_TEXT: {
            SIZE_RATIO: 0.08,
            CURVE_OFFSET: 0.85
        },
        ABILITY_TEXT: {
            SIZE_RATIO: 0.05,
            LINE_HEIGHT: 1.3
        },
        TOKEN_COUNT: {
            SIZE_RATIO: 0.08
        }
    },

    // Trademark Token
    TRADEMARK: {
        TEXT: 'Blood on the Clocktower is a product of the Pandemonium Institute'
    }
};

/**
 * Team color mapping for display purposes
 */
export const TEAM_COLORS: TeamColors = {
    townsfolk: '#1a5f2a',
    outsider: '#1a3f5f',
    minion: '#5f1a3f',
    demon: '#8b0000',
    traveller: '#5f4f1a',
    fabled: '#4f1a5f',
    loric: '#2a5f5f',
    meta: '#808080'
};

/**
 * Team labels for display
 */
export const TEAM_LABELS: TeamLabels = {
    townsfolk: 'Townsfolk',
    outsider: 'Outsider',
    minion: 'Minion',
    demon: 'Demon',
    traveller: 'Traveller',
    fabled: 'Fabled',
    loric: 'Loric',
    meta: 'Meta'
};

export default CONFIG;
