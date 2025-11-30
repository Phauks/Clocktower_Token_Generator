/**
 * Blood on the Clocktower Token Generator
 * Token Generator - Canvas operations for token generation
 */

import CONFIG from './config.js';
import {
    CHARACTER_LAYOUT,
    REMINDER_LAYOUT,
    META_TOKEN_LAYOUT,
    QR_TOKEN_LAYOUT,
    LINE_HEIGHTS,
    TOKEN_COUNT_BADGE,
    LEAF_LAYOUT,
    DEFAULT_COLORS,
    QR_COLORS,
    TIMING
} from './constants.js';
import { loadImage, loadLocalImage, shuffleArray } from './utils.js';
import { getCharacterImageUrl, countReminders } from './dataLoader.js';
import type { Character, Token, GenerationOptions, ProgressCallback, Team, ScriptMeta } from './types/index.js';
import { TokenCreationError } from './errors.js';

/**
 * Token generator options
 */
interface TokenGeneratorOptions {
    displayAbilityText: boolean;
    tokenCount: boolean;
    setupFlowerStyle: string;
    reminderBackground: string;
    reminderBackgroundImage?: string;
    characterBackground: string;
    characterBackgroundColor?: string;
    metaBackground?: string;
    characterNameFont: string;
    characterNameColor: string;
    characterReminderFont: string;
    abilityTextFont: string;
    abilityTextColor: string;
    reminderTextColor: string;
    leafGeneration: string;
    maximumLeaves: number;
    leafPopulationProbability: number;
    leafArcSpan: number;
    leafSlots: number;
    transparentBackground: boolean;
    dpi: number;
    fontSpacing: {
        characterName: number;
        abilityText: number;
        reminderText: number;
    };
    textShadow?: {
        characterName: number;
        abilityText: number;
        reminderText: number;
    };
}

/**
 * TokenGenerator class handles all canvas operations for creating tokens
 */
export class TokenGenerator {
    private options: TokenGeneratorOptions;
    private imageCache: Map<string, HTMLImageElement>;

    constructor(options: Partial<TokenGeneratorOptions> = {}) {
        this.options = {
            displayAbilityText: options.displayAbilityText ?? CONFIG.TOKEN.DISPLAY_ABILITY_TEXT,
            tokenCount: options.tokenCount ?? CONFIG.TOKEN.TOKEN_COUNT,
            setupFlowerStyle: options.setupFlowerStyle ?? CONFIG.STYLE.SETUP_FLOWER_STYLE,
            reminderBackground: options.reminderBackground ?? CONFIG.STYLE.REMINDER_BACKGROUND,
            characterBackground: options.characterBackground ?? CONFIG.STYLE.CHARACTER_BACKGROUND,
            characterNameFont: options.characterNameFont ?? CONFIG.STYLE.CHARACTER_NAME_FONT,
            characterNameColor: options.characterNameColor ?? CONFIG.STYLE.CHARACTER_NAME_COLOR,
            characterReminderFont: options.characterReminderFont ?? CONFIG.STYLE.CHARACTER_REMINDER_FONT,
            abilityTextFont: options.abilityTextFont ?? CONFIG.STYLE.ABILITY_TEXT_FONT,
            abilityTextColor: options.abilityTextColor ?? CONFIG.STYLE.ABILITY_TEXT_COLOR,
            reminderTextColor: options.reminderTextColor ?? CONFIG.STYLE.REMINDER_TEXT_COLOR,
            leafGeneration: options.leafGeneration ?? CONFIG.STYLE.LEAF_GENERATION,
            maximumLeaves: options.maximumLeaves ?? CONFIG.STYLE.MAXIMUM_LEAVES,
            leafPopulationProbability: options.leafPopulationProbability ?? CONFIG.STYLE.LEAF_POPULATION_PROBABILITY,
            leafArcSpan: options.leafArcSpan ?? CONFIG.STYLE.LEAF_ARC_SPAN,
            leafSlots: options.leafSlots ?? CONFIG.STYLE.LEAF_SLOTS,
            transparentBackground: options.transparentBackground ?? false,
            dpi: options.dpi ?? CONFIG.PDF.DPI,
            fontSpacing: options.fontSpacing ?? {
                characterName: CONFIG.FONT_SPACING.CHARACTER_NAME,
                abilityText: CONFIG.FONT_SPACING.ABILITY_TEXT,
                reminderText: CONFIG.FONT_SPACING.REMINDER_TEXT
            }
        };

        this.imageCache = new Map();
    }

    /**
     * Update generator options
     * @param newOptions - New options to apply
     */
    updateOptions(newOptions: Partial<TokenGeneratorOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    /**
     * Load and cache an image
     * @param url - Image URL
     * @returns Loaded image element
     */
    async getCachedImage(url: string): Promise<HTMLImageElement> {
        const cachedImage = this.imageCache.get(url);
        if (cachedImage) {
            return cachedImage;
        }

        try {
            const img = await loadImage(url);
            this.imageCache.set(url, img);
            return img;
        } catch (error) {
            console.error(`Failed to load image: ${url}`, error);
            throw error;
        }
    }

    /**
     * Load a local asset image
     * @param path - Asset path
     * @returns Loaded image element
     */
    async getLocalImage(path: string): Promise<HTMLImageElement> {
        const cachedImage = this.imageCache.get(path);
        if (cachedImage) {
            return cachedImage;
        }

        try {
            const img = await loadLocalImage(path);
            this.imageCache.set(path, img);
            return img;
        } catch (error) {
            console.error(`Failed to load local image: ${path}`, error);
            throw error;
        }
    }

    /**
     * Draw leaf decorations on a token
     * Dynamically positions leaves along an arc at the top and on left/right sides
     * @param ctx - Canvas context
     * @param diameter - Token diameter
     */
    async drawLeaves(ctx: CanvasRenderingContext2D, diameter: number): Promise<void> {
        const { 
            maximumLeaves, 
            leafPopulationProbability, 
            leafGeneration,
            leafArcSpan,
            leafSlots
        } = this.options;
        
        // Auto-detect available leaf variants by trying to load them
        const basePath = `${CONFIG.ASSETS.LEAVES}${LEAF_LAYOUT.ASSETS.LEAVES_PATH}${leafGeneration}/`;
        let availableVariants = 0;
        for (let i = 1; i <= 20; i++) { // Check up to 20 variants
            try {
                await this.getLocalImage(`${basePath}${LEAF_LAYOUT.ASSETS.LEAF_FILENAME}_${i}.png`);
                availableVariants = i;
            } catch {
                break; // Stop when we can't load the next variant
            }
        }
        
        if (availableVariants === 0) {
            console.warn(`No leaf variants found for style: ${leafGeneration}`);
            return;
        }
        
        const radius = diameter / 2;
        const center = { x: radius, y: radius };
        
        // Build array of all possible leaf positions
        // 2 side positions + leafSlots arc positions
        interface LeafPosition {
            type: 'left' | 'right' | 'arc';
            angle: number; // in radians, 0 = top, positive = clockwise
            scale: number;
            radialOffset: number;
        }
        
        const positions: LeafPosition[] = [];
        
        // Add left side position (at 270 degrees / -90 degrees from top)
        positions.push({
            type: 'left',
            angle: -Math.PI / 2, // -90 degrees (left side)
            scale: LEAF_LAYOUT.SIDE_LEAVES.SCALE,
            radialOffset: LEAF_LAYOUT.SIDE_LEAVES.RADIAL_OFFSET,
        });
        
        // Add right side position (at 90 degrees from top)
        positions.push({
            type: 'right',
            angle: Math.PI / 2, // 90 degrees (right side)
            scale: LEAF_LAYOUT.SIDE_LEAVES.SCALE,
            radialOffset: LEAF_LAYOUT.SIDE_LEAVES.RADIAL_OFFSET,
        });
        
        // Add arc positions along the top
        // Arc is centered at top (0 degrees), spanning leafArcSpan degrees
        const arcSpanRad = (leafArcSpan * Math.PI) / 180;
        const startAngle = -arcSpanRad / 2; // Start from left side of arc
        const angleStep = arcSpanRad / (leafSlots - 1);
        
        for (let i = 0; i < leafSlots; i++) {
            const angle = startAngle + (i * angleStep);
            positions.push({
                type: 'arc',
                angle: angle,
                scale: LEAF_LAYOUT.ARC_LEAVES.SCALE,
                radialOffset: LEAF_LAYOUT.ARC_LEAVES.RADIAL_OFFSET,
            });
        }
        
        // Shuffle positions to randomize which leaves are checked first
        const shuffledPositions = shuffleArray(positions);
        
        let leavesDrawn = 0;
        
        for (const position of shuffledPositions) {
            // Stop if we've drawn the maximum number of leaves
            if (leavesDrawn >= maximumLeaves) {
                break;
            }
            
            // Roll probability check
            const roll = Math.random() * 100;
            if (roll >= leafPopulationProbability) {
                continue; // Skip this leaf position
            }
            
            // Pick a random leaf variant from available ones
            const variantIndex = Math.floor(Math.random() * availableVariants) + 1;
            
            // Load and draw the leaf
            try {
                const leafPath = `${CONFIG.ASSETS.LEAVES}${LEAF_LAYOUT.ASSETS.LEAVES_PATH}${leafGeneration}/${LEAF_LAYOUT.ASSETS.LEAF_FILENAME}_${variantIndex}.png`;
                const leafImage = await this.getLocalImage(leafPath);
                
                const leafSize = diameter * position.scale;
                
                // Calculate position on the circle
                // Angle 0 = top center, positive = clockwise
                const posX = center.x + (radius * position.radialOffset) * Math.sin(position.angle);
                const posY = center.y - (radius * position.radialOffset) * Math.cos(position.angle);
                
                ctx.save();
                
                // Move to the leaf position
                ctx.translate(posX, posY);
                
                // Rotate leaf to point outward from center
                // The leaf image should point upward (12 o'clock)
                // We rotate it to follow the circle's tangent + point outward
                ctx.rotate(position.angle);
                
                // Draw leaf centered at this position
                ctx.drawImage(leafImage, -leafSize / 2, -leafSize / 2, leafSize, leafSize);
                
                ctx.restore();
                
                leavesDrawn++;
            } catch (error) {
                console.warn(`Could not load leaf variant ${variantIndex}`, error);
            }
        }
    }

    /**
     * Generate a character token
     * @param character - Character data
     * @returns Generated canvas element
     */
    async generateCharacterToken(character: Character): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        // Apply circular clipping path for background and character image
        this.applyCircularClip(ctx, center, radius);

        // 1. Draw character background (skip solid fill if transparent mode)
        try {
            const bgPath = `${CONFIG.ASSETS.CHARACTER_BACKGROUNDS}${this.options.characterBackground}.png`;
            const bgImage = await this.getLocalImage(bgPath);
            this.drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            // Fallback to solid color if background fails (unless transparent mode)
            if (!this.options.transparentBackground) {
                ctx.fillStyle = DEFAULT_COLORS.FALLBACK_BACKGROUND;
                ctx.fill();
            }
        }

        // 2. Draw character image (centered)
        const imageUrl = getCharacterImageUrl(character.image);
        if (imageUrl) {
            try {
                const charImage = await this.getCachedImage(imageUrl);
                const imgSize = diameter * CHARACTER_LAYOUT.IMAGE_SIZE_RATIO;
                const imgOffset = (diameter - imgSize) / 2;
                ctx.drawImage(charImage, imgOffset, imgOffset - diameter * CHARACTER_LAYOUT.IMAGE_VERTICAL_OFFSET, imgSize, imgSize);
            } catch (error) {
                console.warn(`Could not load character image for ${character.name}. This may be due to CORS restrictions. Token will be generated without portrait image.`, error);
            }
        }

        // 3. Draw setup flower if character has setup attribute
        if (character.setup) {
            try {
                const flowerPath = `${CONFIG.ASSETS.SETUP_FLOWERS}${this.options.setupFlowerStyle}.png`;
                const flowerImage = await this.getLocalImage(flowerPath);
                this.drawImageCover(ctx, flowerImage, diameter, diameter);
            } catch {
                console.warn('Could not load setup flower');
            }
        }

        // Restore context to remove clipping path before drawing leaves and text
        ctx.restore();

        // 4. Draw leaves if enabled (must be after clipping is removed so leaves can extend beyond token edge)
        if (this.options.maximumLeaves > 0) {
            await this.drawLeaves(ctx, diameter);
        }

        // 5. Draw ability text if enabled
        if (this.options.displayAbilityText && character.ability) {
            this.drawAbilityText(ctx, character.ability, diameter);
        }

        // 5. Draw character name curved along bottom
        if (character.name) {
            this.drawCurvedText(
                ctx,
                character.name.toUpperCase(),
                center.x,
                center.y,
                radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
                this.options.characterNameFont,
                diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
                'bottom',
                this.options.characterNameColor,
                this.options.fontSpacing.characterName,
                this.options.textShadow?.characterName ?? 4
            );
        }

        // 6. Draw reminder count if enabled
        if (this.options.tokenCount) {
            const reminderCount = countReminders(character);
            if (reminderCount > 0) {
                this.drawTokenCount(ctx, reminderCount, diameter);
            }
        }

        return canvas;
    }

    /**
     * Generate a reminder token
     * @param character - Parent character data
     * @param reminderText - Reminder text
     * @returns Generated canvas element
     */
    async generateReminderToken(character: Character, reminderText: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.REMINDER_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        // Apply circular clipping path
        this.applyCircularClip(ctx, center, radius);

        // 1. Fill with reminder background color (skip if transparent mode)
        if (!this.options.transparentBackground) {
            ctx.fillStyle = this.options.reminderBackground;
            ctx.fill();
        }

        // 2. Draw character image (centered, smaller)
        const imageUrl = getCharacterImageUrl(character.image);
        if (imageUrl) {
            try {
                const charImage = await this.getCachedImage(imageUrl);
                const imgSize = diameter * REMINDER_LAYOUT.IMAGE_SIZE_RATIO;
                const imgOffset = (diameter - imgSize) / 2;
                ctx.drawImage(charImage, imgOffset, imgOffset - diameter * REMINDER_LAYOUT.IMAGE_VERTICAL_OFFSET, imgSize, imgSize);
            } catch (error) {
                console.warn(`Could not load character image for reminder: ${character.name}. This may be due to CORS restrictions. Token will be generated without portrait image.`, error);
            }
        }

        // Reset clipping for text
        ctx.restore();
        ctx.save();

        // 3. Draw reminder text curved along bottom
        this.drawCurvedText(
            ctx,
            reminderText.toUpperCase(),
            center.x,
            center.y,
            radius * REMINDER_LAYOUT.CURVED_TEXT_RADIUS,
            this.options.characterReminderFont,
            diameter * CONFIG.FONTS.REMINDER_TEXT.SIZE_RATIO,
            'bottom',
            this.options.reminderTextColor,
            this.options.fontSpacing.reminderText,
            this.options.textShadow?.reminderText ?? 4
        );

        return canvas;
    }

    /**
     * Draw text curved along a circular path
     * @param ctx - Canvas context
     * @param text - Text to draw
     * @param centerX - Circle center X
     * @param centerY - Circle center Y
     * @param radius - Curve radius
     * @param fontFamily - Font family name
     * @param fontSize - Font size in pixels
     * @param position - 'top' or 'bottom'
     * @param color - Text color
     * @param letterSpacing - Letter spacing in pixels
     * @param shadowBlur - Shadow blur radius (optional, defaults to character name shadow)
     */
    drawCurvedText(
        ctx: CanvasRenderingContext2D,
        text: string,
        centerX: number,
        centerY: number,
        radius: number,
        fontFamily: string,
        fontSize: number,
        position: 'top' | 'bottom' = 'bottom',
        color: string = '#FFFFFF',
        letterSpacing: number = 0,
        shadowBlur?: number
    ): void {
        ctx.save();

        ctx.font = `bold ${fontSize}px "${fontFamily}", Georgia, serif`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add text shadow for readability
        const blur = shadowBlur ?? this.options.textShadow?.characterName ?? 4;
        ctx.shadowColor = DEFAULT_COLORS.TEXT_SHADOW;
        ctx.shadowBlur = blur;
        ctx.shadowOffsetX = blur / 2;
        ctx.shadowOffsetY = blur / 2;

        // Measure total text width
        const totalWidth = ctx.measureText(text).width;

        // Calculate the angle span based on text width and radius
        // Limit to a maximum arc span to keep text readable
        const maxArcSpan = CHARACTER_LAYOUT.MAX_TEXT_ARC_SPAN;
        const arcSpan = Math.min(totalWidth / radius, maxArcSpan);

        // Starting angle for bottom text (centered)
        let startAngle: number;
        if (position === 'bottom') {
            startAngle = Math.PI / 2 + arcSpan / 2;
        } else {
            startAngle = -Math.PI / 2 - arcSpan / 2;
        }

        // Calculate angle per character (proportional to character width)
        const charWidths: number[] = [];
        let totalCharWidth = 0;
        for (const char of text) {
            const width = ctx.measureText(char).width + letterSpacing;
            charWidths.push(width);
            totalCharWidth += width;
        }

        // Draw each character
        let currentAngle = startAngle;
        const direction = position === 'bottom' ? -1 : 1;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const charWidth = charWidths[i];
            const charAngle = (charWidth / totalCharWidth) * arcSpan;

            currentAngle += direction * charAngle / 2;

            const x = centerX + radius * Math.cos(currentAngle);
            const y = centerY + radius * Math.sin(currentAngle);

            ctx.save();
            ctx.translate(x, y);

            // Rotate character to follow the curve
            let rotation = currentAngle + Math.PI / 2;
            if (position === 'top') {
                rotation -= Math.PI;
            } else {
                // For bottom text, flip 180 degrees to face outward
                rotation += Math.PI;
            }
            ctx.rotate(rotation);

            ctx.fillText(char, 0, 0);
            ctx.restore();

            currentAngle += direction * charAngle / 2;
        }

        ctx.restore();
    }

    /**
     * Draw ability text on token
     * @param ctx - Canvas context
     * @param ability - Ability text
     * @param diameter - Token diameter
     */
    drawAbilityText(ctx: CanvasRenderingContext2D, ability: string, diameter: number): void {
        ctx.save();

        const fontSize = diameter * CONFIG.FONTS.ABILITY_TEXT.SIZE_RATIO;
        const letterSpacing = this.options.fontSpacing.abilityText;

        ctx.font = `${fontSize}px "${this.options.abilityTextFont}", sans-serif`;
        ctx.fillStyle = this.options.abilityTextColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Apply letterSpacing if supported (modern browsers)
        if ('letterSpacing' in ctx && letterSpacing !== 0) {
            (ctx as any).letterSpacing = `${letterSpacing}px`;
        }

        // Add shadow for readability
        const shadowBlur = this.options.textShadow?.abilityText ?? 3;
        ctx.shadowColor = DEFAULT_COLORS.TEXT_SHADOW;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowBlur / 3;
        ctx.shadowOffsetY = shadowBlur / 3;

        // Word wrap the text
        const maxWidth = diameter * CHARACTER_LAYOUT.ABILITY_TEXT_MAX_WIDTH;
        const lineHeight = fontSize * (CONFIG.FONTS.ABILITY_TEXT.LINE_HEIGHT ?? LINE_HEIGHTS.STANDARD);
        const words = ability.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        // Draw lines centered vertically in upper portion of token
        const startY = diameter * CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], diameter / 2, startY + i * lineHeight);
        }

        ctx.restore();
    }

    /**
     * Draw reminder token count on character token
     * @param ctx - Canvas context
     * @param count - Number of reminders
     * @param diameter - Token diameter
     */
    drawTokenCount(ctx: CanvasRenderingContext2D, count: number, diameter: number): void {
        ctx.save();

        const fontSize = diameter * CONFIG.FONTS.TOKEN_COUNT.SIZE_RATIO;
        ctx.font = `bold ${fontSize}px "${this.options.characterNameFont}", Georgia, serif`;
        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw at top of token
        const y = diameter * CHARACTER_LAYOUT.TOKEN_COUNT_Y_POSITION;

        // Add background circle
        ctx.beginPath();
        ctx.arc(diameter / 2, y, fontSize * TOKEN_COUNT_BADGE.BACKGROUND_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = DEFAULT_COLORS.BADGE_BACKGROUND;
        ctx.fill();
        ctx.strokeStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.lineWidth = TOKEN_COUNT_BADGE.STROKE_WIDTH;
        ctx.stroke();

        // Draw count
        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.fillText(count.toString(), diameter / 2, y);

        ctx.restore();
    }

    /**
     * Create a base canvas with DPI scaling
     * @param diameter - Token diameter
     * @returns Canvas setup with context, center point, and radius
     */
    private createBaseCanvas(diameter: number): {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
        center: { x: number; y: number };
        radius: number;
    } {
        const dpiScale = this.options.dpi / 300;
        const scaledDiameter = Math.floor(diameter * dpiScale);

        const canvas = document.createElement('canvas');
        canvas.width = scaledDiameter;
        canvas.height = scaledDiameter;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new TokenCreationError('Failed to get canvas 2D context');
        }

        // Set high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Apply DPI scaling
        if (dpiScale !== 1) {
            ctx.scale(dpiScale, dpiScale);
        }

        return {
            canvas,
            ctx,
            center: { x: diameter / 2, y: diameter / 2 },
            radius: diameter / 2
        };
    }

    /**
     * Apply circular clipping path to canvas context
     * @param ctx - Canvas rendering context
     * @param center - Center point coordinates
     * @param radius - Circle radius
     */
    private applyCircularClip(ctx: CanvasRenderingContext2D, center: { x: number; y: number }, radius: number): void {
        ctx.save();
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
    }

    /**
     * Draw image to cover canvas (like CSS background-size: cover)
     * @param ctx - Canvas context
     * @param img - Image to draw
     * @param targetWidth - Target width
     * @param targetHeight - Target height
     */
    drawImageCover(
        ctx: CanvasRenderingContext2D,
        img: HTMLImageElement,
        targetWidth: number,
        targetHeight: number
    ): void {
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let drawWidth: number, drawHeight: number, drawX: number, drawY: number;

        if (imgRatio > targetRatio) {
            drawHeight = targetHeight;
            drawWidth = img.width * (targetHeight / img.height);
            drawX = (targetWidth - drawWidth) / 2;
            drawY = 0;
        } else {
            drawWidth = targetWidth;
            drawHeight = img.height * (targetWidth / img.width);
            drawX = 0;
            drawY = (targetHeight - drawHeight) / 2;
        }

        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    }

    /**
     * Generate a script name token
     * @param scriptName - Script name to display
     * @param author - Optional author name
     * @returns Generated canvas element
     */
    async generateScriptNameToken(scriptName: string, author?: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const dpiScale = this.options.dpi / 300;
        const scaledDiameter = Math.floor(diameter * dpiScale);

        const canvas = document.createElement('canvas');
        canvas.width = scaledDiameter;
        canvas.height = scaledDiameter;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Scale context for DPI - all drawing operations use original diameter
        if (dpiScale !== 1) {
            ctx.scale(dpiScale, dpiScale);
        }

        const radius = diameter / 2;
        const center = { x: radius, y: radius };

        // Save initial state before clipping
        ctx.save();

        // Create circular clipping path for background
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw meta token background
        try {
            const bgPath = `${CONFIG.ASSETS.CHARACTER_BACKGROUNDS}${this.options.metaBackground || this.options.characterBackground}.png`;
            const bgImage = await this.getLocalImage(bgPath);
            this.drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            // Fallback to solid color if background fails (unless transparent mode)
            if (!this.options.transparentBackground) {
                ctx.fillStyle = DEFAULT_COLORS.FALLBACK_BACKGROUND;
                ctx.fill();
            }
        }

        // Restore context to remove clipping path before drawing text
        ctx.restore();

        // Draw script name in center (large, word-wrapped)
        this.drawCenteredText(ctx, scriptName.toUpperCase(), diameter);

        // Draw author curved at bottom if provided
        if (author) {
            this.drawCurvedText(
                ctx,
                author,
                center.x,
                center.y,
                radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
                this.options.characterNameFont,
                diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO * META_TOKEN_LAYOUT.AUTHOR_TEXT_SIZE_FACTOR,
                'bottom',
                DEFAULT_COLORS.TEXT_PRIMARY,
                this.options.fontSpacing.characterName
            );
        }

        return canvas;
    }

    /**
     * Generate a Pandemonium Institute token
     * @returns Generated canvas element
     */
    async generatePandemoniumToken(): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const dpiScale = this.options.dpi / 300;
        const scaledDiameter = Math.floor(diameter * dpiScale);

        const canvas = document.createElement('canvas');
        canvas.width = scaledDiameter;
        canvas.height = scaledDiameter;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Scale context for DPI - all drawing operations use original diameter
        if (dpiScale !== 1) {
            ctx.scale(dpiScale, dpiScale);
        }

        const radius = diameter / 2;
        const center = { x: radius, y: radius };

        // Save initial state before clipping
        ctx.save();

        // Create circular clipping path for background
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw meta token background
        try {
            const bgPath = `${CONFIG.ASSETS.CHARACTER_BACKGROUNDS}${this.options.metaBackground || this.options.characterBackground}.png`;
            const bgImage = await this.getLocalImage(bgPath);
            this.drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            // Fallback to solid color if background fails (unless transparent mode)
            if (!this.options.transparentBackground) {
                ctx.fillStyle = DEFAULT_COLORS.FALLBACK_BACKGROUND;
                ctx.fill();
            }
        }

        // Restore context to remove clipping path before drawing text
        ctx.restore();

        // Draw "PANDEMONIUM" and "INSTITUTE" in center (two lines)
        this.drawPandemoniumText(ctx, diameter);

        // Draw "BLOOD ON THE CLOCKTOWER" curved at bottom
        this.drawCurvedText(
            ctx,
            'BLOOD ON THE CLOCKTOWER',
            center.x,
            center.y,
            radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            this.options.characterNameFont,
            diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO * META_TOKEN_LAYOUT.BOTC_TEXT_SIZE_FACTOR,
            'bottom',
            DEFAULT_COLORS.TEXT_PRIMARY,
            this.options.fontSpacing.characterName
        );

        return canvas;
    }

    /**
     * Draw Pandemonium Institute text (two lines centered)
     * @param ctx - Canvas context
     * @param diameter - Token diameter
     */
    private drawPandemoniumText(ctx: CanvasRenderingContext2D, diameter: number): void {
        ctx.save();

        const fontSize = diameter * META_TOKEN_LAYOUT.PANDEMONIUM_TEXT_SIZE;
        ctx.font = `bold ${fontSize}px "${this.options.characterNameFont}", Georgia, serif`;
        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add shadow for readability
        const shadowBlur = this.options.textShadow?.characterName ?? 4;
        ctx.shadowColor = DEFAULT_COLORS.TEXT_SHADOW;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowBlur / 2;
        ctx.shadowOffsetY = shadowBlur / 2;

        const lineHeight = fontSize * LINE_HEIGHTS.STANDARD;
        const centerY = diameter / 2;

        // Draw "PANDEMONIUM" on first line
        ctx.fillText('PANDEMONIUM', diameter / 2, centerY - lineHeight / 2);
        // Draw "INSTITUTE" on second line
        ctx.fillText('INSTITUTE', diameter / 2, centerY + lineHeight / 2);

        ctx.restore();
    }

    /**
     * Draw centered text with word wrapping
     * @param ctx - Canvas context
     * @param text - Text to draw
     * @param diameter - Token diameter
     */
    private drawCenteredText(ctx: CanvasRenderingContext2D, text: string, diameter: number): void {
        ctx.save();

        const fontSize = diameter * META_TOKEN_LAYOUT.CENTERED_TEXT_SIZE;
        ctx.font = `bold ${fontSize}px "${this.options.characterNameFont}", Georgia, serif`;
        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Add shadow for readability
        const shadowBlur = this.options.textShadow?.characterName ?? 4;
        ctx.shadowColor = DEFAULT_COLORS.TEXT_SHADOW;
        ctx.shadowBlur = shadowBlur;
        ctx.shadowOffsetX = shadowBlur / 2;
        ctx.shadowOffsetY = shadowBlur / 2;

        // Word wrap the text
        const maxWidth = diameter * META_TOKEN_LAYOUT.CENTERED_TEXT_MAX_WIDTH;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        // Draw lines centered vertically
        const lineHeight = fontSize * LINE_HEIGHTS.STANDARD;
        const totalHeight = lines.length * lineHeight;
        const startY = (diameter - totalHeight) / 2 + fontSize / 2;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], diameter / 2, startY + i * lineHeight);
        }

        ctx.restore();
    }

    /**
     * Generate an almanac QR code token
     * @param almanacUrl - URL for the QR code
     * @param scriptName - Script name to overlay
     * @returns Generated canvas element
     */
    async generateAlmanacQRToken(almanacUrl: string, scriptName: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const dpiScale = this.options.dpi / 300;
        const scaledDiameter = Math.floor(diameter * dpiScale);

        const canvas = document.createElement('canvas');
        canvas.width = scaledDiameter;
        canvas.height = scaledDiameter;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            throw new Error('Failed to get canvas context');
        }

        // Enable high-quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Scale context for DPI - all drawing operations use original diameter
        if (dpiScale !== 1) {
            ctx.scale(dpiScale, dpiScale);
        }

        const radius = diameter / 2;
        const center = { x: radius, y: radius };

        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw meta token background
        try {
            const bgPath = `${CONFIG.ASSETS.CHARACTER_BACKGROUNDS}${this.options.metaBackground || this.options.characterBackground}.png`;
            const bgImage = await this.getLocalImage(bgPath);
            this.drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            // Fallback to white background
            ctx.fillStyle = QR_COLORS.LIGHT;
            ctx.fill();
        }

        // Generate QR code
        const qrSize = Math.floor(diameter * QR_TOKEN_LAYOUT.QR_CODE_SIZE);
        const qrCanvas = await this.generateQRCode(almanacUrl, qrSize);

        // Draw QR code centered
        const qrOffset = (diameter - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrOffset, qrOffset - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET, qrSize, qrSize);

        // Restore context
        ctx.restore();

        // Draw white box behind script name text
        const boxWidth = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_WIDTH;
        const boxHeight = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_HEIGHT;
        const boxX = (diameter - boxWidth) / 2;
        const boxY = (diameter - boxHeight) / 2 - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET;

        ctx.fillStyle = QR_COLORS.LIGHT;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        // Draw script name in center using LHF Unlovable font
        this.drawQROverlayText(ctx, scriptName.toUpperCase(), diameter);

        // Draw "ALMANAC" curved at bottom
        this.drawCurvedText(
            ctx,
            'ALMANAC',
            center.x,
            center.y,
            radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            this.options.characterNameFont,
            diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
            'bottom',
            QR_COLORS.DARK,
            this.options.fontSpacing.characterName
        );

        return canvas;
    }

    /**
     * Generate QR code canvas
     * @param text - Text to encode
     * @param size - QR code size
     * @returns Canvas with QR code
     */
    private async generateQRCode(text: string, size: number): Promise<HTMLCanvasElement> {
        return new Promise((resolve, reject) => {
            const QRCodeLib = window.QRCode;
            if (!QRCodeLib) {
                reject(new Error('QRCode library not loaded'));
                return;
            }

            // Create a temporary container
            const container = document.createElement('div');
            container.style.cssText = 'position:absolute;left:-9999px;top:-9999px;';
            document.body.appendChild(container);

            try {
                // Generate QR code with high error correction
                new QRCodeLib(container, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: QR_COLORS.DARK,
                    colorLight: QR_COLORS.LIGHT,
                    correctLevel: QR_COLORS.ERROR_CORRECTION_LEVEL
                });

                // Wait a bit for the QR code to be generated
                setTimeout(() => {
                    const qrCanvas = container.querySelector('canvas');
                    if (qrCanvas) {
                        // Clone the canvas
                        const resultCanvas = document.createElement('canvas');
                        resultCanvas.width = qrCanvas.width;
                        resultCanvas.height = qrCanvas.height;
                        const resultCtx = resultCanvas.getContext('2d');
                        if (resultCtx) {
                            resultCtx.drawImage(qrCanvas, 0, 0);
                        }
                        document.body.removeChild(container);
                        resolve(resultCanvas);
                    } else {
                        document.body.removeChild(container);
                        reject(new Error('Failed to generate QR code canvas'));
                    }
                }, TIMING.QR_GENERATION_DELAY);
            } catch (error) {
                document.body.removeChild(container);
                reject(error);
            }
        });
    }

    /**
     * Draw text overlay on QR code
     * @param ctx - Canvas context
     * @param text - Text to draw
     * @param diameter - Token diameter
     */
    private drawQROverlayText(ctx: CanvasRenderingContext2D, text: string, diameter: number): void {
        ctx.save();

        const fontSize = diameter * QR_TOKEN_LAYOUT.OVERLAY_TEXT_SIZE;
        ctx.font = `bold ${fontSize}px "LHF Unlovable", Georgia, serif`;
        ctx.fillStyle = QR_COLORS.DARK;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Word wrap the text for long names
        const maxWidth = diameter * QR_TOKEN_LAYOUT.OVERLAY_TEXT_MAX_WIDTH;
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }

        // Draw lines centered vertically (slightly above center)
        const lineHeight = fontSize * LINE_HEIGHTS.TIGHT;
        const totalHeight = lines.length * lineHeight;
        const startY = (diameter - totalHeight) / 2 + fontSize / 2 - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET;

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], diameter / 2, startY + i * lineHeight);
        }

        ctx.restore();
    }

    /**
     * Clear image cache
     */
    clearCache(): void {
        this.imageCache.clear();
    }

}

/**
 * Progress state for token generation tracking
 */
interface ProgressState {
    processed: number;
    total: number;
    callback: ProgressCallback | null;
}

/**
 * Update progress and call callback if provided
 * @param state - Progress state object
 */
function updateProgress(state: ProgressState): void {
    state.processed++;
    if (state.callback) {
        state.callback(state.processed, state.total);
    }
}

/**
 * Calculate total token count including meta tokens
 * @param characters - Array of characters
 * @param options - Generation options
 * @param scriptMeta - Script metadata
 * @returns Total token count
 */
function calculateTotalTokenCount(
    characters: Character[],
    options: Partial<GenerationOptions>,
    scriptMeta: ScriptMeta | null
): number {
    let metaTokenCount = 0;
    if (options.pandemoniumToken) metaTokenCount++;
    if (options.scriptNameToken && scriptMeta?.name) metaTokenCount++;
    if (options.almanacToken && scriptMeta?.almanac) metaTokenCount++;

    const characterTokenCount = characters.reduce((sum, char) => {
        return sum + 1 + (char.reminders?.length ?? 0);
    }, 0);

    return characterTokenCount + metaTokenCount;
}

/**
 * Generate meta tokens (Pandemonium, Script Name, Almanac QR)
 * @param generator - Token generator instance
 * @param options - Generation options
 * @param scriptMeta - Script metadata
 * @param progress - Progress state
 * @param dpi - DPI setting for calculating diameter
 * @returns Array of meta tokens
 */
async function generateMetaTokens(
    generator: TokenGenerator,
    options: Partial<GenerationOptions>,
    scriptMeta: ScriptMeta | null,
    progress: ProgressState,
    dpi: number
): Promise<Token[]> {
    const tokens: Token[] = [];

    // Generate Pandemonium Institute token
    if (options.pandemoniumToken) {
        try {
            const canvas = await generator.generatePandemoniumToken();
            tokens.push({
                type: 'pandemonium',
                name: 'Pandemonium Institute',
                filename: '_pandemonium_institute',
                team: 'meta',
                canvas,
                diameter: CONFIG.TOKEN.ROLE_DIAMETER_INCHES * dpi
            });
        } catch (error) {
            console.error('Failed to generate pandemonium token:', error);
        }
        updateProgress(progress);
    }

    // Generate Script Name token
    if (options.scriptNameToken && scriptMeta?.name) {
        try {
            const canvas = await generator.generateScriptNameToken(
                scriptMeta.name,
                scriptMeta.author
            );
            tokens.push({
                type: 'script-name',
                name: scriptMeta.name,
                filename: '_script_name',
                team: 'meta',
                canvas,
                diameter: CONFIG.TOKEN.ROLE_DIAMETER_INCHES * dpi
            });
        } catch (error) {
            console.error('Failed to generate script name token:', error);
        }
        updateProgress(progress);
    }

    // Generate Almanac QR token
    if (options.almanacToken && scriptMeta?.almanac && scriptMeta?.name) {
        try {
            const canvas = await generator.generateAlmanacQRToken(
                scriptMeta.almanac,
                scriptMeta.name
            );
            tokens.push({
                type: 'almanac',
                name: `${scriptMeta.name} Almanac`,
                filename: '_almanac_qr',
                team: 'meta',
                canvas,
                diameter: CONFIG.TOKEN.ROLE_DIAMETER_INCHES * dpi
            });
        } catch (error) {
            console.error('Failed to generate almanac QR token:', error);
        }
        updateProgress(progress);
    }

    return tokens;
}

/**
 * Generate a single character token with unique filename
 * @param generator - Token generator instance
 * @param character - Character data
 * @param nameCount - Map for tracking duplicate names
 * @param dpi - DPI setting for calculating diameter
 * @returns Character token or null if generation fails
 */
async function generateSingleCharacterToken(
    generator: TokenGenerator,
    character: Character,
    nameCount: Map<string, number>,
    dpi: number
): Promise<Token | null> {
    if (!character.name) return null;

    try {
        const canvas = await generator.generateCharacterToken(character);
        const baseName = character.name.replace(/[^a-zA-Z0-9]/g, '_');

        // Handle duplicates
        if (!nameCount.has(baseName)) {
            nameCount.set(baseName, 0);
        }
        const count = nameCount.get(baseName) ?? 0;
        nameCount.set(baseName, count + 1);

        const filename = count === 0 ? baseName : `${baseName}_${String(count).padStart(2, '0')}`;

        return {
            type: 'character',
            name: character.name,
            filename,
            team: (character.team || 'townsfolk') as Team,
            canvas,
            diameter: CONFIG.TOKEN.ROLE_DIAMETER_INCHES * dpi,
            hasReminders: (character.reminders?.length ?? 0) > 0,
            reminderCount: character.reminders?.length ?? 0
        };
    } catch (error) {
        console.error(`Failed to generate token for ${character.name}:`, error);
        return null;
    }
}

/**
 * Generate reminder tokens for a character
 * @param generator - Token generator instance
 * @param character - Parent character data
 * @param progress - Progress state
 * @param dpi - DPI setting for calculating diameter
 * @returns Array of reminder tokens
 */
async function generateReminderTokensForCharacter(
    generator: TokenGenerator,
    character: Character,
    progress: ProgressState,
    dpi: number
): Promise<Token[]> {
    const tokens: Token[] = [];

    if (!character.reminders || !Array.isArray(character.reminders)) {
        return tokens;
    }

    const reminderNameCount = new Map<string, number>();

    for (const reminder of character.reminders) {
        try {
            const canvas = await generator.generateReminderToken(character, reminder);
            const reminderBaseName = `${character.name}_${reminder}`.replace(/[^a-zA-Z0-9]/g, '_');

            // Handle duplicate reminders
            if (!reminderNameCount.has(reminderBaseName)) {
                reminderNameCount.set(reminderBaseName, 0);
            }
            const count = reminderNameCount.get(reminderBaseName) ?? 0;
            reminderNameCount.set(reminderBaseName, count + 1);

            const filename = count === 0 ? reminderBaseName : `${reminderBaseName}_${String(count).padStart(2, '0')}`;

            tokens.push({
                type: 'reminder',
                name: `${character.name} - ${reminder}`,
                filename,
                team: (character.team || 'townsfolk') as Team,
                canvas,
                diameter: CONFIG.TOKEN.REMINDER_DIAMETER_INCHES * dpi,
                parentCharacter: character.name,
                reminderText: reminder
            });
        } catch (error) {
            console.error(`Failed to generate reminder token "${reminder}" for ${character.name}:`, error);
        }

        updateProgress(progress);
    }

    return tokens;
}

/**
 * Generate character and reminder tokens for all characters
 * @param generator - Token generator instance
 * @param characters - Array of characters
 * @param progress - Progress state
 * @param dpi - DPI setting for diameter calculations
 * @returns Array of character and reminder tokens
 */
async function generateCharacterAndReminderTokens(
    generator: TokenGenerator,
    characters: Character[],
    progress: ProgressState,
    dpi: number
): Promise<Token[]> {
    const tokens: Token[] = [];
    const nameCount = new Map<string, number>();

    for (const character of characters) {
        // Generate character token
        const charToken = await generateSingleCharacterToken(generator, character, nameCount, dpi);
        if (charToken) {
            tokens.push(charToken);
        }
        updateProgress(progress);

        // Generate reminder tokens
        const reminderTokens = await generateReminderTokensForCharacter(generator, character, progress, dpi);
        tokens.push(...reminderTokens);
    }

    return tokens;
}

/**
 * Generate all tokens for a list of characters
 * @param characters - Array of character objects
 * @param options - Generation options
 * @param progressCallback - Progress callback function
 * @param scriptMeta - Optional script metadata for meta tokens
 * @returns Array of token objects with canvas and metadata
 */
export async function generateAllTokens(
    characters: Character[],
    options: Partial<GenerationOptions> = {},
    progressCallback: ProgressCallback | null = null,
    scriptMeta: ScriptMeta | null = null
): Promise<Token[]> {
    // Extract transparentBackground from pngSettings for TokenGenerator
    const generatorOptions = {
        ...options,
        transparentBackground: options.pngSettings?.transparentBackground ?? false,
    };
    const generator = new TokenGenerator(generatorOptions);

    // Calculate total and create progress state
    const total = calculateTotalTokenCount(characters, options, scriptMeta);
    const progress: ProgressState = {
        processed: 0,
        total,
        callback: progressCallback
    };

    // Get DPI value for diameter calculations
    const dpi = options.dpi ?? CONFIG.PDF.DPI;

    // Generate character and reminder tokens first
    const characterTokens = await generateCharacterAndReminderTokens(generator, characters, progress, dpi);

    // Generate meta tokens last
    const metaTokens = await generateMetaTokens(generator, options, scriptMeta, progress, dpi);

    return [...characterTokens, ...metaTokens];
}

export default {
    TokenGenerator,
    generateAllTokens
};
