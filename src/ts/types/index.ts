/**
 * Blood on the Clocktower Token Generator
 * Type Definitions
 */

// Team types
export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'traveller' | 'fabled' | 'loric' | 'meta';

// Character data from BotC API
export interface Character {
    id: string;
    name: string;
    team: Team;
    ability?: string;
    image: string | string[];
    setup?: boolean;
    reminders?: string[];
    remindersGlobal?: string[];
    edition?: string;
    firstNight?: number;
    otherNight?: number;
    firstNightReminder?: string;
    otherNightReminder?: string;
}

// Script meta information
export interface ScriptMeta {
    id: '_meta';
    name?: string;
    author?: string;
    logo?: string;
    almanac?: string;
}

// Script entry can be a string, meta object, or character reference
export type ScriptEntry = string | ScriptMeta | Character | { id: string };

// Token configuration
export interface TokenConfig {
    // Token Generation
    displayAbilityText: boolean;
    tokenCount: boolean;
    applyScriptName: boolean;
    scriptNameToken: boolean;
    almanacToken: boolean;
    pandemoniumToken: boolean;

    // Style Options
    leafGeneration: string;
    maximumLeaves: number;
    leafPopulationProbability: number;
    setupFlowerStyle: string;
    reminderBackground: string;
    characterBackground: string;
    characterNameFont: string;
    characterReminderFont: string;

    // PDF Generation
    tokenPadding: number;
    xOffset: number;
    yOffset: number;
}

// Font spacing configuration
export interface FontSpacingOptions {
    characterName: number;
    abilityText: number;
    reminderText: number;
}

// Text shadow configuration
export interface TextShadowOptions {
    characterName: number;
    abilityText: number;
    reminderText: number;
}

// PNG export configuration
export interface PngExportOptions {
    embedMetadata: boolean;
    transparentBackground: boolean;
}

// ZIP compression level
export type CompressionLevel = 'fast' | 'normal' | 'maximum';

// ZIP export configuration
export interface ZipExportOptions {
    saveInTeamFolders: boolean;
    saveRemindersSeparately: boolean;
    metaTokenFolder: boolean;
    includeScriptJson: boolean;
    compressionLevel: CompressionLevel;
}

// DPI type
export type DPIOption = 300 | 600;

// Custom preset structure
export interface CustomPreset {
    id: string;           // "custom_" + timestamp
    name: string;
    icon: string;         // emoji
    settings: GenerationOptions;
    isCustom: true;
}

// Generation options (subset of TokenConfig)
export interface GenerationOptions {
    displayAbilityText: boolean;
    tokenCount: boolean;
    setupFlowerStyle: string;
    reminderBackground: string;
    reminderBackgroundImage?: string;
    characterBackground: string;
    characterBackgroundColor?: string;
    metaBackground?: string;
    characterNameFont: string;
    characterNameColor?: string;
    characterReminderFont: string;
    abilityTextFont?: string;
    abilityTextColor?: string;
    reminderTextColor?: string;
    scriptNameToken: boolean;
    almanacToken: boolean;
    pandemoniumToken: boolean;
    leafGeneration?: string;
    maximumLeaves?: number;
    leafPopulationProbability?: number;
    leafArcSpan?: number;
    leafSlots?: number;
    dpi?: DPIOption;
    fontSpacing?: FontSpacingOptions;
    textShadow?: TextShadowOptions;
    pngSettings?: PngExportOptions;
    zipSettings?: ZipExportOptions;
    pdfPadding?: number;
    pdfXOffset?: number;
    pdfYOffset?: number;
}

// Generated token
export interface Token {
    type: 'character' | 'reminder' | 'script-name' | 'almanac' | 'pandemonium';
    name: string;
    filename: string;
    team: Team | string;
    canvas: HTMLCanvasElement;
    diameter: number;  // Original diameter before DPI scaling
    hasReminders?: boolean;
    reminderCount?: number;
    parentCharacter?: string;
    reminderText?: string;
}

// PDF options
export interface PDFOptions {
    pageWidth: number;
    pageHeight: number;
    dpi: number;
    margin: number;
    tokenPadding: number;
    xOffset: number;
    yOffset: number;
}

// Token layout item for PDF
export interface TokenLayoutItem {
    token: Token;
    x: number;
    y: number;
    width: number;
    height: number;
}

// Filter options
export interface FilterOptions {
    team: Team | 'all';
    type: 'all' | 'character' | 'reminder';
    hasReminders: 'all' | 'has' | 'none';
}

// Token counts by team
export interface TeamCounts {
    characters: number;
    reminders: number;
}

export interface TokenCounts {
    townsfolk: TeamCounts;
    outsider: TeamCounts;
    minion: TeamCounts;
    demon: TeamCounts;
    traveller: TeamCounts;
    fabled: TeamCounts;
    loric: TeamCounts;
    meta: TeamCounts;
    total: TeamCounts;
}

// RGB color
export interface RGB {
    r: number;
    g: number;
    b: number;
}

// Validation result
export interface ValidationResult {
    valid: boolean;
    error?: string;
    data?: ScriptEntry[];
}

// Character validation result
export interface CharacterValidationResult {
    valid: boolean;
    errors: string[];
}

// Progress callback type
export type ProgressCallback = (current: number, total: number) => void;

// Font settings
export interface FontSettings {
    SIZE_RATIO: number;
    CURVE_OFFSET?: number;
    LINE_HEIGHT?: number;
}

// Configuration structure
export interface Config {
    VERSION: string;
    TOKEN: {
        ROLE_DIAMETER_INCHES: number;
        REMINDER_DIAMETER_INCHES: number;
        DISPLAY_ABILITY_TEXT: boolean;
        TOKEN_COUNT: boolean;
    };
    STYLE: {
        LEAF_GENERATION: string;
        MAXIMUM_LEAVES: number;
        LEAF_POPULATION_PROBABILITY: number;
        LEAF_ARC_SPAN: number;
        LEAF_SLOTS: number;
        SETUP_FLOWER_STYLE: string;
        REMINDER_BACKGROUND: string;
        CHARACTER_BACKGROUND: string;
        CHARACTER_NAME_FONT: string;
        CHARACTER_NAME_COLOR: string;
        CHARACTER_REMINDER_FONT: string;
        ABILITY_TEXT_FONT: string;
        ABILITY_TEXT_COLOR: string;
        REMINDER_TEXT_COLOR: string;
    };
    PDF: {
        TOKEN_PADDING: number;
        X_OFFSET: number;
        Y_OFFSET: number;
        PAGE_WIDTH: number;
        PAGE_HEIGHT: number;
        DPI: number;
        MARGIN: number;
    };
    FONT_SPACING: {
        CHARACTER_NAME: number;
        ABILITY_TEXT: number;
        REMINDER_TEXT: number;
    };
    TEXT_SHADOW: {
        CHARACTER_NAME: number;
        ABILITY_TEXT: number;
        REMINDER_TEXT: number;
    };
    ZIP: {
        SAVE_IN_TEAM_FOLDERS: boolean;
        SAVE_REMINDERS_SEPARATELY: boolean;
    };
    AUTO_GENERATE_DEFAULT: boolean;
    API: {
        BOTC_DATA: string;
    };
    ASSETS: {
        FONTS: string;
        IMAGES: string;
        CHARACTER_BACKGROUNDS: string;
        SETUP_FLOWERS: string;
        LEAVES: string;
    };
    EXAMPLE_SCRIPTS: string[];
    TEAMS: Team[];
    FONTS: {
        CHARACTER_NAME: FontSettings;
        REMINDER_TEXT: FontSettings;
        ABILITY_TEXT: FontSettings;
        TOKEN_COUNT: FontSettings;
    };
    TRADEMARK: {
        TEXT: string;
    };
}

// Element references for UI
export interface UIElements {
    // Presets
    presetClassic: HTMLButtonElement | null;
    presetFullBloom: HTMLButtonElement | null;
    presetMinimal: HTMLButtonElement | null;
    presetDescription: HTMLElement | null;
    presetGrid: HTMLElement | null;
    addPresetButton: HTMLButtonElement | null;

    // Token Generation Options
    displayAbilityText: HTMLInputElement | null;
    tokenCount: HTMLInputElement | null;
    scriptNameToken: HTMLInputElement | null;
    almanacToken: HTMLInputElement | null;
    pandemoniumToken: HTMLInputElement | null;

    // Font Spacing
    characterNameSpacing: HTMLInputElement | null;
    abilityTextSpacing: HTMLInputElement | null;
    reminderTextSpacing: HTMLInputElement | null;

    // Text Shadow
    characterNameShadow: HTMLInputElement | null;
    abilityTextShadow: HTMLInputElement | null;
    reminderTextShadow: HTMLInputElement | null;

    // ZIP Settings
    saveInTeamFolders: HTMLInputElement | null;
    saveRemindersSeparately: HTMLInputElement | null;

    // DPI Selection
    dpiSelection: HTMLSelectElement | null;

    // Style Options
    setupFlowerStyle: HTMLSelectElement | null;
    reminderBackground: HTMLInputElement | null;
    characterBackground: HTMLSelectElement | null;
    characterNameFont: HTMLSelectElement | null;
    characterNameColor: HTMLInputElement | null;
    characterReminderFont: HTMLSelectElement | null;
    abilityTextFont: HTMLSelectElement | null;
    abilityTextColor: HTMLInputElement | null;
    reminderTextColor: HTMLInputElement | null;
    leafGeneration: HTMLSelectElement | null;
    maximumLeaves: HTMLInputElement | null;
    leafPopulationProbability: HTMLInputElement | null;

    // PDF Options
    tokenPadding: HTMLInputElement | null;
    xOffset: HTMLInputElement | null;
    yOffset: HTMLInputElement | null;

    // Input Section
    fileUpload: HTMLInputElement | null;
    exampleScripts: HTMLSelectElement | null;
    jsonEditor: HTMLTextAreaElement | null;
    jsonHighlight: HTMLElement | null;
    jsonValidation: HTMLElement | null;
    formatJson: HTMLButtonElement | null;
    clearJson: HTMLButtonElement | null;
    generateTokens: HTMLButtonElement | null;
    autoGenerate: HTMLButtonElement | null;
    downloadJson: HTMLButtonElement | null;

    // Output Section
    outputSection: HTMLElement | null;
    teamFilter: HTMLSelectElement | null;
    tokenTypeFilter: HTMLSelectElement | null;
    displayFilter: HTMLSelectElement | null;
    reminderFilter: HTMLSelectElement | null;
    tokenSections: HTMLElement | null;
    characterTokensSection: HTMLElement | null;
    reminderTokensSection: HTMLElement | null;
    characterTokenGrid: HTMLElement | null;
    reminderTokenGrid: HTMLElement | null;
    loadingState: HTMLElement | null;
    emptyState: HTMLElement | null;
    exportOptions: HTMLElement | null;
    downloadAllPng: HTMLButtonElement | null;
    generatePdf: HTMLButtonElement | null;

    // Sticky Export Bar
    stickyExportBar: HTMLElement | null;
    downloadAllPngSticky: HTMLButtonElement | null;
    generatePdfSticky: HTMLButtonElement | null;

    // Token Counts
    countTownsfolk: HTMLElement | null;
    countOutsider: HTMLElement | null;
    countMinion: HTMLElement | null;
    countDemon: HTMLElement | null;
    countTraveller: HTMLElement | null;
    countFabled: HTMLElement | null;
    countLoric: HTMLElement | null;
    countMeta: HTMLElement | null;
    countTotal: HTMLElement | null;

    // Settings Modal
    settingsButton: HTMLButtonElement | null;
    settingsModal: HTMLElement | null;
    modalBackdrop: HTMLElement | null;
    modalClose: HTMLButtonElement | null;
    uiSizeSlider: HTMLInputElement | null;
    uiSizeValue: HTMLElement | null;
    colorSchema: HTMLSelectElement | null;
    wipeDataButton: HTMLButtonElement | null;

    // Info Modal
    infoButton: HTMLButtonElement | null;
    infoModal: HTMLElement | null;
    infoModalBackdrop: HTMLElement | null;
    infoModalClose: HTMLButtonElement | null;
}

// Team color mapping
export type TeamColors = Record<Team, string>;

// Team labels
export type TeamLabels = Record<Team, string>;

// Preset configurations
export type PresetName = 'classic' | 'fullbloom' | 'minimal';

export interface PresetConfig {
    name: string;
    description: string;
    icon: string;
    settings: Partial<GenerationOptions> & {
        // Additional preset-specific settings
        characterBackground?: string;
        setupFlowerStyle?: string;
        reminderBackground?: string;
        characterNameFont?: string;
        characterReminderFont?: string;
        displayAbilityText?: boolean;
        tokenCount?: boolean;
        scriptNameToken?: boolean;
        almanacToken?: boolean;
        pandemoniumToken?: boolean;
    };
}

// Declare global jsPDF and JSZip
declare global {
    interface Window {
        jspdf: {
            jsPDF: new (options?: {
                orientation?: 'portrait' | 'landscape';
                unit?: 'pt' | 'px' | 'in' | 'mm' | 'cm' | 'ex' | 'em' | 'pc';
                format?: string | number[];
            }) => jsPDFDocument;
        };
        JSZip: new () => JSZipInstance;
        TokenGeneratorApp: unknown;
        QRCode: new (element: HTMLElement, options?: {
            text?: string;
            width?: number;
            height?: number;
            colorDark?: string;
            colorLight?: string;
            correctLevel?: number;
        }) => QRCodeInstance;
    }
}

// QRCode instance type
export interface QRCodeInstance {
    clear(): void;
    makeCode(text: string): void;
}

// jsPDF document type
export interface jsPDFDocument {
    addPage(): void;
    addImage(
        imageData: string,
        format: string,
        x: number,
        y: number,
        width: number,
        height: number
    ): void;
    save(filename: string): void;
    output(type: 'blob'): Blob;
}

// JSZip types
export interface JSZipFolder {
    file(name: string, data: Blob | string): void;
}

export interface JSZipInstance {
    folder(name: string): JSZipFolder;
    file(name: string, data: Blob | string): void;
    generateAsync(options: { 
        type: 'blob';
        compression?: string;
        compressionOptions?: { level: number };
    }): Promise<Blob>;
}
