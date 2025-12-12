/**
 * Blood on the Clocktower Token Generator
 * Token Generator - Canvas operations for token generation
 */

import CONFIG from '../config.js';
import {
    CHARACTER_LAYOUT,
    REMINDER_LAYOUT,
    META_TOKEN_LAYOUT,
    QR_TOKEN_LAYOUT,
    LINE_HEIGHTS,
    TOKEN_COUNT_BADGE,
    DEFAULT_COLORS,
    QR_COLORS,
    TokenType,
    type TokenTypeValue
} from '../constants.js';
import { loadImage, loadLocalImage, globalImageCache } from '../utils/index.js';
import { isBuiltInAsset, getBuiltInAssetPath } from '../constants/builtInAssets.js';
import { isAssetReference, resolveAssetUrl } from '../../services/upload/assetResolver.js';
import type { AssetType } from '../../services/upload/types.js';
import {
    drawImageCover,
    createCircularClipPath,
    createCanvas,
    type Point,
    type CanvasContext,
    calculateCircularTextLayout,
    type TextLayoutResult
} from '../canvas/index.js';
import {
    drawCurvedText,
    drawCenteredWrappedText,
    drawTwoLineCenteredText,
    drawAbilityText,
    drawQROverlayText
} from '../canvas/index.js';
import { drawLeaves, type LeafDrawingOptions } from '../canvas/index.js';
import { generateQRCode } from '../canvas/index.js';
import { getCharacterImageUrl, countReminders } from '../data/index.js';
import type { Character } from '../types/index.js';
import {
    type TokenGeneratorOptions,
    type MetaTokenContentRenderer,
    DEFAULT_TOKEN_OPTIONS
} from '../types/tokenOptions.js';
import {
    IconLayoutStrategyFactory,
    type IconLayoutStrategy,
    type LayoutContext
} from './iconLayoutStrategies.js';
import { TokenCreationError, ValidationError } from '../errors.js';

// Re-export generateAllTokens for backward compatibility
export { generateAllTokens } from './batchGenerator.js';

// ============================================================================
// TOKEN GENERATOR CLASS
// ============================================================================

/**
 * TokenGenerator class handles all canvas operations for creating tokens
 */
export class TokenGenerator {
    private options: TokenGeneratorOptions;
    // Note: Using globalImageCache singleton instead of instance cache
    // for better cache utilization across regenerations

    constructor(options: Partial<TokenGeneratorOptions> = {}) {
        this.options = { ...DEFAULT_TOKEN_OPTIONS, ...options };
        if (options.fontSpacing) {
            this.options.fontSpacing = { ...DEFAULT_TOKEN_OPTIONS.fontSpacing, ...options.fontSpacing };
        }
        if (options.textShadow) {
            this.options.textShadow = { ...DEFAULT_TOKEN_OPTIONS.textShadow, ...options.textShadow };
        }
    }

    /** Update generator options */
    updateOptions(newOptions: Partial<TokenGeneratorOptions>): void {
        this.options = { ...this.options, ...newOptions };
    }

    // ========================================================================
    // IMAGE CACHING (using global singleton)
    // ========================================================================

    async getCachedImage(url: string): Promise<HTMLImageElement> {
        return globalImageCache.get(url, false);
    }

    async getLocalImage(path: string): Promise<HTMLImageElement> {
        return globalImageCache.get(path, true);
    }

    clearCache(): void {
        globalImageCache.clear();
    }

    /**
     * Pre-warm the image cache with all character images
     * This improves performance by loading all images before generation starts
     * @param characters - Array of characters to pre-load images for
     */
    async prewarmImageCache(characters: Character[]): Promise<void> {
        const imageUrls = new Set<string>();

        // Collect all unique image URLs
        for (const character of characters) {
            const url = getCharacterImageUrl(character.image);
            if (url) {
                imageUrls.add(url);
            }
        }

        // Pre-load all images in parallel
        await Promise.allSettled(
            Array.from(imageUrls).map(url => this.getCachedImage(url))
        );
    }

    // ========================================================================
    // CANVAS UTILITIES
    // ========================================================================

    private createBaseCanvas(diameter: number): CanvasContext {
        return createCanvas(diameter, { dpi: this.options.dpi });
    }

    private applyCircularClip(ctx: CanvasRenderingContext2D, center: Point, radius: number): void {
        ctx.save();
        createCircularClipPath(ctx, center, radius);
    }

    /**
     * Resolve a decorative asset value to a loadable image URL/path
     * Handles built-in asset IDs, user-uploaded asset references, and legacy paths
     */
    private async resolveDecorativeAsset(
        value: string,
        assetType: AssetType,
        legacyPathPrefix: string
    ): Promise<string | null> {
        if (!value || value === 'none') return null;

        // Check if it's a user-uploaded asset reference (asset:uuid)
        if (isAssetReference(value)) {
            const resolvedUrl = await resolveAssetUrl(value);
            return resolvedUrl || null;
        }

        // Check if it's a built-in asset ID
        if (isBuiltInAsset(value, assetType)) {
            return getBuiltInAssetPath(value, assetType);
        }

        // Legacy fallback: treat as filename pattern
        return `${legacyPathPrefix}${value}.png`;
    }

    private async drawBackground(
        ctx: CanvasRenderingContext2D,
        backgroundName: string,
        diameter: number,
        fallbackColor: string = DEFAULT_COLORS.FALLBACK_BACKGROUND
    ): Promise<void> {
        try {
            const bgPath = await this.resolveDecorativeAsset(
                backgroundName,
                'token-background',
                CONFIG.ASSETS.CHARACTER_BACKGROUNDS
            );

            if (!bgPath) {
                if (!this.options.transparentBackground) {
                    ctx.fillStyle = fallbackColor;
                    ctx.fill();
                }
                return;
            }

            // Determine if it's a local path or a blob URL
            const bgImage = bgPath.startsWith('blob:')
                ? await this.getCachedImage(bgPath)
                : await this.getLocalImage(bgPath);
            drawImageCover(ctx, bgImage, diameter, diameter);
        } catch {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = fallbackColor;
                ctx.fill();
            }
        }
    }

    // ========================================================================
    // CHARACTER TOKEN GENERATION
    // ========================================================================

    async generateCharacterToken(character: Character, imageOverride?: string): Promise<HTMLCanvasElement> {
        // Input validation
        if (!character?.name) {
            throw new ValidationError('Character must have a name');
        }
        if (this.options.dpi <= 0) {
            throw new ValidationError('DPI must be positive');
        }

        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);
        
        // Draw background based on type selection
        if (this.options.characterBackgroundType === 'color') {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = this.options.characterBackgroundColor || '#FFFFFF';
                ctx.fill();
            }
        } else {
            await this.drawBackground(ctx, this.options.characterBackground, diameter);
        }
        
        // Determine ability text to display:
        // - Bootlegger rules take priority when enabled and present (replaces regular ability text)
        // - Otherwise use regular ability text if enabled
        const bootleggerText = this.options.bootleggerRules?.trim();
        const abilityTextToDisplay = bootleggerText
            ? bootleggerText
            : (this.options.displayAbilityText ? character.ability : undefined);
        const hasAbilityText = Boolean(abilityTextToDisplay?.trim());

        // Calculate text layout once (replaces redundant calculation)
        let abilityTextLayout: TextLayoutResult | undefined;
        if (hasAbilityText) {
            abilityTextLayout = this.calculateAbilityTextLayout(ctx, abilityTextToDisplay!, diameter);
        }

        // Draw character image with adjusted layout based on ability text presence
        await this.drawCharacterImage(
            ctx,
            character,
            diameter,
            TokenType.CHARACTER,
            imageOverride,
            hasAbilityText,
            abilityTextLayout
        );

        if (character.setup) {
            await this.drawSetupFlower(ctx, diameter);
        }

        ctx.restore();

        if (this.options.maximumLeaves > 0) {
            await this.drawLeavesOnToken(ctx, diameter);
        }

        if (hasAbilityText) {
            this.drawCharacterAbilityText(ctx, abilityTextToDisplay!, diameter);
        }

        if (character.name) {
            this.drawCharacterName(ctx, character.name, center, radius, diameter);
        }

        if (this.options.tokenCount) {
            const reminderCount = countReminders(character);
            if (reminderCount > 0) {
                this.drawTokenCount(ctx, reminderCount, diameter);
            }
        }

        return canvas;
    }

    /**
     * Calculate ability text layout (optimized version using cached layout calculation)
     * @param ctx - Canvas context
     * @param ability - Ability text
     * @param diameter - Token diameter
     * @returns Text layout result with lines and height
     */
    private calculateAbilityTextLayout(ctx: CanvasRenderingContext2D, ability: string, diameter: number): TextLayoutResult {
        ctx.save();
        const fontSize = diameter * CONFIG.FONTS.ABILITY_TEXT.SIZE_RATIO;
        ctx.font = `${fontSize}px "${this.options.abilityTextFont}", sans-serif`;
        const lineHeightMultiplier = CONFIG.FONTS.ABILITY_TEXT.LINE_HEIGHT ?? LINE_HEIGHTS.STANDARD;
        const startY = diameter * CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION;

        // Use optimized circular text layout calculation
        const layout = calculateCircularTextLayout(
            ctx,
            ability,
            diameter,
            fontSize,
            lineHeightMultiplier,
            startY,
            CHARACTER_LAYOUT.ABILITY_TEXT_CIRCULAR_PADDING
        );

        ctx.restore();
        return layout;
    }

    /**
     * Draw character image on token (optimized with layout strategies)
     * @param ctx - Canvas context
     * @param character - Character data
     * @param diameter - Token diameter
     * @param tokenType - Type of token
     * @param imageOverride - Optional image URL override
     * @param hasAbilityText - Whether character has ability text
     * @param abilityTextLayout - Pre-calculated ability text layout
     */
    private async drawCharacterImage(
        ctx: CanvasRenderingContext2D,
        character: Character,
        diameter: number,
        tokenType: TokenTypeValue,
        imageOverride?: string,
        hasAbilityText?: boolean,
        abilityTextLayout?: TextLayoutResult
    ): Promise<void> {
        const imageUrl = imageOverride || getCharacterImageUrl(character.image);
        if (!imageUrl) return;

        try {
            const charImage = await this.getCachedImage(imageUrl);

            // Get icon settings for this token type
            const defaultIconSettings = { scale: 1.0, offsetX: 0, offsetY: 0 };
            const iconSettings = this.options.iconSettings?.[tokenType as 'character' | 'reminder' | 'meta'] || defaultIconSettings;

            // Create layout context
            const layoutContext: LayoutContext = {
                diameter,
                iconScale: iconSettings.scale,
                iconOffsetX: iconSettings.offsetX,
                iconOffsetY: iconSettings.offsetY
            };

            // Get appropriate layout strategy
            let strategy: IconLayoutStrategy;
            if (tokenType === TokenType.CHARACTER) {
                const abilityTextStartY = abilityTextLayout ? diameter * CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION : undefined;
                strategy = IconLayoutStrategyFactory.create(
                    tokenType,
                    hasAbilityText,
                    abilityTextLayout?.totalHeight,
                    abilityTextStartY
                );
            } else {
                strategy = IconLayoutStrategyFactory.create(tokenType);
            }

            // Calculate layout using strategy
            const layout = strategy.calculate(layoutContext);

            // Draw image at calculated position
            ctx.drawImage(
                charImage,
                layout.position.x,
                layout.position.y,
                layout.size,
                layout.size
            );
        } catch (error) {
            throw new TokenCreationError(
                `Failed to load character image`,
                character.name,
                error instanceof Error ? error : new Error(String(error))
            );
        }
    }

    private async drawSetupFlower(ctx: CanvasRenderingContext2D, diameter: number): Promise<void> {
        try {
            const flowerPath = await this.resolveDecorativeAsset(
                this.options.setupFlowerStyle,
                'setup-flower',
                CONFIG.ASSETS.SETUP_FLOWERS
            );

            if (!flowerPath) return;

            // Determine if it's a local path or a blob URL
            const flowerImage = flowerPath.startsWith('blob:')
                ? await this.getCachedImage(flowerPath)
                : await this.getLocalImage(flowerPath);
            drawImageCover(ctx, flowerImage, diameter, diameter);
        } catch (error) {
            // Log warning but don't throw - setup flower is optional decoration
            console.warn(`Could not load setup flower: ${this.options.setupFlowerStyle}`, error);
        }
    }

    private async drawLeavesOnToken(ctx: CanvasRenderingContext2D, diameter: number): Promise<void> {
        const leafOptions: LeafDrawingOptions = {
            maximumLeaves: this.options.maximumLeaves,
            leafPopulationProbability: this.options.leafPopulationProbability,
            leafGeneration: this.options.leafGeneration,
            leafArcSpan: this.options.leafArcSpan,
            leafSlots: this.options.leafSlots
        };
        await drawLeaves(ctx, diameter, leafOptions);
    }

    private drawCharacterAbilityText(ctx: CanvasRenderingContext2D, ability: string, diameter: number): void {
        drawAbilityText(
            ctx, ability, diameter,
            this.options.abilityTextFont,
            CONFIG.FONTS.ABILITY_TEXT.SIZE_RATIO,
            CONFIG.FONTS.ABILITY_TEXT.LINE_HEIGHT ?? LINE_HEIGHTS.STANDARD,
            CHARACTER_LAYOUT.ABILITY_TEXT_MAX_WIDTH,
            CHARACTER_LAYOUT.ABILITY_TEXT_Y_POSITION,
            this.options.abilityTextColor,
            this.options.fontSpacing.abilityText,
            this.options.textShadow?.abilityText ?? 3
        );
    }

    private drawCharacterName(
        ctx: CanvasRenderingContext2D,
        name: string,
        center: Point,
        radius: number,
        diameter: number
    ): void {
        drawCurvedText(ctx, {
            text: name.toUpperCase(),
            centerX: center.x,
            centerY: center.y,
            radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.characterNameFont,
            fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
            position: 'bottom',
            color: this.options.characterNameColor,
            letterSpacing: this.options.fontSpacing.characterName,
            shadowBlur: this.options.textShadow?.characterName ?? 4
        });
    }

    private drawTokenCount(ctx: CanvasRenderingContext2D, count: number, diameter: number): void {
        ctx.save();
        const fontSize = diameter * CONFIG.FONTS.TOKEN_COUNT.SIZE_RATIO;
        ctx.font = `bold ${fontSize}px "${this.options.characterNameFont}", Georgia, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const y = diameter * CHARACTER_LAYOUT.TOKEN_COUNT_Y_POSITION;

        ctx.beginPath();
        ctx.arc(diameter / 2, y, fontSize * TOKEN_COUNT_BADGE.BACKGROUND_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = DEFAULT_COLORS.BADGE_BACKGROUND;
        ctx.fill();
        ctx.strokeStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.lineWidth = TOKEN_COUNT_BADGE.STROKE_WIDTH;
        ctx.stroke();

        ctx.fillStyle = DEFAULT_COLORS.TEXT_PRIMARY;
        ctx.fillText(count.toString(), diameter / 2, y);
        ctx.restore();
    }

    // ========================================================================
    // REMINDER TOKEN GENERATION
    // ========================================================================

    async generateReminderToken(character: Character, reminderText: string, imageOverride?: string): Promise<HTMLCanvasElement> {
        // Input validation
        if (!character?.name) {
            throw new ValidationError('Character must have a name for reminder token');
        }
        if (!reminderText?.trim()) {
            throw new ValidationError('Reminder text cannot be empty');
        }
        if (this.options.dpi <= 0) {
            throw new ValidationError('DPI must be positive');
        }

        const diameter = CONFIG.TOKEN.REMINDER_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);

        // Draw background based on type selection
        if (this.options.reminderBackgroundType === 'image') {
            const bgImage = this.options.reminderBackgroundImage || 'character_background_1';
            await this.drawBackground(ctx, bgImage, diameter);
        } else {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = this.options.reminderBackground;
                ctx.fill();
            }
        }

        await this.drawCharacterImage(ctx, character, diameter, TokenType.REMINDER, imageOverride);
        ctx.restore();

        drawCurvedText(ctx, {
            text: reminderText.toUpperCase(),
            centerX: center.x,
            centerY: center.y,
            radius: radius * REMINDER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.characterReminderFont,
            fontSize: diameter * CONFIG.FONTS.REMINDER_TEXT.SIZE_RATIO,
            position: 'bottom',
            color: this.options.reminderTextColor,
            letterSpacing: this.options.fontSpacing.reminderText,
            shadowBlur: this.options.textShadow?.reminderText ?? 4
        });

        return canvas;
    }

    // ========================================================================
    // META TOKEN GENERATION
    // ========================================================================

    private async generateMetaToken(
        renderContent: MetaTokenContentRenderer,
        backgroundOverride?: string
    ): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);
        
        // Draw background based on type selection
        if (this.options.metaBackgroundType === 'color') {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = this.options.metaBackgroundColor || '#FFFFFF';
                ctx.fill();
            }
        } else {
            const bgName = backgroundOverride || this.options.metaBackground || this.options.characterBackground;
            await this.drawBackground(ctx, bgName, diameter);
        }
        
        ctx.restore();

        await renderContent(ctx, diameter, center, radius);
        return canvas;
    }

    async generateScriptNameToken(scriptName: string, author?: string, hideAuthor?: boolean): Promise<HTMLCanvasElement> {
        const metaFont = this.options.metaNameFont || this.options.characterNameFont;
        const metaColor = this.options.metaNameColor || DEFAULT_COLORS.TEXT_PRIMARY;
        
        // Try to load custom logo if provided
        let logoImage: HTMLImageElement | null = null;
        if (this.options.logoUrl) {
            try {
                logoImage = await this.getCachedImage(this.options.logoUrl);
            } catch {
                // Silently fall back to text-only token
                logoImage = null;
            }
        }
        
        return this.generateMetaToken(async (ctx, diameter, center, radius) => {
            if (logoImage) {
                // Draw logo image centered on token
                const maxSize = diameter * 0.7;
                const aspectRatio = logoImage.width / logoImage.height;
                let drawWidth: number, drawHeight: number;
                
                if (aspectRatio > 1) {
                    // Wider than tall
                    drawWidth = Math.min(logoImage.width, maxSize);
                    drawHeight = drawWidth / aspectRatio;
                } else {
                    // Taller than wide or square
                    drawHeight = Math.min(logoImage.height, maxSize);
                    drawWidth = drawHeight * aspectRatio;
                }
                
                const x = center.x - drawWidth / 2;
                const y = center.y - drawHeight / 2;
                ctx.drawImage(logoImage, x, y, drawWidth, drawHeight);
            } else {
                // Fall back to text-only
                drawCenteredWrappedText(ctx, {
                    text: scriptName.toUpperCase(),
                    diameter,
                    fontFamily: metaFont,
                    fontSizeRatio: META_TOKEN_LAYOUT.CENTERED_TEXT_SIZE,
                    maxWidthRatio: META_TOKEN_LAYOUT.CENTERED_TEXT_MAX_WIDTH,
                    color: metaColor,
                    shadowBlur: this.options.textShadow?.metaText ?? 4
                });
            }

            if (author && !hideAuthor) {
                drawCurvedText(ctx, {
                    text: author,
                    centerX: center.x,
                    centerY: center.y,
                    radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
                    fontFamily: metaFont,
                    fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO * META_TOKEN_LAYOUT.AUTHOR_TEXT_SIZE_FACTOR,
                    position: 'bottom',
                    color: metaColor,
                    letterSpacing: this.options.fontSpacing.metaText ?? 0,
                    shadowBlur: this.options.textShadow?.metaText ?? 4
                });
            }
        });
    }

    async generatePandemoniumToken(): Promise<HTMLCanvasElement> {
        // Load the Pandemonium Institute image
        const pandemoniumImage = await this.getCachedImage('/images/Pandemonium_Institute/the_pandemonium_institute.webp');
        
        return this.generateMetaToken(async (ctx, diameter, center) => {
            // Draw image centered on token
            const maxSize = diameter * 0.75;
            const aspectRatio = pandemoniumImage.width / pandemoniumImage.height;
            let drawWidth: number, drawHeight: number;
            
            if (aspectRatio > 1) {
                // Wider than tall
                drawWidth = Math.min(pandemoniumImage.width, maxSize);
                drawHeight = drawWidth / aspectRatio;
            } else {
                // Taller than wide or square
                drawHeight = Math.min(pandemoniumImage.height, maxSize);
                drawWidth = drawHeight * aspectRatio;
            }
            
            const x = center.x - drawWidth / 2;
            const y = center.y - drawHeight / 2;
            ctx.drawImage(pandemoniumImage, x, y, drawWidth, drawHeight);
        });
    }

    async generateAlmanacQRToken(almanacUrl: string, scriptName: string): Promise<HTMLCanvasElement> {
        const diameter = CONFIG.TOKEN.ROLE_DIAMETER_INCHES * this.options.dpi;
        const { canvas, ctx, center, radius } = this.createBaseCanvas(diameter);

        this.applyCircularClip(ctx, center, radius);

        // Draw background based on type selection (same logic as generateMetaToken)
        if (this.options.metaBackgroundType === 'color') {
            if (!this.options.transparentBackground) {
                ctx.fillStyle = this.options.metaBackgroundColor || '#FFFFFF';
                ctx.fill();
            }
        } else {
            const bgName = this.options.metaBackground || this.options.characterBackground;
            await this.drawBackground(ctx, bgName, diameter, QR_COLORS.LIGHT);
        }

        // Generate and draw QR code
        const qrSize = Math.floor(diameter * QR_TOKEN_LAYOUT.QR_CODE_SIZE);
        const qrCanvas = await generateQRCode({ text: almanacUrl, size: qrSize });
        const qrOffset = (diameter - qrSize) / 2;
        ctx.drawImage(qrCanvas, qrOffset, qrOffset - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET, qrSize, qrSize);

        ctx.restore();

        // Draw white box behind script name
        const boxWidth = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_WIDTH;
        const boxHeight = diameter * QR_TOKEN_LAYOUT.TEXT_BOX_HEIGHT;
        const boxX = (diameter - boxWidth) / 2;
        const boxY = (diameter - boxHeight) / 2 - diameter * QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET;
        ctx.fillStyle = QR_COLORS.LIGHT;
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

        drawQROverlayText(
            ctx, scriptName.toUpperCase(), diameter, 'LHF Unlovable',
            QR_TOKEN_LAYOUT.OVERLAY_TEXT_SIZE,
            QR_TOKEN_LAYOUT.OVERLAY_TEXT_MAX_WIDTH,
            QR_TOKEN_LAYOUT.QR_VERTICAL_OFFSET,
            QR_COLORS.DARK
        );

        drawCurvedText(ctx, {
            text: 'ALMANAC',
            centerX: center.x,
            centerY: center.y,
            radius: radius * CHARACTER_LAYOUT.CURVED_TEXT_RADIUS,
            fontFamily: this.options.metaNameFont || this.options.characterNameFont,
            fontSize: diameter * CONFIG.FONTS.CHARACTER_NAME.SIZE_RATIO,
            position: 'bottom',
            color: QR_COLORS.DARK,
            letterSpacing: this.options.fontSpacing.metaText ?? 0,
            shadowBlur: 0
        });

        return canvas;
    }
}

export default { TokenGenerator };
